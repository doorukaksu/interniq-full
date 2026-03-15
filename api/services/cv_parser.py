import io
import pypdf


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extract plain text from a PDF file.
    Returns the concatenated text of all pages.
    Raises ValueError if the PDF is empty or unreadable.
    """
    reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))

    if len(reader.pages) == 0:
        raise ValueError("The uploaded PDF has no pages.")

    pages: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text.strip())

    full_text = "\n\n".join(pages)

    if not full_text.strip():
        raise ValueError(
            "Could not extract text from the PDF. "
            "Make sure it's not a scanned image-only document."
        )

    return full_text
