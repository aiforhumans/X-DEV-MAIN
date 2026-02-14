# X-DEV-MAIN

**The Modular Development Framework for Composable Applications**

X-DEV-MAIN is a local orchestration framework that allows you to build applications by combining independent "Dev-Blocks" (like UI, API, Database) using simple JSON recipes.

## Why?
- **No Rebuilds:** Swap a backend or frontend instantly by changing a config file.
- **Modular:** Develop blocks in isolation; combine them at runtime.
- **Local-First:** Designed for local AI development (e.g., connecting LM Studio to a Chat UI).

## Quick Start

### 1. Structure
- `blocks/`: Contains the independent modules (e.g., `x-dev-api`, `x-dev-ui`).
- `recipes/`: JSON files defining how to wire blocks together.
- `core/`: The framework logic.

### 2. Creating a Block
Each folder in `blocks/` must have a `block.json` manifest:

```json
{
  "id": "my-cool-api",
  "runCommand": "npm start",
  "env": { "PORT": { "required": true } }
}
```

### 3. Running a Recipe
Define an application in `recipes/my-app.json`:

```json
{
  "name": "My Chat App",
  "blocks": {
    "api": { "blockId": "x-dev-api", "port": 4000 },
    "ui":  { "blockId": "x-dev-ui",  "port": 3000, "env": { "API_URL": "http://localhost:4000" } }
  }
}
```

Then run the framework (Coming Soon):
```bash
npm start -- recipe=my-app
```

## Contributing
See [DESIGN.md](./DESIGN.md) for architectural details.
