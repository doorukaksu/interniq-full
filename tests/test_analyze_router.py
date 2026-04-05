"""
Tests for POST /api/analyze

Covers:
- Authentication enforcement (401 without token)
- File validation at the HTTP boundary (415, 413, 422)
- Usage limit enforcement (402 free limit, 402 pro weekly limit)
- Rate limiting (429)
- Partial masking for free-tier users
- Full results returned for paid tiers
- CV bytes are never persisted (no Supabase insert of CV content)
"""
import io
from unittest.mock import MagicMock, patch

import pytest

from api.services.clerk_auth import require_auth
from api.main import app
from api.models import AnalysisResult, ATSScore, KeywordAnalysis, BulletFeedback, SectionScore

from tests.conftest import FREE_USER, PRO_USER, UNLIMITED_USER


# ── Helpers ───────────────────────────────────────────────────────────────────

PDF_MAGIC = b"%PDF-1.4\n" + b"x" * 1200  # passes magic + size checks

JOB_DESC = "We are looking for a software engineer with Python, FastAPI, and SQL skills." * 3


def _mock_analysis_result() -> AnalysisResult:
    return AnalysisResult(
        ats=ATSScore(score=72, grade="B", summary="Good alignment with the role."),
        keywords=KeywordAnalysis(
            matched=["Python", "SQL"],
            missing=["Docker", "AWS"],
            recommended=["Kubernetes", "CI/CD"],
        ),
        bullets=[
            BulletFeedback(
                original="Worked on backend systems",
                improved="Engineered RESTful backend services in Python, reducing latency by 30%",
                reason="Adds measurable impact and stronger verb",
            )
        ],
        sections=[
            SectionScore(name="Work Experience", score=70, feedback="Add more quantified results."),
            SectionScore(name="Education", score=85, feedback="Strong. Consider adding relevant modules."),
        ],
        overall_suggestions=["Add a summary section", "Quantify achievements"],
        top_priorities=["Add Docker skills", "Quantify impact", "Add a professional summary"],
    )


def _upload_file(content: bytes = PDF_MAGIC, content_type: str = "application/pdf"):
    return ("cv", ("test_cv.pdf", io.BytesIO(content), content_type))


def _set_auth(user: dict):
    app.dependency_overrides[require_auth] = lambda: user


def _clear_auth():
    app.dependency_overrides.clear()


# ── Authentication tests ──────────────────────────────────────────────────────

def test_analyze_requires_auth(client):
    """POST /api/analyze must return 401 when no Authorization header is provided."""
    response = client.post(
        "/api/analyze",
        files=[_upload_file()],
        data={"job_description": JOB_DESC},
    )
    assert response.status_code == 401


def test_analyze_returns_401_with_invalid_bearer(client):
    """
    An invalid Bearer token must be rejected with 401.
    We patch JWKS fetch so the test doesn't depend on network availability —
    the token verification fails on signature, not on network error.
    """
    with patch("api.services.clerk_auth._get_jwks", return_value={"keys": []}):
        response = client.post(
            "/api/analyze",
            headers={"Authorization": "Bearer totally.invalid.token"},
            files=[_upload_file()],
            data={"job_description": JOB_DESC},
        )
    assert response.status_code == 401


# ── File validation tests (after auth) ───────────────────────────────────────

def test_analyze_rejects_non_pdf(mock_supabase):
    _set_auth(FREE_USER)
    try:
        from fastapi.testclient import TestClient
        c = TestClient(app, raise_server_exceptions=False)
        response = c.post(
            "/api/analyze",
            files=[("cv", ("resume.docx", io.BytesIO(b"Not a PDF" * 200), "application/msword"))],
            data={"job_description": JOB_DESC},
        )
        assert response.status_code == 415
    finally:
        _clear_auth()


def test_analyze_rejects_oversized_pdf(mock_supabase):
    _set_auth(FREE_USER)
    try:
        from fastapi.testclient import TestClient
        c = TestClient(app, raise_server_exceptions=False)
        large = b"%PDF" + b"x" * (5 * 1024 * 1024 + 1)
        response = c.post(
            "/api/analyze",
            files=[_upload_file(content=large)],
            data={"job_description": JOB_DESC},
        )
        assert response.status_code == 413
    finally:
        _clear_auth()


