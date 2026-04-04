"""
Clerk JWT verification for InternIQ backend.

Verifies Clerk session tokens (JWTs) on protected endpoints using
the JWKS endpoint from the Clerk issuer. Public keys are cached in
memory — no secret key is transmitted in verification; only the
Clerk Secret Key is used for server-side API calls if needed.

References:
  https://clerk.com/docs/backend-requests/handling/manual-jwt
"""

import os
import time
from functools import lru_cache

import httpx
from jose import JWTError, jwt
from jose.backends import RSAKey
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# ── Config ────────────────────────────────────────────────────────────────────

CLERK_ISSUER = os.environ.get("CLERK_ISSUER")

if not CLERK_ISSUER:
    raise RuntimeError(
        "CLERK_ISSUER environment variable is not set. "
        "Add it to your .env file (dev) or Vercel dashboard (production)."
    )

JWKS_URL = f"{CLERK_ISSUER}/.well-known/jwks.json"


# Bearer token extractor — auto_error=False so we can return clean 401s
_bearer = HTTPBearer(auto_error=False)

# ── JWKS cache ────────────────────────────────────────────────────────────────
# Cache the public keys for 10 minutes to avoid hammering Clerk on every request.

_jwks_cache: dict = {}
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 600  # seconds


def _get_jwks() -> dict:
    """Return cached JWKS, refreshing if stale."""
    global _jwks_cache, _jwks_fetched_at

    now = time.time()
    if _jwks_cache and (now - _jwks_fetched_at) < _JWKS_TTL:
        return _jwks_cache

    response = httpx.get(JWKS_URL, timeout=5.0)
    response.raise_for_status()
    _jwks_cache = response.json()
    _jwks_fetched_at = now
    return _jwks_cache


# ── Verification ──────────────────────────────────────────────────────────────

def verify_clerk_token(token: str) -> dict:
    """
    Decode and verify a Clerk JWT.

    Returns the decoded payload (claims) on success.
    Raises HTTPException 401 on any failure.
    """
    try:
        jwks = _get_jwks()
        # python-jose accepts a JWKS dict directly
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            options={"verify_aud": False},  # Clerk JWTs have no audience claim by default
        )
        return payload

    except JWTError as exc:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid or expired session token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except httpx.HTTPError as exc:
        # JWKS fetch failed — don't expose internals
        raise HTTPException(
            status_code=503,
            detail="Authentication service temporarily unavailable. Please try again.",
        )


# ── FastAPI dependency ────────────────────────────────────────────────────────

def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Security(_bearer),
) -> dict:
    """
    FastAPI dependency. Inject into any endpoint that requires authentication.

    Usage:
        @router.post("/analyze")
        async def analyze(user: dict = Depends(require_auth), ...):
            user_id = user["sub"]  # Clerk user ID

    Returns the decoded JWT payload dict containing at minimum:
        sub  — Clerk user ID (e.g. "user_2abc...")
        iss  — issuer
        iat  — issued at
        exp  — expiry
    """
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required. Please sign in to use InternIQ.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return verify_clerk_token(credentials.credentials)