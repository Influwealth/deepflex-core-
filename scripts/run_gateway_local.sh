#!/usr/bin/env bash
set -e
export GATEWAY_BEARER_TOKEN=${GATEWAY_BEARER_TOKEN:-change_me}
export GATEWAY_AUDIT_LOG_PATH=${GATEWAY_AUDIT_LOG_PATH:-/tmp/deepflex_gateway_audit.log}
python -m uvicorn app.gateway.server:app --host 0.0.0.0 --port 9011
