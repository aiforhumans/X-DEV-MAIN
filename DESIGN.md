# X-DEV-MAIN: Modular Development Framework

**X-DEV-MAIN** is a local orchestration framework designed to compose independent "Dev-Blocks" into functional applications without code changes. It draws inspiration from microservices and micro-frontends to enable "Zero-Config Composition."

## Core Concepts

### 1. The Dev-Block (The Atom)
A **Dev-Block** is a self-contained, immutable unit of functionality (frontend, backend, worker, database).
*   **Immutability:** Blocks are generic artifacts. They do not contain hardcoded URLs or secrets. They adapt behavior solely based on injected configuration (Environment Variables).
*   **Manifest (`block.json`):** A strict schema defining the block's identity, input requirements (env vars), outputs (ports), dependencies, and health checks.

### 2. The Recipe (The Molecule)
A **Recipe** is a declaration file (JSON/YAML) that defines an "Application" by wiring specific blocks together.
*   **Orchestration:** Selects blocks to run and maps outputs from one block to inputs of another.
*   **Overrides:** Allows customization of environment variables and resource limits without touching the block's code.
*   **Versioning:** Ensures recipes remain compatible as the framework evolves.

### 3. The Runtime (The Engine)
The **X-DEV-MAIN CLI** acts as a process manager and dependency resolver.
*   **Validation:** Ensures all required environment variables are mapped and ports are available before starting.
*   **Lifecycle Management:** Handles startup order (waiting for health checks), graceful shutdowns, and hot-reloading.
*   **Isolation:** Spawns each block in its own process, ensuring state isolation.

## Directory Structure

```text
X-DEV-MAIN/
├── bin/                 # CLI entry point
├── core/                # Framework logic (Process manager, Schema validation)
│   ├── schemas/         # TypeScript interfaces & JSON Schemas for Manifest/Recipe
│   └── runner/          # Process spawning & Orchestration logic
├── blocks/              # Local Registry of Dev-Blocks (Git submodules or standard folders)
│   ├── x-dev-api/       # (Example Block)
│   │   ├── block.json   # Manifest
│   │   └── ...
│   └── x-dev-ui/        # (Example Block)
│       ├── block.json   # Manifest
│       └── ...
├── recipes/             # Application Definitions
│   ├── local-chat.json  # "Connect UI to API"
│   └── full-stack.json  # "UI + API + DB + Worker"
└── package.json
```

## Protocol Specifications

### 1. The Block Manifest (`block.json`)
Every block must contain this file. It serves as the contract.

```json
{
  "schemaVersion": "1.0",
  "id": "x-dev-ui",
  "version": "1.0.0",
  "type": "frontend",
  "description": "A generic chat interface.",
  "scripts": {
    "start": "npm run start",
    "prestart": "npm run build:config",
    "healthCheck": "curl -f http://localhost:$PORT/health || exit 1"
  },
  "dependencies": {
    "api": { "type": "backend", "version": "^1.0.0", "required": true }
  },
  "env": {
    "API_URL": { "description": "Endpoint for the backend API", "required": true },
    "THEME": { "description": "UI Theme (light/dark)", "default": "light" }
  },
  "expose": {
    "port": { "default": 3000, "protocol": "http" }
  }
}
```

### 2. The Recipe (`recipes/local-chat.json`)
Defines the runtime composition.

```json
{
  "recipeVersion": "1.0",
  "name": "Local Chat Bot",
  "blocks": {
    "chat-backend": {
      "blockId": "x-dev-api",
      "version": "latest",
      "resources": { "memory": "512MB" },
      "port": 4000,
      "env": {
        "LLM_PROVIDER": "lm-studio"
      }
    },
    "chat-frontend": {
      "blockId": "x-dev-ui",
      "port": 3000,
      "dependsOn": ["chat-backend"],
      "env": {
        "API_URL": "http://localhost:4000",
        "THEME": "dark"
      }
    }
  }
}
```

## CLI & Process Manager Workflow
The CLI (`x-dev`) orchestrates the system:

1.  **Parse:** Reads `recipe.json` and loads referenced `block.json` files.
2.  **Validate:** Checks compatibility (versions), missing required ENV vars, and port conflicts.
3.  **Resolve:** Determines startup order based on `dependsOn` and health checks.
4.  **Inject:** Generates a runtime config (or sets process `env`) for each block.
5.  **Spawn:** Launches processes using Node.js `child_process`.
6.  **Monitor:** Streams logs (prefixed with block name) and watches for recipe changes to Hot-Swap.

**Commands:**
*   `x-dev run <recipe>`: Start an application.
*   `x-dev ps`: List running blocks and their status.
*   `x-dev logs <block>`: View logs for a specific block.
*   `x-dev stop`: Gracefully terminate all blocks.

## Future Enhancements
*   **Block Registry:** Support for installing blocks via npm or git (e.g., `x-dev add <block-url>`).
*   **GUI Dashboard:** A web interface to view running blocks, logs, and modify recipes visually.
*   **Network Virtualization:** Internal proxy to handle routing between blocks without hardcoded localhost ports.
