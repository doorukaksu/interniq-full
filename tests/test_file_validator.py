"""
Tests for api/services/file_validator.py

Verifies that the PDF validation layer correctly rejects malicious,
oversized, empty, and non-PDF uploads before they reach the parser.
"""
import io
import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

from api.services.file_validator import (
    validate_pdf,
    MAX_FILE_SIZE_BYTES,
    MIN_FILE_SIZE_BYTES,
    PDF_MAGIC,
)


def make_upload(content: bytes, content_type: str = "application/pdf") -> UploadFile:
    """Helper — build a minimal UploadFile for testing."""
    return UploadFile(
        file=io.BytesIO(content),
        filename="test.pdf",
        headers=Headers({"content-type": content_type}),
    )


def valid_pdf_bytes(size: int = MIN_FILE_SIZE_BYTES + 100) -> bytes:
    """Return bytes that look like a valid PDF to the validator (magic bytes + padding)."""
    return PDF_MAGIC + b"-1.4\n" + b"x" * (size - len(PDF_MAGIC) - 5)


# ── Content-Type checks ───────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_rejects_html_content_type():
    upload = make_upload(valid_pdf_bytes(), content_type="text/html")
    with pytest.raises(HTTPException) as exc:
        await validate_pdf(upload)
    assert exc.value.status_code == 415


@pytest.mark.asyncio
async def test_rejects_image_content_type():
    upload = make_upload(valid_pdf_bytes(), content_type="image/jpeg")
    with pytest.raises(HTTPException) as exc:
        await validate_pdf(upload)
    assert exc.value.status_code == 415


@pytest.mark.asyncio
async def test_accepts_octet_stream_content_type():
    """application/octet-stream is allowed — magic bytes are the real check."""
    upload = make_upload(valid_pdf_bytes(), content_type="application/octet-stream")
    result = await validate_pdf(upload)
    assert result[:4] == PDF_MAGIC


# ── Size checks ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_rejects_empty_file():
    upload = make_upload(b"")
    with pytest.raises(HTTPException) as exc:
        await validate_pdf(upload)
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_rejects_file_below_minimum_size():
    """A file with PDF magic but under 1 KB should be rejected as too small."""
    tiny = PDF_MAGIC + b"-1.4\n" + b"x" * 10  # well under 1024 bytes
    upload = make_upload(tiny)
    with pytest.raises(HTTPException) as exc:
        await validate_pdf(upload)
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_rejects_oversized_file():
    """Files over MAX_FILE_SIZE_BYTES (5 MB) must be rejected."""
    large = PDF_MAGIC + b"x" * (MAX_FILE_SIZE_BYTES + 1)
    upload = make_upload(large)
    with pytest.raises(HTTPException) as exc:
        await validate_pdf(upload)
    assert exc.value.status_code == 413


@pytest.mark.asyncio
async def test_accepts_file_exactly_at_max_size():
    content = PDF_MAGIC + b"x" * (MAX_FILE_SIZE_BYTES - len(PDF_MAGIC))
    upload = make_upload(content)
    result = await validate_pdf(upload)
    assert len(result) == MAX_FILE_SIZE_BYTES


# ── Magic bytes checks ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_rejects_zip_disguised_as_pdf():
    """A ZIP file with PDF content-type must be caught by magic byte check."""
    zip_magic = b"PK\x03\x04"
    content = zip_magic + b"x" * MIN_FILE_SIZE_BYTES
    upload = make_upload(content, content_type="application/pdf")
    with pytest.raises(HTTPException) as exc:
        await validate_pdf(upload)
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_rejects_plain_text_disguised_as_pdf():
    content = b"Hello, I am not a PDF at all." + b"x" * MIN_FILE_SIZE_BYTES
    upload = make_upload(content)
    with pytest.raises(HTTPException) as exc:
        await validate_pdf(upload)
    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_rejects_null_bytes_disguised_as_pdf():
    content = b"\x00" * (MIN_FILE_SIZE_BYTES + 100)
    upload = make_upload(content)
    with pytest.raises(HTTPException) as exc:
        await validate_pdf(upload)
    assert exc.value.status_code == 422


# ── Happy path ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_accepts_valid_pdf():
    content = valid_pdf_bytes()
    upload = make_upload(content)
    result = await validate_pdf(upload)
    assert result == content
    assert result[:4] == PDF_MAGIC


@pytest.mark.asyncio
async def test_returns_bytes_unchanged():
    """Validate that the raw bytes returned match exactly what was uploaded."""
    content = PDF_MAGIC + b"-1.7\n" + b"A" * 2000
    upload = make_upload(content)
    result = await validate_pdf(upload)
    assert result == content
