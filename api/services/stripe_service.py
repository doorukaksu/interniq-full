"""
Stripe service for InternIQ.

Handles customer management, checkout sessions, billing portal,
and webhook event processing. All plan state changes are driven
by verified webhook events — never by frontend claims.
"""

from __future__ import annotations

import os
import stripe
from fastapi import HTTPException

from api.services.supabase_client import get_supabase

# ── Stripe initialisation ─────────────────────────────────────────────────────

def _stripe() -> stripe.Stripe:
    """Return a configured Stripe client."""
    key = os.environ.get("STRIPE_SECRET_KEY")
    if not key:
        raise RuntimeError("STRIPE_SECRET_KEY is not set.")
    stripe.api_key = key
    return stripe


# Price ID → plan name mapping (populated from env vars at call time)
def _price_to_plan() -> dict[str, str]:
    return {
        os.environ.get("STRIPE_PRICE_PRO_MONTHLY", ""): "pro",
        os.environ.get("STRIPE_PRICE_PRO_ANNUAL", ""): "pro",
        os.environ.get("STRIPE_PRICE_UNLIMITED_MONTHLY", ""): "unlimited",
        os.environ.get("STRIPE_PRICE_UNLIMITED_ANNUAL", ""): "unlimited",
    }


# ── Customer ──────────────────────────────────────────────────────────────────

def get_or_create_customer(clerk_id: str, email: str) -> str:
    """
    Return the Stripe customer ID for this user, creating one if needed.

    Stores the customer ID in Supabase so we can look it up on future calls
    without hitting the Stripe search API every time.
    """
    _stripe()
    sb = get_supabase()

    result = (
        sb.table("users")
        .select("stripe_customer_id")
        .eq("clerk_id", clerk_id)
        .single()
        .execute()
    )
    existing_id: str | None = result.data.get("stripe_customer_id") if result.data else None

    if existing_id:
        return existing_id

    customer = stripe.Customer.create(
        email=email,
        metadata={"clerk_id": clerk_id},
    )
    sb.table("users").update({"stripe_customer_id": customer.id}).eq(
        "clerk_id", clerk_id
    ).execute()
    return customer.id


# ── Checkout ──────────────────────────────────────────────────────────────────

def create_checkout_session(
    clerk_id: str,
    email: str,
    price_id: str,
    mode: str,  # "subscription" | "payment"
) -> str:
    """
    Create a Stripe Checkout Session and return the hosted URL.

    mode="subscription" for Pro/Unlimited plans.
    mode="payment" for one-time top-up credits.
    """
    _stripe()
    customer_id = get_or_create_customer(clerk_id, email)

    frontend_origin = os.environ.get("FRONTEND_ORIGIN", "https://interniq.co.uk")

    session = stripe.checkout.Session.create(
        customer=customer_id,
        line_items=[{"price": price_id, "quantity": 1}],
        mode=mode,
        success_url=f"{frontend_origin}/optimize?checkout=success",
        cancel_url=f"{frontend_origin}/pricing?checkout=cancelled",
        metadata={"clerk_id": clerk_id},
        # For subscriptions, allow promotion codes
        allow_promotion_codes=mode == "subscription",
    )
    return session.url


# ── Billing portal ────────────────────────────────────────────────────────────

def create_billing_portal(clerk_id: str, email: str) -> str:
    """Return a Stripe Customer Portal URL for managing subscriptions."""
    _stripe()
    customer_id = get_or_create_customer(clerk_id, email)
    frontend_origin = os.environ.get("FRONTEND_ORIGIN", "https://interniq.co.uk")

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{frontend_origin}/optimize",
    )
    return session.url


# ── Webhook handler ───────────────────────────────────────────────────────────

def handle_webhook_event(payload: bytes, sig_header: str) -> dict:
    """
    Verify and process an incoming Stripe webhook event.

    Returns a dict describing what action was taken.
    Raises HTTPException 400 on signature failure.
    """
    _stripe()
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        raise RuntimeError("STRIPE_WEBHOOK_SECRET is not set.")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    # Parse the raw payload as a plain dict — the Stripe SDK objects don't
    # support .get(), so we use the already-verified JSON directly.
    import json
    event_dict: dict = json.loads(payload)
    event_type: str = event_dict["type"]
    data: dict = event_dict["data"]["object"]

    if event_type == "checkout.session.completed":
        return _handle_checkout_completed(data)

    if event_type in ("customer.subscription.created", "customer.subscription.updated"):
        return _handle_subscription_updated(data)

    if event_type == "customer.subscription.deleted":
        return _handle_subscription_deleted(data)

    if event_type == "invoice.payment_failed":
        return _handle_payment_failed(data)

    # Unhandled event — acknowledge without acting
    return {"action": "ignored", "event": event_type}


