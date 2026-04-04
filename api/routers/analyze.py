from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse

from api.models import AnalyzeResponse, AnalysisResult
from api.services.cv_parser import extract_text_from_pdf
from api.services.analyzer import analyse_cv
from api.services.rate_limiter import rate_limiter
from api.services.file_validator import validate_pdf
from api.services.clerk_auth import require_auth
from api.services.user_service import (
    get_or_create_user,
    check_analysis_allowed,
    record_usage,
    get_user,
)

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


def _apply_partial_mask(result: AnalysisResult) -> AnalysisResult:
    """
    Strip gated fields from the result for free-tier users.

    Free users see: ATS score/grade/summary, 1 bullet improvement.
    Everything else is replaced with empty/null so the frontend can
    render blurred placeholder sections.
    """
    from api.models import KeywordAnalysis, BulletFeedback

    masked_keywords = KeywordAnalysis(matched=[], missing=[], recommended=[])
    first_bullet = result.bullets[:1] if result.bullets else []

    return AnalysisResult(
        ats=result.ats,
        keywords=masked_keywords,
        bullets=first_bullet,
        sections=[],
        overall_suggestions=[],
        top_priorities=[],
    )


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
    Free tier receives partial results only.
    """

    clerk_id: str = user["sub"]
    # Clerk embeds email in the JWT under the "email" claim (if configured)
    email: str = user.get("email", "")

    # ── Ensure user row exists ─────────────────────────────────────────────────
    get_or_create_user(clerk_id, email)

    # ── Usage check ────────────────────────────────────────────────────────────
    allowed_result = check_analysis_allowed(clerk_id)

    if not allowed_result["allowed"]:
        reason = allowed_result["reason"]
        if reason == "free_limit_reached":
            raise HTTPException(
                status_code=402,
                detail="free_limit_reached",
            )
        if reason == "pro_weekly_limit_reached":
            raise HTTPException(
                status_code=402,
                detail="pro_weekly_limit_reached",
            )
        raise HTTPException(status_code=402, detail="usage_limit_reached")

    # ── Rate limiting (IP-based, secondary guard) ──────────────────────────────
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

    # ── Record usage ───────────────────────────────────────────────────────────
    db_user = get_user(clerk_id)
    plan: str = db_user.get("plan", "free")
    used_topup: bool = allowed_result["used_topup"]
    record_usage(clerk_id, plan, used_topup)

    # ── Apply partial mask for free tier ──────────────────────────────────────
    is_partial = plan == "free"
    if is_partial:
        result = _apply_partial_mask(result)

    # ── Response ───────────────────────────────────────────────────────────────
    remaining = rate_limiter.remaining(client_ip)
    response_data = AnalyzeResponse(success=True, result=result, is_partial=is_partial)
    return JSONResponse(
        content=response_data.model_dump(),
        headers={
            "X-RateLimit-Limit": str(rate_limiter.max_requests),
            "X-RateLimit-Remaining": str(remaining),
        },
    )
