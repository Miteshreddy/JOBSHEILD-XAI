import io

import pytest
from PIL import Image, ImageDraw, ImageFont

from ai_service.input_processing import image_ocr


def _make_text_image(text: str) -> bytes:
    image = Image.new("RGB", (800, 200), color="white")
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("arial.ttf", 36)
    except OSError:
        font = ImageFont.load_default()
    draw.text((20, 80), text, fill="black", font=font)
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


class FakeEasyOcrReader:
    def __init__(self, results):
        self._results = results

    def readtext(self, _image):
        return self._results


def test_low_confidence_lines_are_filtered_out(monkeypatch):
    fake_reader = FakeEasyOcrReader([
        (None, "URGENT HIRING", 0.9),
        (None, "garbled noise", 0.1),
    ])
    monkeypatch.setattr(image_ocr, "_get_easyocr_reader", lambda: fake_reader)

    result = image_ocr.extract_text_from_image_bytes(_make_text_image("URGENT HIRING"))
    assert "URGENT HIRING" in result
    assert "garbled noise" not in result


def test_no_confident_text_raises_ocr_error(monkeypatch):
    fake_reader = FakeEasyOcrReader([(None, "??", 0.05)])
    monkeypatch.setattr(image_ocr, "_get_easyocr_reader", lambda: fake_reader)

    with pytest.raises(image_ocr.OcrExtractionError):
        image_ocr.extract_text_from_image_bytes(_make_text_image("anything"))


@pytest.mark.slow
def test_real_easyocr_reads_rendered_text(monkeypatch):
    """Genuine EasyOCR run (CPU-forced so it doesn't contend with the GPU
    training run) — confirms the real dependency is wired correctly, not
    just the mock plumbing above."""
    monkeypatch.setattr(image_ocr, "_cuda_available", lambda: False)
    image_ocr._get_easyocr_reader.cache_clear()

    image_bytes = _make_text_image("URGENT HIRING NOW")
    result = image_ocr.extract_text_from_image_bytes(image_bytes)
    assert len(result) > 0
