# MCP Code Review Server

AI-powered code correctness review using OpenRouter LLMs.

![Node.js](https://img.shields.io/badge/Node.js-20-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![React](https://img.shields.io/badge/React-18-61dafb)

## Overview

A local MCP server that analyzes code for correctness, security, and performance issues using LLMs via OpenRouter. Features a React dashboard for submitting reviews and viewing results.

**Key Features:**
- 🔍 Supports diff, code snippets, and PR review
- 🤖 Uses any OpenRouter model (Claude, GPT-4, Llama, etc.)
- 📊 Risk scoring with severity-based issue categorization
- 🔐 No stored credentials - API key provided per request
- 📈 Prometheus metrics and structured logging

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Clone and start
git clone <repo>
cd mcp-code-review-server
docker-compose up -d

# Open dashboard
open http://localhost:5173
```

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Start backend (terminal 1)
npm run dev --workspace=packages/server

# Start frontend (terminal 2)
npm run dev --workspace=packages/web

# Open dashboard
open http://localhost:5173
```

## Usage

1. Open the dashboard at `http://localhost:5173`
2. Enter your OpenRouter API key
3. Select a model
4. Paste your code or diff
5. Click "Review Code"

## MCP Integration (Claude Desktop)

This server also works as an MCP server for Claude Desktop.

### Setup

1. Build the server:
```bash
npm run build --workspace=packages/server
```

2. Add to your Claude Desktop config (`~/.config/claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "code-review": {
      "command": "node",
      "args": ["/path/to/ai-code-review-server/packages/server/dist/mcp.js"]
    }
  }
}
```

3. Restart Claude Desktop

### Using the Tool

In Claude, you can now ask:
> "Review this code for correctness issues: [paste code]"

Claude will use the `review_code` tool with your OpenRouter API key.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/config` | GET | Server configuration |
| `/metrics` | GET | Prometheus metrics |
| `/review` | POST | Submit code for review |

### POST /review

```json
{
  "apiKey": "sk-or-v1-...",
  "model": "anthropic/claude-3.5-sonnet",
  "code": "function example() { ... }",
  "languageHint": "typescript",
  "ruleset": "correctness"
}
```

## Project Structure

```
├── packages/
│   ├── server/          # Express backend
│   │   └── src/
│   │       ├── schemas/ # Zod validation
│   │       ├── services/# OpenRouter client
│   │       ├── prompts/ # LLM prompts
│   │       └── routes/  # API endpoints
│   └── web/             # React frontend
│       └── src/
│           ├── components/
│           └── hooks/
├── docker/              # Docker configs
└── docker-compose.yml
```

## Tech Stack

**Backend:** Node.js 20, Express, Zod, Pino, undici  
**Frontend:** React 18, Vite, TypeScript  
**Observability:** Prometheus metrics, structured JSON logs

## License

MIT
