import re
from typing import Any

_PATTERNS = [
    (re.compile(r"(AKIA[0-9A-Z]{16})"), "[REDACTED_AWS_KEY]"),
    (re.compile(r"(-----BEGIN [A-Z ]+ PRIVATE KEY-----[\\s\\S]+?-----END [A-Z ]+ PRIVATE KEY-----)"), "[REDACTED_PRIVATE_KEY]"),
    (re.compile(r"(?i)(api[_-]?key\\s*[:=]\\s*[a-z0-9_\\-]{8,})"), "api_key=[REDACTED]"),
    (re.compile(r"(?i)(bearer\\s+[a-z0-9\\._\\-]{12,})"), "Bearer [REDACTED]"),
    (re.compile(r"(?i)(token\\s*[:=]\\s*[a-z0-9\\._\\-]{12,})"), "token=[REDACTED]"),
]

def redact_text(s: str) -> str:
    out = s
    for pat, repl in _PATTERNS:
        out = pat.sub(repl, out)
    return out

def redact(obj: Any) -> Any:
    if obj is None:
        return None
    if isinstance(obj, str):
        return redact_text(obj)
    if isinstance(obj, list):
        return [redact(x) for x in obj]
    if isinstance(obj, dict):
        return {k: redact(v) for k, v in obj.items()}
    return obj