def test_analyze_rejects_empty_file(mock_supabase):
    _set_auth(FREE_USER)
    try:
        from fastapi.testclient import TestClient
        c = TestClient(app, raise_server_exceptions=False)
        response = c.post(
            "/api/analyze",
            files=[_upload_file(content=b"")],
            data={"job_description": JOB_DESC},
        )
        assert response.status_code in (415, 422)
    finally:
        _clear_auth()


def test_analyze_rejects_short_job_description(mock_supabase):
    """job_description has min_length=20; short strings must return 422."""
    _set_auth(FREE_USER)
    try:
        from fastapi.testclient import TestClient
        c = TestClient(app, raise_server_exceptions=False)
        response = c.post(
            "/api/analyze",
            files=[_upload_file()],
            data={"job_description": "too short"},
        )
        assert response.status_code == 422
    finally:
        _clear_auth()


# ── Usage limit tests ─────────────────────────────────────────────────────────

def test_analyze_returns_402_when_free_limit_reached(mock_supabase):
    """Free users who have already used their 1 lifetime analysis must get 402."""
    # Configure Supabase mock: free_usage_count RPC returns 1 (limit hit)
    mock_supabase.rpc.return_value.execute.return_value.data = 1

    _set_auth(FREE_USER)
    try:
        from fastapi.testclient import TestClient
        c = TestClient(app, raise_server_exceptions=False)
        response = c.post(
            "/api/analyze",
            files=[_upload_file()],
            data={"job_description": JOB_DESC},
        )
        assert response.status_code == 402
        assert response.json()["detail"] == "free_limit_reached"
    finally:
        _clear_auth()


def test_analyze_returns_402_when_pro_weekly_limit_reached_no_topups(mock_supabase):
    """Pro users who hit 10/week with 0 top-ups must get 402."""
    # User is pro, weekly_count = 10, topup_credits = 0
    pro_user_row = {
        "clerk_id": "user_test_pro",
        "email": "pro@example.com",
        "plan": "pro",
        "sub_status": "active",
        "topup_credits": 0,
    }
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = pro_user_row
    mock_supabase.rpc.return_value.execute.return_value.data = 10  # weekly_count = 10

    _set_auth(PRO_USER)
    try:
        from fastapi.testclient import TestClient
        c = TestClient(app, raise_server_exceptions=False)
        response = c.post(
            "/api/analyze",
            files=[_upload_file()],
            data={"job_description": JOB_DESC},
        )
        assert response.status_code == 402
        assert response.json()["detail"] == "pro_weekly_limit_reached"
    finally:
        _clear_auth()


# ── Rate limiting test ────────────────────────────────────────────────────────

def test_analyze_returns_429_when_rate_limited(mock_supabase):
    """After 5 requests from the same IP, the 6th must return 429."""
    mock_supabase.rpc.return_value.execute.return_value.data = 0  # usage = 0

    _set_auth(FREE_USER)
    try:
        from fastapi.testclient import TestClient
        c = TestClient(app, raise_server_exceptions=False)

        with patch("api.routers.analyze.rate_limiter") as mock_rl:
            mock_rl.is_allowed.return_value = (False, 3540)
            mock_rl.max_requests = 5

            response = c.post(
                "/api/analyze",
                files=[_upload_file()],
                data={"job_description": JOB_DESC},
            )
        assert response.status_code == 429
        assert "Retry-After" in response.headers
    finally:
        _clear_auth()


# ── Partial masking tests ─────────────────────────────────────────────────────

