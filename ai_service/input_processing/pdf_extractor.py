"""Module 0 (PDF channel) — FR-1.3, UC-3.

Uses PyMuPDF for both text extraction and page rasterization; it needs no
system binary (unlike pdf2image, which wraps poppler's pdftoppm) — verified
neither poppler nor tesseract is available on the dev machine, so pure-pip
libraries were prioritized to keep `pip install -r requirements.txt` alone
sufficient.

If a page yields effectively no extractable text (a scanned recruitment
notice with no text layer), it's rasterized and passed through OCR instead of
immediately declaring failure — a deliberate improvement over UC-3's literal
"inform the user" floor behavior (Phase 1 gap-resolution, approved
2026-07-29): a scanned notice is still analyzable if we make the effort.
"""
from __future__ import annotations

import fitz  # PyMuPDF

from ai_service.input_processing.image_ocr import extract_text_from_image_bytes

# A page with fewer than this many extracted characters is treated as
# "no usable text layer" and falls back to OCR.
MIN_CHARS_PER_PAGE = 20
RENDER_DPI = 200


class PdfExtractionError(Exception):
    """Raised when no text could be extracted even after the OCR fallback."""


def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    try:
        page_texts = []
        for page in doc:
            text = page.get_text().strip()
            if len(text) < MIN_CHARS_PER_PAGE:
                text = _ocr_page(page)
            if text:
                page_texts.append(text)
    finally:
        doc.close()

    combined = "\n\n".join(page_texts).strip()
    if not combined:
        raise PdfExtractionError(
            "No text could be extracted from this PDF, even after attempting OCR on scanned "
            "pages. Try the Text or Image input mode instead."
        )
    return combined


def _ocr_page(page: "fitz.Page") -> str:
    zoom = RENDER_DPI / 72  # PDF points are 72 DPI by definition
    pixmap = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom))
    png_bytes = pixmap.tobytes("png")
    return extract_text_from_image_bytes(png_bytes)
