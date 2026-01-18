import json
import time
from typing import Dict, Any

def append_audit(path: str, record: Dict[str, Any]) -> None:
    record = {"ts": time.time(), **record}
    with open(path, "a") as f:
        f.write(json.dumps(record) + "\n")
