import os
from pathlib import Path

# Load .env for local development (no-op in production where env vars are set directly)
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    pass  # python-dotenv not required in production

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import analyze, payments

# ── Startup validation ────────────────────────────────────────────────────────
# Fail fast if critical env vars are missing rather than silently misbehaving.

_REQUIRED_ENV_VARS = [
    "ANTHROPIC_API_KEY",
    "CLERK_ISSUER",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
]

_missing = [v for v in _REQUIRED_ENV_VARS if not os.environ.get(v)]
if _missing:
    raise RuntimeError(
        f"Missing required environment variables: {', '.join(_missing)}. "
        "Add them to your .env file (dev) or Vercel dashboard (production)."
    )

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="InternIQ API",
    description="CV analysis API powered by Claude",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://interniq.co.uk", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "stripe-signature"],
)

app.include_router(analyze.router, prefix="/api")
app.include_router(payments.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
