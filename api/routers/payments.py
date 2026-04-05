"""
Payment endpoints for InternIQ.

POST /api/payments/checkout  — create a Stripe checkout session
POST /api/payments/webhook   — Stripe webhook (no auth, sig-verified)
GET  /api/payments/portal    — return billing portal URL
GET  /api/payments/status    — return current user plan + usage counts
DELETE /api/account          — permanently delete user data (GDPR Article 17)
"""

import os

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from fastapi.responses import JSONResponse

from api.models import (
    CheckoutRequest,
    CheckoutResponse,
    PaymentStatusResponse,
)
from api.services.clerk_auth import require_auth
from api.services.user_service import get_or_create_user, get_user, get_usage_counts, delete_user
from api.services.stripe_service import (
    create_checkout_session,
    create_billing_portal,
    handle_webhook_event,
)

router = APIRouter()


@router.post("/payments/checkout", response_model=CheckoutResponse)
async def checkout(
    body: CheckoutRequest,
    user: dict = Depends(require_auth),
) -> CheckoutResponse:
    """
    Create a Stripe Checkout Session and return the hosted URL.

    price_id must correspond to one of the configured Stripe Price IDs.
    mode must be "subscription" (Pro/Unlimited) or "payment" (top-up).
    """
    clerk_id: str = user["sub"]
    email: str = user.get("email", "")

    # Ensure user row exists before creating the customer
    get_or_create_user(clerk_id, email)

    url = create_checkout_session(clerk_id, email, body.price_id, body.mode)
    return CheckoutResponse(url=url)


@router.post("/payments/webhook")
async def webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
) -> JSONResponse:
    """
    Stripe webhook endpoint.

    No Clerk auth — verified by Stripe signature instead.
    Must receive the raw request body (not parsed JSON).
    """
    if not stripe_signature:
        raise HTTPException(status_code=400, detail="Missing Stripe signature header.")

    payload = await request.body()
    result = handle_webhook_event(payload, stripe_signature)
    return JSONResponse(content={"received": True, "result": result})


@router.get("/payments/portal")
async def billing_portal(user: dict = Depends(require_auth)) -> JSONResponse:
    """Return a Stripe Customer Portal URL for managing subscriptions."""
    clerk_id: str = user["sub"]
    email: str = user.get("email", "")
    get_or_create_user(clerk_id, email)
    url = create_billing_portal(clerk_id, email)
    return JSONResponse(content={"url": url})


@router.get("/payments/status", response_model=PaymentStatusResponse)
async def payment_status(
    user: dict = Depends(require_auth),
) -> PaymentStatusResponse:
    """
    Return the authenticated user's current plan and usage counters.

    Creates the user row if it doesn't exist yet (first visit after sign-up).
    """
    clerk_id: str = user["sub"]
    email: str = user.get("email", "")

    db_user = get_or_create_user(clerk_id, email)
    counts = get_usage_counts(clerk_id)

    return PaymentStatusResponse(
        plan=db_user.get("plan", "free"),
        sub_status=db_user.get("sub_status", "inactive"),
        topup_credits=db_user.get("topup_credits", 0),
        weekly_used=counts["weekly"],
        lifetime_used=counts["lifetime"],
    )


@router.delete("/account")
async def delete_account(user: dict = Depends(require_auth)) -> JSONResponse:
    """
    Permanently delete the authenticated user's data from Supabase.

    Removes: user row, all usage records, subscription status, top-up credits.
    CV content is never stored so requires no deletion action.
    Stripe payment records are retained as required by financial regulation.

    UK GDPR Article 17 — Right to Erasure.
    """
    clerk_id: str = user["sub"]
    delete_user(clerk_id)
    return JSONResponse(content={"deleted": True})
