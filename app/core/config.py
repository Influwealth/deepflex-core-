import os

APP_NAME = "DeepFlex Core"
APP_ENV = os.getenv("APP_ENV", "dev")

# Model routing defaults
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "Qwen/Qwen2.5-7B-Instruct")
ALT_TOOL_MODEL = os.getenv("ALT_TOOL_MODEL", "Vikhrmodels/Qwen2.5-7B-Instruct-Tool-Planning-v0.1")

# Inference endpoint (OpenAI-compatible if using vLLM / NIM / etc.)
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://localhost:8000/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "change_me")

# Reflex entropy governor
REFLEX_MAX_RISK = float(os.getenv("REFLEX_MAX_RISK", "0.35"))  # lower = stricter

# Capsule governance
ALLOWLIST_TOOLS = os.getenv(
    "ALLOWLIST_TOOLS",
    "health,echo,deepflex_decide").split(",")

# MCP security
MCP_BEARER_TOKEN = os.getenv("MCP_BEARER_TOKEN", "change_me")

# Regime switching (global)
REGIME = os.getenv("REGIME", "DEFAULT")  # DEFAULT | NYS_ONLY | NYS_PLUS_SCHEDIII | etc.
JURISDICTION = os.getenv("JURISDICTION", "GLOBAL")
POLICY_RULESET_VERSION = os.getenv("POLICY_RULESET_VERSION", "core_v1")
