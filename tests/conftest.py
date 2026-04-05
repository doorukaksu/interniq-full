"""
Shared pytest fixtures for InternIQ backend tests.

Environment variables are set at module level so they are present
BEFORE any api.* module is imported. This prevents the startup
validation in api/main.py and api/services/clerk_auth.py from raising.
"""
import io
import os
import struct
import time
from unittest.mock import MagicMock, patch

import pytest

# ── Set required env vars before any api.* import ────────────────────────────
os.environ.setdefault("ANTHROPIC_API_KEY", "test-anthropic-key")
os.environ.setdefault("CLERK_ISSUER", "https://clerk.test.example.com")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key")
os.environ.setdefault("STRIPE_SECRET_KEY", "sk_test_fakekeyfortesting")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_testfakewebhooksecret")

# Patch JWKS fetch BEFORE importing clerk_auth (which tries to read CLERK_ISSUER
# but doesn't fetch JWKS until the first token verification).
# The singleton Supabase client must also never be initialised for real.

# ── App import (after env is populated) ──────────────────────────────────────
from fastapi.testclient import TestClient
from api.main import app
from api.services.clerk_auth import require_auth


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture
def client():
    """Unauthenticated TestClient — most tests should use authed_client instead."""
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture
def authed_client(mock_supabase):
    """
    TestClient with require_auth overridden to return a free-tier user.
    Supabase is also mocked so no real DB calls are made.
    """
    app.dependency_overrides[require_auth] = lambda: {
        "sub": "user_test_free",
        "email": "free@example.com",
    }
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def pro_authed_client(mock_supabase):
    """TestClient with require_auth returning a pro-tier user."""
    app.dependency_overrides[require_auth] = lambda: {
        "sub": "user_test_pro",
        "email": "pro@example.com",
    }
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """
    Reset the shared in-memory rate limiter between every test.
    Without this, analyze endpoint tests exhaust the 5-req/hr limit and start
    returning 429 for unrelated tests.
    """
    from api.services.rate_limiter import rate_limiter
    rate_limiter._store.clear()
    yield
    rate_limiter._store.clear()


@pytest.fixture(autouse=True)
def reset_supabase_singleton():
    """
    Reset the Supabase client singleton between tests so patched get_supabase()
    calls don't accidentally fall through to a cached real client.
    """
    import api.services.supabase_client as sb_module
    original = sb_module._client
    sb_module._client = None
    yield
    sb_module._client = original


@pytest.fixture
def mock_supabase():
    """
    Patch get_supabase() at every import site to return a MagicMock.

    Python's import system means patching the source module is not enough —
    each consumer (user_service, stripe_service) holds its own reference to the
    imported function.  We must patch WHERE IT IS USED, not where it is defined.
    """
    mock_sb = MagicMock()

    # Default free user row
    free_user_row = {
        "clerk_id": "user_test_free",
        "email": "free@example.com",
        "plan": "free",
        "sub_status": "inactive",
        "topup_credits": 0,
        "stripe_customer_id": None,
    }

    # Wire up the common query chains
    mock_sb.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = free_user_row
    mock_sb.table.return_value.upsert.return_value.execute.return_value.data = []
    mock_sb.table.return_value.insert.return_value.execute.return_value.data = []
    mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
    mock_sb.table.return_value.delete.return_value.eq.return_value.execute.return_value.data = []
    # RPC: usage counts default to 0 (hasn't used anything yet)
    mock_sb.rpc.return_value.execute.return_value.data = 0

    # Patch at every module that imports get_supabase directly
    patches = [
        patch("api.services.user_service.get_supabase", return_value=mock_sb),
        patch("api.services.stripe_service.get_supabase", return_value=mock_sb),
    ]
    for p in patches:
        p.start()
    yield mock_sb
    for p in patches:
        p.stop()


@pytest.fixture
def minimal_pdf() -> bytes:
    """
    Smallest valid-looking PDF bytes that pass magic-byte and size checks.
    Not a real parseable PDF — use real_pdf_bytes for parsing tests.
    """
    header = b"%PDF-1.4\n"
    body = b"0 0 obj\n<< /Type /Catalog >>\nendobj\n"
    trailer = b"%%EOF"
    content = header + body + trailer
    # Pad to exceed MIN_FILE_SIZE_BYTES (1024)
    content = content + b" " * (1024 - len(content) + 1)
    return content


@pytest.fixture
def real_pdf_bytes() -> bytes:
    """A real minimal parseable PDF with one text page."""
    import pypdf
    from pypdf import PdfWriter

    writer = PdfWriter()
    page = writer.add_blank_page(width=595, height=842)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


FREE_USER = {"sub": "user_test_free", "email": "free@example.com"}
PRO_USER = {"sub": "user_test_pro", "email": "pro@example.com"}
UNLIMITED_USER = {"sub": "user_test_unlimited", "email": "unlimited@example.com"}
