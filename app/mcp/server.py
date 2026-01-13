"""
Secure-by-default MCP server for DeepFlex.
- Allowlist tools only
- Bearer auth required
- No filesystem or shell access
"""
import os
from typing import Any, Dict

from app.core.config import MCP_BEARER_TOKEN, ALLOWLIST_TOOLS
from app.agents.deepflex import decide

# MCP Python SDK
# Docs: https://modelcontextprotocol.io/docs/develop/build-server
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("deepflex-mcp")

def _require_token(token: str):
    if token != MCP_BEARER_TOKEN:
        raise PermissionError("Invalid MCP bearer token")

@mcp.tool()
def health(token: str) -> Dict[str, Any]:
    _require_token(token)
    return {"ok": True, "service": "deepflex-mcp"}

@mcp.tool()
def echo(token: str, message: str) -> Dict[str, Any]:
    _require_token(token)
    return {"echo": message}

@mcp.tool()
def deepflex_decide(token: str, intent: str, tool: str | None = None) -> Dict[str, Any]:
    _require_token(token)

    if tool and tool not in ALLOWLIST_TOOLS:
        return {"ok": False, "error": f"Tool '{tool}' not allowlisted", "allowlist": ALLOWLIST_TOOLS}

    return {"ok": True, "decision": decide(intent=intent, tool=tool)}

def main():
    # STDIO transport by default (common for MCP)
    mcp.run()

if __name__ == "__main__":
    main()
