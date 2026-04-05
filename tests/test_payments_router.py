"""
Tests for api/routers/payments.py

Covers:
- GET  /api/payments/status  — auth required, returns plan data
- POST /api/payments/checkout — auth required, returns Stripe URL
- GET  /api/payments/portal  — auth required, returns portal URL
- DELETE /api/account        — auth required, deletes user data (GDPR Art.17)
"""
import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from api.main import app
from api.services.clerk_auth import require_auth

from tests.conftest import FREE_USER, PRO_USER


def _set_auth(user: dict):
    app.dependency_overrides[require_auth] = lambda: user


def _clear_auth():
    app.dependency_overrides.clear()


# ── /api/payments/status ──────────────────────────────────────────────────────

def test_payment_status_requires_auth(client):
    response = client.get("/api/payments/status")
    assert response.status_code == 401


def test_payment_status_returns_plan_for_free_user(mock_supabase):
    free_row = {
        "clerk_id": "user_test_free",
        "email": "free@example.com",
        "plan": "free",
        "sub_status": "inactive",
        "topup_credits": 0,
    }
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = free_row
    mock_supabase.rpc.return_value.execute.return_value.data = 0

    _set_auth(FREE_USER)
    try:
        c = TestClient(app, raise_server_exceptions=False)
        response = c.get("/api/payments/status")
        assert response.status_code == 200
        body = response.json()
        assert body["plan"] == "free"
        assert body["topup_credits"] == 0
    finally:
        _clear_auth()


def test_payment_status_returns_plan_for_pro_user(mock_supabase):
    pro_row = {
        "clerk_id": "user_test_pro",
        "email": "pro@example.com",
        "plan": "pro",
        "sub_status": "active",
        "topup_credits": 3,
    }
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = pro_row
    mock_supabase.rpc.return_value.execute.return_value.data = 5  # weekly_used = 5

    _set_auth(PRO_USER)
    try:
        c = TestClient(app, raise_server_exceptions=False)
        response = c.get("/api/payments/status")
        assert response.status_code == 200
        body = response.json()
        assert body["plan"] == "pro"
        assert body["sub_status"] == "active"
        assert body["topup_credits"] == 3
    finally:
        _clear_auth()


# ── /api/payments/checkout ────────────────────────────────────────────────────

def test_checkout_requires_auth(client):
    response = client.post(
        "/api/payments/checkout",
        json={"price_id": "price_test123", "mode": "subscription"},
    )
    assert response.status_code == 401


def test_checkout_returns_stripe_url(mock_supabase):
    free_row = {
        "clerk_id": "user_test_free",
        "plan": "free",
        "sub_status": "inactive",
        "topup_credits": 0,
        "stripe_customer_id": None,
    }
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = free_row

    _set_auth(FREE_USER)
    try:
        c = TestClient(app, raise_server_exceptions=False)
        with patch(
            "api.routers.payments.create_checkout_session",
            return_value="https://checkout.stripe.com/pay/cs_test_abc123",
        ):
            response = c.post(
                "/api/payments/checkout",
                json={"price_id": "price_test_pro", "mode": "subscription"},
            )
        assert response.status_code == 200
        assert "checkout.stripe.com" in response.json()["url"]
    finally:
        _clear_auth()


def test_checkout_rejects_invalid_mode(mock_supabase):
    """mode must be 'subscription' or 'payment' — anything else is a 422."""
    _set_auth(FREE_USER)
    try:
        c = TestClient(app, raise_server_exceptions=False)
        response = c.post(
            "/api/payments/checkout",
            json={"price_id": "price_test_pro", "mode": "refund"},  # invalid
        )
        assert response.status_code == 422
    finally:
        _clear_auth()


# ── /api/payments/portal ──────────────────────────────────────────────────────

def test_billing_portal_requires_auth(client):
    response = client.get("/api/payments/portal")
    assert response.status_code == 401


def test_billing_portal_returns_url(mock_supabase):
    pro_row = {
        "clerk_id": "user_test_pro",
        "plan": "pro",
        "sub_status": "active",
        "topup_credits": 0,
        "stripe_customer_id": "cus_test123",
    }
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = pro_row

    _set_auth(PRO_USER)
    try:
        c = TestClient(app, raise_server_exceptions=False)
        with patch(
            "api.routers.payments.create_billing_portal",
            return_value="https://billing.stripe.com/p/session/test_bps123",
        ):
            response = c.get("/api/payments/portal")
        assert response.status_code == 200
        assert "billing.stripe.com" in response.json()["url"]
    finally:
        _clear_auth()


# ── DELETE /api/account (GDPR Art. 17) ───────────────────────────────────────

def test_delete_account_requires_auth(client):
    """Account deletion must be rejected without a valid session token."""
    response = client.delete("/api/account")
    assert response.status_code == 401


def test_delete_account_calls_delete_user_with_correct_clerk_id(mock_supabase):
    """delete_user() must be called exactly once with the authenticated user's clerk_id."""
    _set_auth(FREE_USER)
    try:
        c = TestClient(app, raise_server_exceptions=False)
        with patch("api.routers.payments.delete_user") as mock_delete:
            response = c.delete("/api/account")
        mock_delete.assert_called_once_with("user_test_free")
    finally:
        _clear_auth()


def test_delete_account_returns_200_with_deleted_true(mock_supabase):
    _set_auth(FREE_USER)
    try:
        c = TestClient(app, raise_server_exceptions=False)
        with patch("api.routers.payments.delete_user"):
            response = c.delete("/api/account")
        assert response.status_code == 200
        assert response.json() == {"deleted": True}
    finally:
        _clear_auth()


def test_delete_account_uses_delete_http_method(mock_supabase):
    """GET /api/account should not route to the deletion endpoint."""
    _set_auth(FREE_USER)
    try:
        c = TestClient(app, raise_server_exceptions=False)
        # GET on /api/account should 404 or 405, not delete anything
        with patch("api.routers.payments.delete_user") as mock_delete:
            response = c.get("/api/account")
        mock_delete.assert_not_called()
        assert response.status_code in (404, 405)
    finally:
        _clear_auth()


def test_delete_account_wrong_user_cannot_delete_other(mock_supabase):
    """The deletion uses the clerk_id from the verified JWT — not a user-supplied value."""
    _set_auth({"sub": "user_attacker", "email": "attacker@evil.com"})
    try:
        c = TestClient(app, raise_server_exceptions=False)
        with patch("api.routers.payments.delete_user") as mock_delete:
            response = c.delete("/api/account")
        # The attacker's own clerk_id should be used — not another user's
        if mock_delete.called:
            called_with = mock_delete.call_args[0][0]
            assert called_with == "user_attacker"
            assert called_with != "user_test_free"
    finally:
        _clear_auth()
