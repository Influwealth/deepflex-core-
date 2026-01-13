#!/usr/bin/env bash
export MCP_BEARER_TOKEN=${MCP_BEARER_TOKEN:-change_me}
python -m app.mcp.server
