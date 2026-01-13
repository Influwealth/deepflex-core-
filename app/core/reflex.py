from dataclasses import dataclass
from app.core.config import REFLEX_MAX_RISK

@dataclass
class ReflexDecision:
    allowed: bool
    risk: float
    reason: str

def score_risk(intent: str, tool_name: str | None = None) -> float:
    """
    Minimal v1 heuristic risk scoring.
    Expand later with learned risk models and EPA signals.
    """
    intent_l = (intent or "").lower()
    risk = 0.05

    # high-risk verbs
    for w in ["delete", "shutdown", "format", "exfiltrate", "steal", "rm -rf", "wipe", "bypass"]:
        if w in intent_l:
            risk += 0.6

    # tool sensitivity
    if tool_name and tool_name.lower() in ["shell", "filesystem", "exec"]:
        risk += 0.7

    return min(1.0, risk)

def allow(intent: str, tool_name: str | None = None) -> ReflexDecision:
    risk = score_risk(intent, tool_name)
    if risk > REFLEX_MAX_RISK:
        return ReflexDecision(False, risk, f"Reflex blocked: risk {risk:.2f} > threshold {REFLEX_MAX_RISK:.2f}")
    return ReflexDecision(True, risk, f"Reflex ok: risk {risk:.2f}")
