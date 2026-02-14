const http = require('http');
const { URL } = require('url');
const { Readable } = require('stream');

const PORT = Number(process.env.PORT || 4100);
const LM_STUDIO_BASE_URL = process.env.LM_STUDIO_BASE_URL || 'http://127.0.0.1:1234';
const LM_STUDIO_API_TOKEN = process.env.LM_STUDIO_API_TOKEN || '';
const LM_STUDIO_MODEL = process.env.LM_STUDIO_MODEL || '';
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 120000);
const SAFE_TIMEOUT_MS = Number.isFinite(REQUEST_TIMEOUT_MS) && REQUEST_TIMEOUT_MS > 0 ? REQUEST_TIMEOUT_MS : 120000;

const ALLOWED_ROUTES = {
  '/api/v1/chat': ['POST'],
  '/api/v1/models': ['GET'],
  '/api/v1/models/load': ['POST'],
  '/api/v1/models/unload': ['POST'],
  '/api/v1/models/download': ['POST'],
  '/api/v1/models/download/status': ['GET'],
};

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function normalizePathname(pathname) {
  if (!pathname || pathname === '/') return '/';
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (!origin || !isAllowedOrigin(origin)) return;

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function sendJson(req, res, statusCode, payload) {
  applyCors(req, res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function getHeaderValue(header) {
  if (!header) return undefined;
  return Array.isArray(header) ? header[0] : header;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
}

function copyUpstreamHeaders(upstreamHeaders, res) {
  upstreamHeaders.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
    res.setHeader(key, value);
  });
}

function createUpstreamHeaders(req) {
  const headers = {};
  const contentType = getHeaderValue(req.headers['content-type']);
  const accept = getHeaderValue(req.headers.accept);
  const incomingAuth = getHeaderValue(req.headers.authorization);

  if (contentType) headers['content-type'] = contentType;
  if (accept) headers.accept = accept;

  if (incomingAuth) {
    headers.authorization = incomingAuth;
  } else if (LM_STUDIO_API_TOKEN) {
    headers.authorization = `Bearer ${LM_STUDIO_API_TOKEN}`;
  }

  return headers;
}

function parseJson(buffer) {
  if (!buffer || buffer.length === 0) return {};
  return JSON.parse(buffer.toString('utf8'));
}

async function handleProxy(req, res, pathname, search) {
  const method = (req.method || 'GET').toUpperCase();
  const routeMethods = ALLOWED_ROUTES[pathname];

  if (!routeMethods) {
    sendJson(req, res, 404, { error: 'Not Found', message: 'Route is not supported by X-DEV-TESTBLOCK.' });
    return;
  }

  if (!routeMethods.includes(method)) {
    res.setHeader('Allow', routeMethods.join(', '));
    sendJson(req, res, 405, { error: 'Method Not Allowed' });
    return;
  }

  let requestBodyBuffer = Buffer.alloc(0);
  if (method === 'POST') {
    try {
      requestBodyBuffer = await readBody(req);
    } catch (err) {
      sendJson(req, res, 400, { error: 'Bad Request', message: `Failed to read request body: ${err.message}` });
      return;
    }
  }

  let upstreamBody;
  if (method === 'POST' && requestBodyBuffer.length > 0) {
    upstreamBody = requestBodyBuffer;
  }

  const contentType = getHeaderValue(req.headers['content-type']) || '';
  if (pathname === '/api/v1/chat' && method === 'POST') {
    if (!contentType.toLowerCase().includes('application/json')) {
      sendJson(req, res, 400, { error: 'Bad Request', message: 'Expected application/json for /api/v1/chat.' });
      return;
    }

    let payload;
    try {
      payload = parseJson(requestBodyBuffer);
    } catch {
      sendJson(req, res, 400, { error: 'Bad Request', message: 'Invalid JSON payload for /api/v1/chat.' });
      return;
    }

    if ((!payload.model || String(payload.model).trim() === '') && LM_STUDIO_MODEL) {
      payload.model = LM_STUDIO_MODEL;
    }

    upstreamBody = JSON.stringify(payload);
  }

  const upstreamUrl = new URL(`${pathname}${search}`, LM_STUDIO_BASE_URL);
  const headers = createUpstreamHeaders(req);
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, SAFE_TIMEOUT_MS);

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers,
      body: upstreamBody,
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    sendJson(req, res, 502, {
      error: 'Bad Gateway',
      message: `Failed to reach LM Studio at ${LM_STUDIO_BASE_URL}: ${err.message}`,
    });
    return;
  }
  clearTimeout(timeout);

  res.statusCode = upstreamResponse.status;
  copyUpstreamHeaders(upstreamResponse.headers, res);
  applyCors(req, res);

  if (!upstreamResponse.body) {
    res.end();
    return;
  }

  try {
    Readable.fromWeb(upstreamResponse.body).pipe(res);
  } catch (err) {
    sendJson(req, res, 502, { error: 'Bad Gateway', message: `Failed to stream upstream response: ${err.message}` });
  }
}

const server = http.createServer(async (req, res) => {
  applyCors(req, res);

  if ((req.method || '').toUpperCase() === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url || '/', 'http://localhost');
  const pathname = normalizePathname(parsedUrl.pathname);
  const search = parsedUrl.search || '';

  if (pathname === '/health') {
    if ((req.method || 'GET').toUpperCase() !== 'GET') {
      res.setHeader('Allow', 'GET');
      sendJson(req, res, 405, { error: 'Method Not Allowed' });
      return;
    }

    sendJson(req, res, 200, { ok: true });
    return;
  }

  await handleProxy(req, res, pathname, search);
});

server.listen(PORT, () => {
  console.log(`[X-DEV-TESTBLOCK] listening on port ${PORT}`);
  console.log(`[X-DEV-TESTBLOCK] forwarding LM Studio traffic to ${LM_STUDIO_BASE_URL}`);
});