# ── Internal webhook handlers ─────────────────────────────────────────────────

def _get_clerk_id_from_customer(customer_id: str) -> str | None:
    """Look up clerk_id by Stripe customer ID."""
    sb = get_supabase()
    result = (
        sb.table("users")
        .select("clerk_id")
        .eq("stripe_customer_id", customer_id)
        .execute()
    )
    rows = result.data or []
    return rows[0]["clerk_id"] if rows else None


def _handle_checkout_completed(session: dict) -> dict:
    """
    checkout.session.completed:
    - Subscription mode → activate plan
    - Payment mode (top-up) → add 1 credit
    """
    sb = get_supabase()
    clerk_id: str | None = (
        session.get("metadata", {}).get("clerk_id")
        or _get_clerk_id_from_customer(session.get("customer", ""))
    )
    if not clerk_id:
        return {"action": "skipped", "reason": "no clerk_id found"}

    mode = session.get("mode")

    if mode == "payment":
        # One-time top-up — add 1 credit
        sb.rpc("add_topup_credit", {"p_clerk_id": clerk_id}).execute()
        return {"action": "topup_added", "clerk_id": clerk_id}

    if mode == "subscription":
        # The subscription.updated event will carry the price/plan details.
        # We still record the sub_id here so it's available immediately.
        sub_id = session.get("subscription")
        if sub_id:
            sb.table("users").update(
                {"stripe_sub_id": sub_id, "sub_status": "active"}
            ).eq("clerk_id", clerk_id).execute()
        return {"action": "subscription_initiated", "clerk_id": clerk_id}

    return {"action": "ignored", "mode": mode}


def _handle_subscription_updated(subscription: dict) -> dict:
    """
    customer.subscription.updated:
    Update plan, status, and period end from the subscription object.
    """
    sb = get_supabase()
    customer_id: str = subscription.get("customer", "")
    clerk_id = _get_clerk_id_from_customer(customer_id)
    if not clerk_id:
        return {"action": "skipped", "reason": "unknown customer"}

    price_id: str = subscription["items"]["data"][0]["price"]["id"]
    plan = _price_to_plan().get(price_id, "free")
    status: str = subscription.get("status", "inactive")
    period_end: int | None = subscription.get("current_period_end")

    sb.table("users").update(
        {
            "plan": plan,
            "sub_status": status,
            "stripe_sub_id": subscription["id"],
            "sub_period_end": (
                _epoch_to_iso(period_end) if period_end else None
            ),
        }
    ).eq("clerk_id", clerk_id).execute()

    return {"action": "plan_updated", "clerk_id": clerk_id, "plan": plan}


def _handle_subscription_deleted(subscription: dict) -> dict:
    """
    customer.subscription.deleted:
    Downgrade user to free plan and mark subscription cancelled.
    """
    sb = get_supabase()
    customer_id: str = subscription.get("customer", "")
    clerk_id = _get_clerk_id_from_customer(customer_id)
    if not clerk_id:
        return {"action": "skipped", "reason": "unknown customer"}

    sb.table("users").update(
        {
            "plan": "free",
            "sub_status": "cancelled",
            "stripe_sub_id": None,
            "sub_period_end": None,
        }
    ).eq("clerk_id", clerk_id).execute()

    return {"action": "downgraded_to_free", "clerk_id": clerk_id}


def _handle_payment_failed(invoice: dict) -> dict:
    """
    invoice.payment_failed:
    Mark subscription as past_due.
    """
    sb = get_supabase()
    customer_id: str = invoice.get("customer", "")
    clerk_id = _get_clerk_id_from_customer(customer_id)
    if not clerk_id:
        return {"action": "skipped", "reason": "unknown customer"}

    sb.table("users").update({"sub_status": "past_due"}).eq(
        "clerk_id", clerk_id
    ).execute()

    return {"action": "marked_past_due", "clerk_id": clerk_id}


def _epoch_to_iso(epoch: int) -> str:
    """Convert a Unix timestamp to an ISO 8601 string for Postgres."""
    from datetime import datetime, timezone
    return datetime.fromtimestamp(epoch, tz=timezone.utc).isoformat()