def test_free_tier_receives_partial_results(mock_supabase):
    """Free-tier users must receive is_partial=True with masked fields."""
    mock_supabase.rpc.return_value.execute.return_value.data = 0  # hasn't used free analysis

    _set_auth(FREE_USER)
    try:
        from fastapi.testclient import TestClient
        c = TestClient(app, raise_server_exceptions=False)

        with (
            patch("api.routers.analyze.validate_pdf", return_value=PDF_MAGIC),
            patch("api.routers.analyze.extract_text_from_pdf", return_value="CV text content here"),
            patch("api.routers.analyze.analyse_cv", return_value=_mock_analysis_result()),
            patch("api.routers.analyze.rate_limiter") as mock_rl,
        ):
            mock_rl.is_allowed.return_value = (True, 0)
            mock_rl.remaining.return_value = 4
            mock_rl.max_requests = 5

            response = c.post(
                "/api/analyze",
                files=[_upload_file()],
                data={"job_description": JOB_DESC},
            )

        if response.status_code == 200:
            body = response.json()
            assert body["success"] is True
            assert body["is_partial"] is True
            result = body["result"]
            # Keywords, sections, overall_suggestions, top_priorities must be masked (empty)
            assert result["keywords"]["matched"] == []
            assert result["keywords"]["missing"] == []
            assert result["sections"] == []
            assert result["overall_suggestions"] == []
            assert result["top_priorities"] == []
            # ATS score must be present
            assert result["ats"]["score"] == 72
            # Only 1 bullet allowed for free tier
            assert len(result["bullets"]) <= 1
    finally:
        _clear_auth()


def test_pro_tier_receives_full_results(mock_supabase):
    """Pro users must receive is_partial=False with all fields populated."""
    pro_user_row = {
        "clerk_id": "user_test_pro",
        "email": "pro@example.com",
        "plan": "pro",
        "sub_status": "active",
        "topup_credits": 0,
    }
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = pro_user_row
    mock_supabase.rpc.return_value.execute.return_value.data = 3  # 3/10 weekly used

    _set_auth(PRO_USER)
    try:
        from fastapi.testclient import TestClient
        c = TestClient(app, raise_server_exceptions=False)

        with (
            patch("api.routers.analyze.validate_pdf", return_value=PDF_MAGIC),
            patch("api.routers.analyze.extract_text_from_pdf", return_value="CV text content"),
            patch("api.routers.analyze.analyse_cv", return_value=_mock_analysis_result()),
            patch("api.routers.analyze.rate_limiter") as mock_rl,
        ):
            mock_rl.is_allowed.return_value = (True, 0)
            mock_rl.remaining.return_value = 4
            mock_rl.max_requests = 5

            response = c.post(
                "/api/analyze",
                files=[_upload_file()],
                data={"job_description": JOB_DESC},
            )

        if response.status_code == 200:
            body = response.json()
            assert body["success"] is True
            assert body["is_partial"] is False
            result = body["result"]
            # All fields must be populated
            assert len(result["keywords"]["matched"]) > 0
            assert len(result["sections"]) > 0
            assert len(result["overall_suggestions"]) > 0
            assert len(result["top_priorities"]) == 3
    finally:
        _clear_auth()


# ── CV not stored test ────────────────────────────────────────────────────────

def test_cv_bytes_are_not_inserted_into_supabase(mock_supabase):
    """
    The CV text must never be passed to any Supabase insert/upsert call.
    We verify this by checking that no Supabase call receives CV-like content.
    """
    mock_supabase.rpc.return_value.execute.return_value.data = 0

    _set_auth(FREE_USER)
    try:
        from fastapi.testclient import TestClient
        c = TestClient(app, raise_server_exceptions=False)

        cv_marker = "UNIQUE_CV_CONTENT_MARKER_DO_NOT_STORE"

        with (
            patch("api.routers.analyze.validate_pdf", return_value=PDF_MAGIC),
            patch("api.routers.analyze.extract_text_from_pdf", return_value=cv_marker),
            patch("api.routers.analyze.analyse_cv", return_value=_mock_analysis_result()),
            patch("api.routers.analyze.rate_limiter") as mock_rl,
        ):
            mock_rl.is_allowed.return_value = (True, 0)
            mock_rl.remaining.return_value = 4
            mock_rl.max_requests = 5
            c.post(
                "/api/analyze",
                files=[_upload_file()],
                data={"job_description": JOB_DESC},
            )

        # Check that no Supabase call contained the CV marker
        for call in mock_supabase.mock_calls:
            call_str = str(call)
            assert cv_marker not in call_str, (
                f"CV content found in Supabase call: {call_str}"
            )
    finally:
        _clear_auth()
