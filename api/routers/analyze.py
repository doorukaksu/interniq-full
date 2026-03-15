from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from api.models import AnalyzeResponse
from api.services.cv_parser import extract_text_from_pdf
from api.services.analyzer import analyse_cv

router = APIRouter()

MAX_FILE_SIZE_MB = 5
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(
    cv: UploadFile = File(..., description="CV in PDF format"),
    job_description: str = Form(..., min_length=20, description="Full job description text"),
):
    """
    Analyse a CV PDF against a job description.
    Returns ATS score, keyword gaps, bullet improvements, and section scores.
    """
    # ── Validate file ──────────────────────────────────────────────────────
    if cv.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_bytes = await cv.read()

    if len(pdf_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB.",
        )

    # ── Extract text ───────────────────────────────────────────────────────
    try:
        cv_text = extract_text_from_pdf(pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # ── Analyse ────────────────────────────────────────────────────────────
    try:
        result = analyse_cv(cv_text, job_description)
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}",
        )

    return AnalyzeResponse(success=True, result=result)
