import io

import numpy as np
import pytest
from PIL import Image, ImageDraw, ImageFont

from ai_service.input_processing import image_ocr


def _make_text_image(text: str) -> bytes:
    image = Image.new("RGB", (900, 200), color="white")
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 40)
    except OSError:
        font = ImageFont.load_default(size=40)
    draw.text((20, 70), text, fill="black", font=font)
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


def _box(y: float, x: float = 10):
    return [[x, y], [x + 100, y], [x + 100, y + 20], [x, y + 20]]


class FakeRapidOcr:
    def __init__(self, rows):
        self.rows = rows

    def __call__(self, _array: np.ndarray):
        return self.rows, 0.01


def test_low_confidence_lines_are_filtered_and_order_is_top_to_bottom(monkeypatch):
    fake = FakeRapidOcr([(_box(60), "Pay a registration fee", 0.95), (_box(10), "URGENT HIRING", 0.9), (_box(30), "garbled", 0.1)])
    monkeypatch.setattr(image_ocr, "_get_rapidocr", lambda: fake)
    result = image_ocr.extract_text_from_image_bytes(_make_text_image("x"))
    assert result.splitlines() == ["URGENT HIRING", "Pay a registration fee"]


def test_no_confident_text_raises_ocr_error(monkeypatch):
    monkeypatch.setattr(image_ocr, "_get_rapidocr", lambda: FakeRapidOcr([(_box(0), "??", 0.05)]))
    with pytest.raises(image_ocr.OcrExtractionError):
        image_ocr.extract_text_from_image_bytes(_make_text_image("anything"))


def test_non_image_bytes_raise_ocr_error():
    with pytest.raises(image_ocr.OcrExtractionError):
        image_ocr.extract_text_from_image_bytes(b"definitely not an image")


@pytest.mark.slow
def test_real_ocr_reads_rendered_text():
    """Runs the real RapidOCR models end to end."""
    result = image_ocr.extract_text_from_image_bytes(_make_text_image("URGENT HIRING NOW"))
    assert "URGENT" in result.upper()
