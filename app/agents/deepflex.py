from app.core.reflex import allow
from app.router.amr import pick_model
from app.core.config import REGIME, JURISDICTION, POLICY_RULESET_VERSION

def explain(decision: dict) -> dict:
    """
    Minimal explainability artifact (no chain-of-thought).
    """
    return {
        "model": decision.get("model"),
        "tool": decision.get("tool"),
        "risk": decision.get("risk"),
        "regime": REGIME,
        "jurisdiction": JURISDICTION,
        "policy_ruleset_version": POLICY_RULESET_VERSION,
        "rationale": decision.get("rationale"),
    }

def decide(intent: str, tool: str | None = None) -> dict:
    """
    DeepFlex decision contract (v1):
    - evaluate Reflex
    - choose model route (AMR)
    - return an execution plan (no actual execution here)
    """
    r = allow(intent, tool)
    model = pick_model(task_type="general", tool_use=bool(tool))

    plan = {
        "allowed": r.allowed,
        "risk": r.risk,
        "model": model,
        "tool": tool,
        "rationale": r.reason,
        "plan": None,
    }

    if r.allowed:
        plan["plan"] = {
            "type": "tool_call" if tool else "reason_only",
            "intent": intent,
            "tool": tool,
        }

    plan["explain"] = explain(plan)
    return plan
