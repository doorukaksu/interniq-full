from fastapi import UploadFile, HTTPException

# ─── Config ───────────────────────────────────────────────────────────────────
MAX_FILE_SIZE_MB = 5
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

# Real PDF magic bytes — first 4 bytes of every valid PDF file
PDF_MAGIC = b"%PDF"

# Minimum realistic CV size — anything smaller is probably empty or corrupt
MIN_FILE_SIZE_BYTES = 1024  # 1 KB


async def validate_pdf(file: UploadFile) -> bytes:
    """
    Fully validate an uploaded PDF file.

    Checks:
    1. Content-Type header claims PDF
    2. File is not empty and not suspiciously small
    3. File is within size limit
    4. File starts with PDF magic bytes (prevents disguised uploads)

    Returns the raw bytes on success.
    Raises HTTPException on any validation failure.
    The bytes are returned so the router doesn't need to re-read the file.
    """

    # ── 1. Content-Type header check ─────────────────────────────────────────
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(
            status_code=415,
            detail="Only PDF files are accepted. Please upload a .pdf file.",
        )

    # ── 2. Read file ──────────────────────────────────────────────────────────
    pdf_bytes = await file.read()

    # ── 3. Size checks ────────────────────────────────────────────────────────
    if len(pdf_bytes) < MIN_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=422,
            detail="The uploaded file appears to be empty or corrupt.",
        )

    if len(pdf_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE_MB}MB.",
        )

    # ── 4. Magic bytes check ──────────────────────────────────────────────────
    if not pdf_bytes[:4].startswith(PDF_MAGIC):
        raise HTTPException(
            status_code=422,
            detail="The uploaded file is not a valid PDF.",
        )

    return pdf_bytes
