#!/usr/bin/env bash
set -e
TOKEN=${GATEWAY_BEARER_TOKEN:-change_me}

echo "== health =="
curl -s http://127.0.0.1:9011/health; echo

echo "== echo =="
curl -s -X POST http://127.0.0.1:9011/tool \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"tool":"echo","args":{"message":"hello"}}'
echo

echo "== deepflex_decide =="
curl -s -X POST http://127.0.0.1:9011/tool \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"tool":"deepflex_decide","args":{"intent":"summarize risks of adding filesystem tools","tool":null}}'
echo
