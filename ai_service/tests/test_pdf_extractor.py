import io

import fitz
import pytest
from PIL import Image, ImageDraw, ImageFont

from ai_service.input_processing import image_ocr, pdf_extractor


def _make_text_pdf(text: str) -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), text)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _make_blank_pdf() -> bytes:
    doc = fitz.open()
    doc.new_page()
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def _make_scanned_style_pdf(text: str) -> bytes:
    """A PDF with no text layer at all — just a rasterized image of text, the
    way a scanned recruitment notice would look — to exercise the OCR
    fallback path end to end."""
    image = Image.new("RGB", (800, 200), color="white")
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("arial.ttf", 36)
    except OSError:
        font = ImageFont.load_default()
    draw.text((20, 80), text, fill="black", font=font)

    image_bytes = io.BytesIO()
    image.save(image_bytes, format="PNG")

    doc = fitz.open()
    page = doc.new_page(width=800, height=200)
    page.insert_image(fitz.Rect(0, 0, 800, 200), stream=image_bytes.getvalue())
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def test_extracts_text_from_a_normal_pdf():
    pdf_bytes = _make_text_pdf("Software Engineer position at Acme Corp")
    result = pdf_extractor.extract_text_from_pdf_bytes(pdf_bytes)
    assert "Software Engineer" in result
    assert "Acme Corp" in result


def test_blank_pdf_raises_extraction_error(monkeypatch):
    # Force the OCR fallback to also find nothing, deterministically, rather
    # than depending on EasyOCR's behavior on a truly blank page.
    monkeypatch.setattr(
        pdf_extractor, "extract_text_from_image_bytes", lambda _b: (_ for _ in ()).throw(
            image_ocr.OcrExtractionError("no text")
        )
    )
    with pytest.raises((pdf_extractor.PdfExtractionError, image_ocr.OcrExtractionError)):
        pdf_extractor.extract_text_from_pdf_bytes(_make_blank_pdf())


def test_scanned_pdf_falls_back_to_ocr(monkeypatch):
    # Deterministic stand-in for OCR so this test doesn't depend on EasyOCR's
    # actual recognition accuracy on a synthetic image — the OCR fallback
    # wiring (rasterize -> OCR -> combine) is what's under test here.
    monkeypatch.setattr(
        pdf_extractor, "extract_text_from_image_bytes", lambda _b: "URGENT HIRING NOW"
    )
    pdf_bytes = _make_scanned_style_pdf("URGENT HIRING NOW")
    result = pdf_extractor.extract_text_from_pdf_bytes(pdf_bytes)
    assert "URGENT HIRING NOW" in result
