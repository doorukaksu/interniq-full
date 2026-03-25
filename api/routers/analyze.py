from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse

from api.models import AnalyzeResponse
from api.services.cv_parser import extract_text_from_pdf
from api.services.analyzer import analyse_cv
from api.services.rate_limiter import rate_limiter
from api.services.file_validator import validate_pdf
from api.services.clerk_auth import require_auth

router = APIRouter()


def _get_client_ip(request: Request) -> str:
    """
    Extract real client IP, respecting Vercel/proxy forwarded headers.
    Falls back to direct connection IP.
    """
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    request: Request,
    # Auth dependency — 401 if missing or invalid Clerk JWT
    user: dict = Depends(require_auth),
    cv: UploadFile = File(..., description="CV in PDF format"),
    job_description: str = Form(..., min_length=20, description="Full job description text"),
):
    """
    Analyse a CV PDF against a job description.

    Requires a valid Clerk session token in the Authorization: Bearer header.
    Rate limited to 5 requests per IP per hour.
    CV bytes are processed in memory and never persisted.
    Returns ATS score, keyword gaps, bullet improvements, and section scores.
    """

    # user["sub"] is the Clerk user ID — available for usage tracking in Phase 2
    user_id: str = user["sub"]

    # ── Rate limiting (by IP — user-level limiting comes in Phase 2) ──────────
    client_ip = _get_client_ip(request)
    allowed, retry_after = rate_limiter.is_allowed(client_ip)

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=(
                f"Too many requests. You can analyse {rate_limiter.max_requests} CVs per hour. "
                f"Please try again in {retry_after // 60} minutes."
            ),
            headers={"Retry-After": str(retry_after)},
        )

    # ── File validation ────────────────────────────────────────────────────────
    pdf_bytes = await validate_pdf(cv)

    # ── Extract text ───────────────────────────────────────────────────────────
    try:
        cv_text = extract_text_from_pdf(pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    finally:
        del pdf_bytes

    # ── Analyse ────────────────────────────────────────────────────────────────
    try:
        result = analyse_cv(cv_text, job_description)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        del cv_text

    # ── Response with rate limit headers ──────────────────────────────────────
    remaining = rate_limiter.remaining(client_ip)
    return JSONResponse(
        content=AnalyzeResponse(success=True, result=result).model_dump(),
        headers={
            "X-RateLimit-Limit": str(rate_limiter.max_requests),
            "X-RateLimit-Remaining": str(remaining),
        },
    )