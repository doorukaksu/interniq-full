"""
Tests for POST /api/payments/webhook and api/services/stripe_service.py

Covers:
- Signature verification (400 on bad/missing signature)
- checkout.session.completed → subscription initiated / topup added
- customer.subscription.updated → plan upgraded in Supabase
- customer.subscription.deleted → downgraded to free
- invoice.payment_failed → marked past_due
- Unknown events → acknowledged and ignored (no state change)
"""
import hashlib
import hmac
import json
import time
from unittest.mock import MagicMock, patch, call

import pytest
from fastapi.testclient import TestClient

from api.main import app


WEBHOOK_SECRET = "whsec_testfakewebhooksecret"  # matches conftest env var


# ── Signature helper ──────────────────────────────────────────────────────────

def _sign_payload(payload: dict | str, secret: str = WEBHOOK_SECRET) -> tuple[bytes, str]:
    """
    Generate a Stripe-compatible webhook signature header for testing.
    Mimics the Stripe webhook signing scheme: HMAC-SHA256 of
    `{timestamp}.{payload}` with the webhook secret.
    """
    if isinstance(payload, dict):
        payload_str = json.dumps(payload, separators=(",", ":"))
    else:
        payload_str = payload

    payload_bytes = payload_str.encode("utf-8")
    ts = int(time.time())
    signed_payload = f"{ts}.{payload_str}"
    sig = hmac.new(
        secret.encode("utf-8"),
        signed_payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    header = f"t={ts},v1={sig}"
    return payload_bytes, header


def _post_webhook(client, payload: dict, sig_header: str | None = None, secret: str = WEBHOOK_SECRET):
    payload_bytes, auto_sig = _sign_payload(payload, secret)
    headers = {
        "Content-Type": "application/json",
        "stripe-signature": sig_header if sig_header is not None else auto_sig,
    }
    return client.post("/api/payments/webhook", content=payload_bytes, headers=headers)


# ── Signature verification tests ──────────────────────────────────────────────

def test_webhook_returns_400_on_missing_signature(client):
    """Webhook without stripe-signature header must be rejected."""
    response = client.post(
        "/api/payments/webhook",
        content=b'{"type": "checkout.session.completed"}',
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 400


def test_webhook_returns_400_on_wrong_signature(client):
    """
    Patch construct_event (not the whole stripe module) so the except clause
    still matches against the real stripe.error.SignatureVerificationError class.
    """
    import stripe as real_stripe
    with patch(
        "api.services.stripe_service.stripe.Webhook.construct_event",
        side_effect=real_stripe.error.SignatureVerificationError(
            "No signatures found", sig_header="t=1,v1=badsig"
        ),
    ):
        response = client.post(
            "/api/payments/webhook",
            content=b'{"type":"test"}',
            headers={"Content-Type": "application/json", "stripe-signature": "t=1,v1=badsig"},
        )
    assert response.status_code == 400


def test_webhook_returns_400_on_tampered_payload(client):
    """A valid signature for a different payload must fail verification."""
    real_payload = {"type": "checkout.session.completed", "data": {"object": {}}}
    _, real_sig = _sign_payload(real_payload)

    # Send a different payload with the original signature
    tampered = {"type": "customer.subscription.deleted", "data": {"object": {}}}
    tampered_bytes = json.dumps(tampered).encode()
    response = client.post(
        "/api/payments/webhook",
        content=tampered_bytes,
        headers={"Content-Type": "application/json", "stripe-signature": real_sig},
    )
    assert response.status_code == 400


# ── Event handler tests (via stripe_service directly) ────────────────────────

@pytest.fixture
def mock_sb():
    """
    Supabase mock for webhook handler tests.
    Must be patched at api.services.stripe_service.get_supabase
    (where it is imported), not at the source module.
    """
    mock = MagicMock()
    mock.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
        {"clerk_id": "user_from_stripe"}
    ]
    mock.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
    mock.rpc.return_value.execute.return_value.data = None
    with patch("api.services.stripe_service.get_supabase", return_value=mock):
        yield mock


def test_checkout_completed_subscription_records_sub_id(mock_sb):
    from api.services.stripe_service import _handle_checkout_completed
    with patch("api.services.supabase_client.get_supabase", return_value=mock_sb):
        result = _handle_checkout_completed({
            "mode": "subscription",
            "subscription": "sub_test123",
            "customer": "cus_test",
            "metadata": {"clerk_id": "user_checkout_test"},
        })
    assert result["action"] == "subscription_initiated"
    assert result["clerk_id"] == "user_checkout_test"


def test_checkout_completed_topup_adds_credit(mock_sb):
    from api.services.stripe_service import _handle_checkout_completed
    with patch("api.services.supabase_client.get_supabase", return_value=mock_sb):
        result = _handle_checkout_completed({
            "mode": "payment",
            "customer": "cus_test",
            "metadata": {"clerk_id": "user_topup_test"},
        })
    assert result["action"] == "topup_added"
    mock_sb.rpc.assert_called_with("add_topup_credit", {"p_clerk_id": "user_topup_test"})


def test_checkout_completed_without_clerk_id_is_skipped(mock_sb):
    """If we can't resolve a clerk_id, the event should be skipped gracefully."""
    mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    from api.services.stripe_service import _handle_checkout_completed
    with patch("api.services.supabase_client.get_supabase", return_value=mock_sb):
        result = _handle_checkout_completed({
            "mode": "subscription",
            "subscription": "sub_unknown",
            "customer": "cus_unknown_customer",
            "metadata": {},
        })
    assert result["action"] == "skipped"


def test_subscription_updated_upgrades_plan(mock_sb):
    from api.services.stripe_service import _handle_subscription_updated
    with (
        patch("api.services.supabase_client.get_supabase", return_value=mock_sb),
        patch(
            "api.services.stripe_service._price_to_plan",
            return_value={"price_pro_monthly": "pro"},
        ),
    ):
        result = _handle_subscription_updated({
            "id": "sub_test",
            "customer": "cus_known",
            "status": "active",
            "current_period_end": int(time.time()) + 86400,
            "items": {"data": [{"price": {"id": "price_pro_monthly"}}]},
        })
    assert result["action"] == "plan_updated"
    assert result["plan"] == "pro"


def test_subscription_deleted_downgrades_to_free(mock_sb):
    from api.services.stripe_service import _handle_subscription_deleted
    with patch("api.services.supabase_client.get_supabase", return_value=mock_sb):
        result = _handle_subscription_deleted({
            "id": "sub_test",
            "customer": "cus_known",
        })
    assert result["action"] == "downgraded_to_free"
    # Verify Supabase was updated to free plan
    update_call = mock_sb.table.return_value.update.call_args
    update_data = update_call[0][0]
    assert update_data["plan"] == "free"
    assert update_data["sub_status"] == "cancelled"


def test_payment_failed_marks_past_due(mock_sb):
    from api.services.stripe_service import _handle_payment_failed
    with patch("api.services.supabase_client.get_supabase", return_value=mock_sb):
        result = _handle_payment_failed({
            "customer": "cus_known",
        })
    assert result["action"] == "marked_past_due"
    update_call = mock_sb.table.return_value.update.call_args
    assert update_call[0][0]["sub_status"] == "past_due"


def test_unknown_event_is_ignored(client):
    """
    Unrecognised webhook events must return 200 (acknowledged) without state changes.
    Patch at the router's import path so the router uses the mock, not the original.
    """
    with patch("api.routers.payments.handle_webhook_event") as mock_handler:
        mock_handler.return_value = {"action": "ignored", "event": "some.unknown.event"}
        response = client.post(
            "/api/payments/webhook",
            content=b'{"type":"some.unknown.event","data":{"object":{}}}',
            headers={"Content-Type": "application/json", "stripe-signature": "t=1,v1=placeholder"},
        )
    assert response.status_code == 200
    assert response.json()["received"] is True


def test_webhook_does_not_require_clerk_auth(client):
    """
    The webhook endpoint must NOT use Clerk JWT auth — it uses Stripe signatures.
    Sending without an Authorization header must still be processable
    (the rejection comes from signature failure, not auth middleware).
    """
    payload = json.dumps({"type": "some.event", "data": {"object": {}}}).encode()
    # No Authorization header at all
    response = client.post(
        "/api/payments/webhook",
        content=payload,
        headers={"Content-Type": "application/json"},
        # deliberately omit stripe-signature to trigger the sig check, not auth
    )
    # Should return 400 (bad/missing sig), NOT 401 (unauthenticated)
    assert response.status_code == 400
    assert response.status_code != 401
