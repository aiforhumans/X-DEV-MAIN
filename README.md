# X-DEV-MAIN

**The Modular Development Framework for Composable Applications**

X-DEV-MAIN is a local orchestration framework that allows you to build applications by combining independent "Dev-Blocks" (like UI, API, Database) using simple JSON recipes. It is designed to enable "Zero-Config Composition" and rapid local development.

## Why?
- **No Rebuilds:** Swap a backend or frontend instantly by changing a config file.
- **Modular:** Develop blocks in isolation; combine them at runtime.
- **Local-First:** Designed for local AI development (e.g., connecting LM Studio to a Chat UI).

## Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm or pnpm

### 2. Installation
```bash
npm install
```

### 3. Running an Application
The framework comes with a sample recipe `local-chat` that connects a mock UI to a mock API.

```bash
# Run the local-chat recipe
npm start -- run local-chat
```

This command will:
1.  Read `recipes/local-chat.json`.
2.  Find the blocks `x-dev-api` and `x-dev-ui` in the `blocks/` directory.
3.  (Coming Soon) Start them on the configured ports (3000 and 4000).

## Project Structure

```text
X-DEV-MAIN/
├── bin/                 # CLI entry point (x-dev)
├── core/                # Framework logic (Orchestrator)
├── blocks/              # Registry of available Dev-Blocks
│   ├── x-dev-api/       # Example Backend Block
│   └── x-dev-ui/        # Example Frontend Block
├── recipes/             # Application Definitions (JSON)
└── DESIGN.md            # Architectural Specification
```

## Creating a Custom Recipe
Create a new file in `recipes/my-app.json`:

```json
{
  "name": "My Custom App",
  "blocks": {
    "api": {
      "blockId": "x-dev-api",
      "port": 8080
    },
    "ui": {
      "blockId": "x-dev-ui",
      "port": 3000,
      "env": {
        "API_URL": "http://localhost:8080"
      }
    }
  }
}
```

Then run it:
```bash
npm start -- run my-app
```

## Documentation
For detailed architecture and protocol specifications, see [DESIGN.md](./DESIGN.md).