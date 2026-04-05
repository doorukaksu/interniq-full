# InternIQ Security Report

**Date:** 5 April 2026  
**Scope:** Full backend API (`api/`) — authentication, authorisation, input validation, data handling, payment security

---

## Summary

| Area | Status | Notes |
|---|---|---|
| Authentication (Clerk JWT) | PASS | RS256 verified, issuer checked, JWKS cached |
| Authorisation (usage limits) | PASS | Server-side DB checks; no client claims trusted |
| File validation | PASS | Content-type + size + magic bytes |
| Rate limiting | PASS (with caveat) | 5/hr per IP; in-memory only |
| CV data persistence | PASS | Never written to disk or DB |
| Stripe webhook security | PASS | HMAC-SHA256 signature verified |
| CORS policy | PASS | Allowlist: production + localhost only |
| Account deletion (GDPR) | PASS | Hard delete endpoint implemented |
| Automated decision disclosure | PASS | Article 22 documented in Privacy Policy |
| Third-party processor disclosure | PASS | All sub-processors listed in Privacy Policy |

---

## 1. Authentication — Clerk JWT (RS256)

**Implementation:** `api/services/clerk_auth.py`

### What is verified on every protected request
- **Algorithm:** RS256 (asymmetric) — the backend never holds a signing secret.
- **Signature:** Verified against Clerk's public JWKS (`{CLERK_ISSUER}/.well-known/jwks.json`).
- **Issuer (`iss`):** Must match `CLERK_ISSUER` env var exactly. Tokens from other Clerk tenants or forged issuers are rejected.
- **Expiry (`exp`):** Enforced by python-jose — expired tokens raise `JWTError`.
- **Audience (`aud`):** Verification disabled (`verify_aud=False`) — Clerk does not set an audience claim by default. This is acceptable; issuer verification provides the equivalent constraint.

### JWKS caching
Public keys are cached in memory for 10 minutes (`_JWKS_TTL = 600`). This avoids hammering Clerk on every request and is safe because Clerk rotates keys infrequently. A network failure during JWKS fetch returns **503** (service unavailable), not 500, to avoid exposing internals.

### What is NOT verified (acceptable trade-offs)
- **`nbf` (not before):** Not explicitly checked. python-jose does enforce this if the claim is present.
- **Token revocation:** Clerk does not offer real-time revocation via JWKS; revoked tokens remain valid until expiry (short-lived tokens mitigate this).

### Threat coverage
| Threat | Mitigated? |
|---|---|
| Forged token (wrong key) | Yes — RS256 signature check |
| Expired token | Yes — `exp` enforced |
| Wrong issuer | Yes — `iss` checked |
| Missing token | Yes — 401 returned |
| Session token from another Clerk tenant | Yes — issuer mismatch |

---

## 2. Authorisation — Usage Limits & Plan Enforcement

**Implementation:** `api/services/user_service.py`, `api/routers/analyze.py`

### Design principle
**Plan and usage are never read from the frontend.** The authenticated `clerk_id` is extracted from the verified JWT, then looked up in Supabase. Plan downgrades and upgrades are only applied via verified Stripe webhook events — never via API parameters.

### Per-tier limits
| Plan | Limit | Enforcement |
|---|---|---|
| Free | 1 lifetime | `free_usage_count` Supabase RPC |
| Pro | 10/week | `weekly_usage_count` Supabase RPC |
| Pro (limit hit) | Top-up credits | `consume_topup_credit` Supabase RPC |
| Unlimited | None | Always allowed |

### Threat coverage
| Threat | Mitigated? |
|---|---|
| User claiming higher plan via request body | Yes — plan read from DB, not request |
| Bypassing free limit by re-registering | Partial — same Clerk ID enforced; new accounts still get 1 free analysis |
| Race condition on credit consumption | Partial — RPC is not atomic; see Known Gaps |

---

## 3. Input Validation — File Upload

**Implementation:** `api/services/file_validator.py`

Three independent checks are applied in order:

1. **Content-Type header** — must be `application/pdf` or `application/octet-stream`. Rejects `text/html`, `image/*`, etc. (HTTP 415).
2. **Size bounds** — minimum 1 KB (rejects empty/corrupt files), maximum 5 MB. (HTTP 422 / 413).
3. **Magic bytes** — first 4 bytes must be `%PDF`. Rejects ZIP files, executables, images, or any non-PDF file regardless of the claimed content-type. (HTTP 422).

The magic byte check is the most important security control: it prevents attackers from renaming a malicious file to `.pdf` and bypassing the content-type check.

### Threat coverage
| Threat | Mitigated? |
|---|---|
| ZIP/executable disguised as PDF | Yes — magic byte check |
| Empty file (null payload) | Yes — size check |
| DoS via huge upload | Yes — 5 MB cap |
| PDF bomb (deeply nested/recursive) | Partial — pypdf handles most; no explicit decompression bomb protection |

---

## 4. Rate Limiting

**Implementation:** `api/services/rate_limiter.py`

