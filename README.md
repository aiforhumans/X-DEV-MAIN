# X-DEV-MAIN 🚀
> **The Modular Orchestration Framework for Local Development**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Alpha-orange.svg)]()

**X-DEV-MAIN** is a local development framework designed to orchestrate independent "Dev-Blocks" (UI, API, Workers) into functional applications without code changes. It brings the power of **Micro-Frontends** and **Microservices** to your local machine with a focus on **Zero-Config Composition**.

---

## 🏗️ Architecture

The framework is built on three core concepts:

### 1. The Dev-Block (`/blocks`)
A **Dev-Block** is a self-contained unit of functionality. It is **immutable** and **agnostic** of the larger application.
*   **Manifest (`block.json`):** Defines inputs (Environment Variables), outputs (Ports), and lifecycle commands.
*   **Isolation:** Each block runs in its own process.
*   **Reusability:** A single "Chat UI" block can be reused across 10 different projects just by changing the API URL in the recipe.

### 2. The Recipe (`/recipes`)
A **Recipe** is a JSON configuration that wires blocks together to form an **Application**.
*   **Composition:** Selects which blocks to run.
*   **Injection:** Maps outputs from one block to inputs of another (e.g., passing `API_URL` to a frontend).
*   **Runtime Config:** Overrides defaults without touching code.

### 3. The Orchestrator (CLI)
The **Runtime Engine** that parses recipes and manages the lifecycle of blocks.
*   **Process Management:** Spawns and monitors block processes.
*   **State Tracking:** Keeps track of PIDs, ports, and status in `.x-dev/state.json`.
*   **DX:** Provides unified logging and commands like `ps` to view system state.

---

## 📂 Project Structure

```text
X-DEV-MAIN/
├── bin/                 # 🚀 CLI Entry Point (x-dev)
├── core/                # 🧠 Framework Logic
│   ├── runner/          #    - Orchestrator (Process Spawning)
│   ├── schemas/         #    - Zod Schemas (Validation)
│   └── state/           #    - StateManager (PID tracking)
├── blocks/              # 📦 Registry of Dev-Blocks
│   ├── x-dev-api/       #    - Example Backend Block
│   └── x-dev-ui/        #    - Example Frontend Block
├── recipes/             # 📜 Application Definitions
│   └── local-chat.json  #    - Example Recipe
└── package.json         # 📦 Project Dependencies
```

---

## 🚀 Getting Started

### Prerequisites
*   **Node.js** v18+
*   **npm** or **pnpm**

### Installation

```bash
git clone <repo-url>
cd X-DEV-MAIN
npm install
```

### Running Your First App

The project comes with a sample **Local Chat** application that connects a mock UI to a mock API.

```bash
# Start the orchestration
npm start -- run local-chat
```

You should see output indicating that both the **backend** (Port 4000) and **frontend** (Port 3000) have started.

---

## 🛠️ CLI Reference

The framework exposes a CLI tool `x-dev`.

### `run <recipe>`
Starts the application defined in `recipes/<recipe>.json`.
```bash
npm start -- run local-chat
```

### `ps`
Lists all currently running blocks and their status.
```bash
npm start -- ps
```
**Output Example:**
```text
Running Blocks:
------------------------------------------------------------
Name           Block ID       Port      PID       Status
------------------------------------------------------------
backend        x-dev-api      4000      12345     running
frontend       x-dev-ui       3000      67890     running
```

---

## 📝 Configuration Guide

### Creating a New Block (`block.json`)

To add a new block, create a folder in `blocks/` and add a `block.json`:

```json
{
  "schemaVersion": "1.0",
  "id": "my-service",
  "version": "1.0.0",
  "type": "backend",
  "runCommand": "npm start",
  "env": {
    "DB_URL": { "required": true, "description": "Database Connection String" }
  },
  "expose": {
    "port": { "default": 8080 }
  }
}
```

### Creating a Recipe (`recipes/my-app.json`)

To compose an application:

```json
{
  "name": "My Full Stack App",
  "blocks": {
    "api": {
      "blockId": "my-service",
      "port": 5000,
      "env": {
        "DB_URL": "postgres://localhost:5432/mydb"
      }
    },
    "dashboard": {
      "blockId": "x-dev-ui",
      "port": 3000,
      "env": {
        "API_URL": "http://localhost:5000"
      }
    }
  }
}
```

---

## 🔮 Roadmap

- [ ] **Stop Command:** `x-dev stop` to gracefully shut down apps.
- [ ] **Hot Reload:** Watch recipes for changes and restart blocks.
- [ ] **Log Streaming:** `x-dev logs <block>` to tail logs.
- [ ] **Remote Blocks:** Support installing blocks from Git/NPM.
- [ ] **GUI Dashboard:** Visual interface for the orchestrator.

---

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Open a Pull Request.

---

*Built with ❤️ for modular development.*
