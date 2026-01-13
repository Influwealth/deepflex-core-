# DeepFlex Core (formerly DeepSight)

DeepFlex is a **Sovereign Cognitive Core + Agent Runtime** designed to orchestrate agents,
govern execution, and enforce safety across a distributed AI mesh.

## Core Capabilities
- Reflex (entropy / risk governor)
- AMR (Adaptive Model Router)
- Capsule & tool allowlisting
- Minimal explainability artifacts (no chain-of-thought)
- Secure MCP server for tool exposure

## Default Models
- DEFAULT_MODEL: Qwen/Qwen2.5-7B-Instruct
- ALT_TOOL_MODEL: Vikhrmodels/Qwen2.5-7B-Instruct-Tool-Planning-v0.1

Models are swappable without code changes.

## Local Run (No Docker Required)
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export MCP_BEARER_TOKEN=change_me
python -m app.mcp.server

## Security Notes (MCP)
- Bearer-token authentication required
- Only allowlisted tools are exposed
- No filesystem or shell execution
- Designed to sit behind Argus / EPA governance

## Deployment
- Container-ready (Dockerfile included)
- Intended for Akash or cloud VM deployment
- Do NOT attempt Docker builds inside Termux

## Next Steps
1. Git commit & push
2. Add MCP Gateway (shield)
3. Add Akash SDL
4. Integrate with Argus + Reflex