- Sliding window, 5 requests per IP per hour.
- Applied as a **secondary guard** after usage limit checks.
- Thread-safe via `threading.Lock`.
- Returns `Retry-After` header (seconds) when blocked.
- `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers on every response.

### Known Gap — Distributed Rate Limiting
The rate limiter is **in-memory per process**. On Vercel, each cold-start (or concurrent execution) gets a separate instance with an independent counter. Under high load or after a cold-start, a user may exceed 5 requests per hour across multiple instances.

**Recommendation:** Replace with Redis-backed rate limiter (e.g., Upstash Redis) for production at scale. The code already notes this in a `_RedisRateLimiter` stub comment.

---

## 5. CV Data Security — No Persistence

**Implementation:** `api/routers/analyze.py`

The CV processing pipeline is:
```
Upload → validate_pdf() → extract_text_from_pdf() → analyse_cv() → del cv_text
```

- PDF bytes are **read into memory only** — never written to disk or database.
- `del pdf_bytes` and `del cv_text` are called in `finally` blocks after use.
- Supabase only stores: `clerk_id`, `email`, `plan`, usage timestamps. No CV content.
- This is verified in the test suite: `test_cv_bytes_are_not_inserted_into_supabase` checks that no Supabase call receives CV-like content.

---

## 6. Stripe Webhook Security

**Implementation:** `api/services/stripe_service.py`, `api/routers/payments.py`

### Signature verification
Every webhook event is verified with `stripe.Webhook.construct_event(payload, sig_header, webhook_secret)`. This:
- Validates the HMAC-SHA256 signature using the `STRIPE_WEBHOOK_SECRET`.
- Checks the timestamp to prevent replay attacks (Stripe rejects events older than 5 minutes by default).
- Returns HTTP 400 on any failure — not 401, ensuring the endpoint is not confused with the Clerk-auth endpoints.

### Auth bypass
The webhook endpoint deliberately does **not** use `Depends(require_auth)`. It is protected instead by Stripe signature verification. This is correct — Stripe cannot send a Clerk JWT.

### Plan changes are webhook-driven only
User plan state (free/pro/unlimited) is only updated in response to verified Stripe events:
- `customer.subscription.updated` → plan set from price ID
- `customer.subscription.deleted` → downgraded to free
- `invoice.payment_failed` → marked `past_due`

The frontend has no API to directly set a plan.

---

## 7. CORS Policy

**Implementation:** `api/main.py`

```python
allow_origins=["https://interniq.co.uk", "http://localhost:5173"]
```

- Production origin only (`https://` enforced — `http://interniq.co.uk` is not allowed).
- Localhost allowed for local development only.
- `allow_credentials=True` is set (required for Clerk cookies/JWT in browser).
- Allowed methods: `GET`, `POST`, `OPTIONS` only (no `PUT`, `PATCH`, `DELETE` on CORS — though `DELETE /api/account` is accessible from the allowed origins).

### Note on `DELETE` and CORS
The browser will send a CORS preflight (`OPTIONS`) for `DELETE /api/account`. The `OPTIONS` method is in `allow_methods`, so preflight succeeds. This is correct behaviour.

---

## 8. Account Deletion (GDPR Article 17)

**Implementation:** `DELETE /api/account`, `api/services/user_service.delete_user()`

- Requires valid Clerk JWT (401 without auth).
- Deletes `usage` rows first (FK safety), then the `users` row.
- CV content is never stored, so no deletion action is needed for CVs.
- Stripe payment records are intentionally retained per financial regulation — documented in the Privacy Policy.
- Frontend shows a two-step confirmation UI before calling the endpoint.

---

## 9. Known Gaps & Recommendations

| # | Issue | Severity | Recommendation |
|---|---|---|---|
| 1 | **Rate limiter is per-process** | Medium | Replace with Upstash Redis on Vercel |
| 2 | **`topup_credits` decrement is not atomic** | Low | Use a Postgres transaction or RPC with `FOR UPDATE` to prevent race condition on concurrent requests |
| 3 | **JWKS cache has no forced refresh on key rotation** | Low | Add a fallback: if token verification fails, refresh JWKS once and retry |
| 4 | **No request-level logging for audit** | Low | Add structured logs (clerk_id, endpoint, status) for security monitoring |
| 5 | **Audience claim not verified** | Informational | Acceptable given Clerk's default JWT format; consider enabling if Clerk tenant is shared |
| 6 | **No PDF decompression bomb protection** | Low | Add a decompressed-size check or page count cap before parsing |
| 7 | **Clerk account not deleted on `DELETE /api/account`** | Medium | The Supabase user row is deleted but the Clerk account remains. Call Clerk's Backend API (`clerk.users.delete_user(clerk_id)`) to fully remove the account |

---

## 10. Test Coverage

Tests are located in `tests/` and run with `pytest`.

| Test file | What it covers |
|---|---|
| `test_file_validator.py` | 10 tests — content-type, size bounds, magic bytes, disguised files |
| `test_rate_limiter.py` | 11 tests — allow/block logic, retry-after, expiry, thread safety |
| `test_clerk_auth.py` | 10 tests — valid token, expired, wrong issuer, forged key, JWKS failure, require_auth |
| `test_analyze_router.py` | 9 tests — auth enforcement, file validation, usage limits, rate limiting, partial masking, no persistence |
| `test_payments_router.py` | 9 tests — status, checkout, portal, DELETE /api/account auth + correct ID + HTTP method |
| `test_stripe_webhook.py` | 9 tests — signature verification, event handlers, ignored events, no Clerk auth on webhook |

### Running the tests

```bash
pip install -r requirements-dev.txt
pytest
```

---

## Appendix — Security-Relevant Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/analyze` | Clerk JWT | Rate limited + usage gated |
| `GET` | `/api/payments/status` | Clerk JWT | |
| `POST` | `/api/payments/checkout` | Clerk JWT | Validates price_id + mode |
| `GET` | `/api/payments/portal` | Clerk JWT | |
| `POST` | `/api/payments/webhook` | Stripe signature | No Clerk auth |
| `DELETE` | `/api/account` | Clerk JWT | Hard delete; irreversible |
| `GET` | `/api/health` | None | Returns `{"status": "ok"}` only |
