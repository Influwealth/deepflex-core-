# DeepFlex Core — SAP Integration

## Important: Role Clarification

`deepflex-core` is the **Electron desktop client**, NOT the DeepFlex brain/supervisor.

The actual DeepFlex supervisor lives in:
```
sovereign-stack/deepflex/runtime-core.ts  ← DeepFlex brain (TypeScript, port 8000)
sovereign-stack/deepflex/supervisor-http.ts  ← HTTP wrapper (port 8000)
```

## What deepflex-core Is
- Electron desktop app (macOS/Windows/Linux)
- In-browser LLM inference via `@mlc-ai/web-llm`
- Browser MCP client via `@jason.today/webmcp`
- UI for interacting with the DeepFlex supervisor

## SAP Node ID: `deepflex-desktop`

## Integration with Supervisor
deepflex-core connects to the DeepFlex Supervisor over HTTP:
```javascript
// main.js — connect to DeepFlex supervisor
const SUPERVISOR_URL = "http://localhost:8000";

async function sendTask(task) {
  const traceId = crypto.randomUUID();
  const resp = await fetch(`${SUPERVISOR_URL}/task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sap-node-id": "deepflex-desktop",
      "x-sap-trace-id": traceId,
      "x-sap-version": "1.0",
    },
    body: JSON.stringify({ task, source: "deepflex-desktop" }),
  });
  return resp.json();
}
```

## WebLLM (In-browser Inference)
deepflex-core runs LLM inference locally via WebLLM before escalating to the supervisor:
1. Simple tasks → WebLLM (local, private)
2. Complex tasks → DeepFlex Supervisor (port 8000) → Argus/WealthBridge

## WebMCP
Browser-based MCP client (`@jason.today/webmcp`) connects to MCP servers
exposed by the WebMCP UI in `wealthbridge-agent-framework/apps/mcp-ui/`.

## Development
```bash
pnpm install
pnpm start  # runs electron .
```

## Branch
All synthesis work: `claude/deepflex-argus-synthesis-jWjmO`
