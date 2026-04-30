"""
conftest.py — mock all external dependencies before any app module is imported.
This allows tests to run without real API keys or a live Supabase instance.
"""
import sys
import os
from unittest.mock import MagicMock

# ── Ensure backend/ is on sys.path, NOT the repo root ──────────────────────
_backend = os.path.dirname(os.path.dirname(__file__))
_repo_root = os.path.dirname(_backend)

# Remove repo root from path to prevent local supabase/ dir shadowing the package
if _repo_root in sys.path:
    sys.path.remove(_repo_root)
if _backend not in sys.path:
    sys.path.insert(0, _backend)

# ── Stub heavy external packages before any app import ─────────────────────
_STUBS = {
    "supabase": MagicMock(create_client=MagicMock(), Client=MagicMock),
    "deepagents": MagicMock(create_deep_agent=MagicMock()),
    "langchain_postgres": MagicMock(),
    "langchain_anthropic": MagicMock(),
    "langmem": MagicMock(),
    "tavily": MagicMock(TavilyClient=MagicMock),
}
for name, stub in _STUBS.items():
    if name not in sys.modules:
        sys.modules[name] = stub

# ── Stub app.config with dummy values so Settings() doesn't fail ───────────
_mock_settings = MagicMock()
_mock_settings.ANTHROPIC_API_KEY = "test"
_mock_settings.TAVILY_API_KEY = "test"
_mock_settings.SUPABASE_URL = "https://test.supabase.co"
_mock_settings.SUPABASE_ANON_KEY = "test"
_mock_settings.SUPABASE_SERVICE_ROLE_KEY = "test"
_mock_settings.DATABASE_URL = "postgresql://test"
_mock_settings.FIRMS_MAP_KEY = ""
_mock_settings.ACLED_API_KEY = ""
_mock_settings.ACLED_EMAIL = ""
_mock_settings.SIMILARITY_THRESHOLD = 0.85
_mock_settings.ALLOWED_ORIGINS = "http://localhost:5173"

_mock_config = MagicMock()
_mock_config.settings = _mock_settings
sys.modules["app.config"] = _mock_config

# ── Stub app.db.client ──────────────────────────────────────────────────────
_mock_db_client = MagicMock()
sys.modules["app.db.client"] = _mock_db_client

# ── Stub app.db.vector_store ────────────────────────────────────────────────
_mock_vs = MagicMock()
sys.modules["app.db.vector_store"] = _mock_vs
