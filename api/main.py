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

from api.routers import analyze, waitlist

app = FastAPI(
    title="InternIQ API",
    description="CV analysis API powered by Claude",
    version="1.0.0",
)

# In production, replace "*" with your actual domain e.g. "https://interniq.co.uk"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api")
app.include_router(waitlist.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok"}
