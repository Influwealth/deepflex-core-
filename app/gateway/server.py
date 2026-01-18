"""
DeepFlex MCP Gateway Shield (v1)
- Bearer auth
- Tool allowlist
- Basic schema checks
- Redaction
- Append-only audit log
"""
from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any
import os

from app.gateway.redact import redact
from app.gateway.audit import append_audit
from app.agents.deepflex import decide
from app.core.config import ALLOWLIST_TOOLS

GATEWAY_BEARER_TOKEN = os.getenv("GATEWAY_BEARER_TOKEN", "change_me")
AUDIT_LOG_PATH = os.getenv("GATEWAY_AUDIT_LOG_PATH", "/tmp/deepflex_gateway_audit.log")

app = FastAPI(title="DeepFlex MCP Gateway Shield", version="0.1")

def require_token(req: Request):
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Bearer token")
    token = auth.split(" ", 1)[1]
    if token != GATEWAY_BEARER_TOKEN:
        raise HTTPException(status_code=403, detail="Invalid token")

class ToolCall(BaseModel):
    tool: str = Field(..., description="Tool name (must be allowlisted)")
    args: Dict[str, Any] = Field(default_factory=dict)

@app.get("/health")
async def health():
    return {"ok": True, "service": "deepflex-gateway", "allowlist": ALLOWLIST_TOOLS}

@app.post("/tool")
async def call_tool(req: Request, body: ToolCall):
    require_token(req)

    tool = body.tool.strip()
    if tool not in ALLOWLIST_TOOLS:
        append_audit(AUDIT_LOG_PATH, {"event": "blocked_tool", "tool": tool, "allowlist": ALLOWLIST_TOOLS})
        raise HTTPException(status_code=403, detail=f"Tool '{tool}' not allowlisted")

    if tool == "health":
        result = {"ok": True}
    elif tool == "echo":
        msg = body.args.get("message", "")
        if not isinstance(msg, str):
            raise HTTPException(status_code=400, detail="echo.message must be a string")
        result = {"echo": msg}
    elif tool == "deepflex_decide":
        intent = body.args.get("intent", "")
        if not isinstance(intent, str) or not intent:
            raise HTTPException(status_code=400, detail="deepflex_decide.intent must be a non-empty string")
        tool_arg = body.args.get("tool")
        if tool_arg is not None and not isinstance(tool_arg, str):
            raise HTTPException(status_code=400, detail="deepflex_decide.tool must be a string or null")
        result = decide(intent=intent, tool=tool_arg)
    else:
        result = {"ok": False, "error": f"Tool '{tool}' allowlisted but not implemented in gateway v1"}

    safe_req = redact({"tool": tool, "args": body.args})
    safe_res = redact(result)

    append_audit(AUDIT_LOG_PATH, {"event": "tool_call", "request": safe_req, "response": safe_res})

    return {"ok": True, "tool": tool, "result": safe_res}
