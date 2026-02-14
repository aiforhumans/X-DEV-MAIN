# X-DEV-MAIN: Modular Development Framework

**X-DEV-MAIN** is a local development framework designed to orchestrate independent "Dev-Blocks" into functional applications without code changes.

## Core Concepts

### 1. The Dev-Block
A **Dev-Block** is a self-contained unit of functionality (frontend, backend, worker, or database).
*   **Structure:** A standard folder structure containing code and a manifest.
*   **Manifest (`block.json`):** Defines the block's capabilities, input requirements (env vars), and output (ports/urls).
*   **Immutability:** Blocks are generic. They adapt behavior based on the configuration injected by the Framework at runtime.

### 2. The Recipe
A **Recipe** is a JSON/YAML configuration that defines an "Application" by combining blocks.
*   It selects which blocks to run.
*   It maps outputs from one block (e.g., `API_URL`) to inputs of another (e.g., `REACT_APP_API_URL`).
*   It defines the runtime profile (ports, memory, etc.).

### 3. The Runtime (CLI)
The **X-DEV-MAIN CLI** is the engine.
*   **Command:** `x-dev run <recipe-name>`
*   **Function:**
    1.  Reads the recipe.
    2.  Locates the required blocks.
    3.  Resolves dependencies and ports.
    4.  Injects configuration (ENV variables).
    5.  Spawns processes.

## Directory Structure

```text
X-DEV-MAIN/
├── bin/                 # The Framework CLI executable
├── core/                # Framework logic (Process manager, Config loader)
├── blocks/              # Registry of available Dev-Blocks
│   ├── x-dev-api/       # (Example Block)
│   │   ├── block.json   # Manifest
│   │   └── ...
│   └── x-dev-ui/        # (Example Block)
│       ├── block.json   # Manifest
│       └── ...
├── recipes/             # Application Definitions
│   ├── local-chat.json  # "Connect UI to API"
│   └── code-assist.json # "Connect UI to Agent-API + VectorDB"
└── package.json
```

## Protocol Specifications

### The Block Manifest (`block.json`)
Every block within `blocks/` must have this file.

```json
{
  "id": "x-dev-ui",
  "type": "frontend",
  "version": "1.0.0",
  "runCommand": "npm run start",
  "env": {
    "API_URL": { "description": "The backend endpoint", "required": true }
  },
  "expose": {
    "port": 3000
  }
}
```

### The Recipe (`recipes/local-chat.json`)
How to combine them.

```json
{
  "name": "Local Chat Bot",
  "blocks": {
    "backend": {
      "blockId": "x-dev-api",
      "port": 4000
    },
    "frontend": {
      "blockId": "x-dev-ui",
      "port": 3000,
      "env": {
        "API_URL": "http://localhost:4000"
      }
    }
  }
}
```

## Goals
*   **Zero-Config Composition:** Plug a UI block into an API block just by creating a recipe.
*   **Hot-Swappable:** Stop the `local-chat` recipe, swap the "backend" block for a "mock-backend" block in the JSON, and restart.