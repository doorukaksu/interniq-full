"""
User service for InternIQ.

Handles user upsert, usage checks, usage recording, and credit management.
All operations use the service role Supabase client (bypasses RLS).
"""

from __future__ import annotations

from typing import TypedDict

from api.services.supabase_client import get_supabase


# ── Types ─────────────────────────────────────────────────────────────────────

class AnalysisAllowedResult(TypedDict):
    allowed: bool
    reason: str
    used_topup: bool


# ── Public API ────────────────────────────────────────────────────────────────

def get_or_create_user(clerk_id: str, email: str) -> dict:
    """
    Upsert a user row keyed on clerk_id.

    Creates the row on first analysis; subsequent calls are no-ops.
    Returns the current user row.
    """
    sb = get_supabase()
    result = (
        sb.table("users")
        .upsert(
            {"clerk_id": clerk_id, "email": email},
            on_conflict="clerk_id",
            # Don't overwrite plan/credits on conflict — only create if missing
            ignore_duplicates=True,
        )
        .execute()
    )
    # upsert with ignore_duplicates won't return the row on conflict — fetch it
    return get_user(clerk_id)


def get_user(clerk_id: str) -> dict:
    """Fetch the user row by clerk_id. Raises if not found."""
    sb = get_supabase()
    result = (
        sb.table("users")
        .select("*")
        .eq("clerk_id", clerk_id)
        .single()
        .execute()
    )
    return result.data


def check_analysis_allowed(clerk_id: str) -> AnalysisAllowedResult:
    """
    Determine whether the user is allowed to run an analysis.

    Free tier: 1 lifetime analysis.
    Pro tier: 10/week; top-up credits consumed when weekly limit reached.
    Unlimited tier: always allowed.

    Returns a dict with:
        allowed    — whether to proceed
        reason     — human-readable explanation (used for error messages)
        used_topup — whether a top-up credit should be consumed on success
    """
    user = get_user(clerk_id)
    plan: str = user.get("plan", "free")
    topup_credits: int = user.get("topup_credits", 0)

    sb = get_supabase()

    if plan == "free":
        count_result = sb.rpc(
            "free_usage_count", {"p_clerk_id": clerk_id}
        ).execute()
        count: int = count_result.data or 0
        if count >= 1:
            return {
                "allowed": False,
                "reason": "free_limit_reached",
                "used_topup": False,
            }
        return {"allowed": True, "reason": "", "used_topup": False}

    if plan == "pro":
        count_result = sb.rpc(
            "weekly_usage_count", {"p_clerk_id": clerk_id}
        ).execute()
        weekly: int = count_result.data or 0
        if weekly >= 10:
            if topup_credits > 0:
                # Consume a credit and allow
                return {"allowed": True, "reason": "", "used_topup": True}
            return {
                "allowed": False,
                "reason": "pro_weekly_limit_reached",
                "used_topup": False,
            }
        return {"allowed": True, "reason": "", "used_topup": False}

    # unlimited — always allow
    return {"allowed": True, "reason": "", "used_topup": False}


def record_usage(clerk_id: str, plan: str, used_topup: bool) -> None:
    """
    Insert a usage row and, if a top-up was consumed, decrement the credit.
    """
    sb = get_supabase()
    sb.table("usage").insert(
        {
            "clerk_id": clerk_id,
            "plan_at_time": plan,
            "used_topup": used_topup,
        }
    ).execute()

    if used_topup:
        consume_topup(clerk_id)


def consume_topup(clerk_id: str) -> None:
    """Decrement topup_credits by 1 for a user. No-op if already 0."""
    sb = get_supabase()
    # Use RPC-style raw SQL via rpc or a safe update with a floor
    sb.rpc("consume_topup_credit", {"p_clerk_id": clerk_id}).execute()


def get_usage_counts(clerk_id: str) -> dict:
    """Return weekly and lifetime usage counts for display in the UI."""
    sb = get_supabase()
    weekly_result = sb.rpc("weekly_usage_count", {"p_clerk_id": clerk_id}).execute()
    free_result = sb.rpc("free_usage_count", {"p_clerk_id": clerk_id}).execute()
    return {
        "weekly": weekly_result.data or 0,
        "lifetime": free_result.data or 0,
    }
