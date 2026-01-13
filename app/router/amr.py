from app.core.config import DEFAULT_MODEL, ALT_TOOL_MODEL

def pick_model(task_type: str, tool_use: bool) -> str:
    """
    v1 routing: keep it simple and deterministic.
    """
    if tool_use:
        return ALT_TOOL_MODEL
    return DEFAULT_MODEL
