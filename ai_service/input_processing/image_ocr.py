"""Module 0 (image/screenshot channel) — FR-1.4, UC-4.

Two OCR backends, selected via the OCR_ENGINE env var:
- "easyocr" (default): pure-Python, downloads its own models, needs no
  system binary — the safer default for a machine that may not have
  Tesseract installed.
- "tesseract": needs the Tesseract system binary present; only usable where
  that's guaranteed (e.g. a Docker image that installs it explicitly).
"""
from __future__ import annotations

import io
import os
from functools import lru_cache

import numpy as np
from PIL import Image

MIN_CONFIDENCE = 0.35
MIN_TEXT_LENGTH = 3


class OcrExtractionError(Exception):
    """Raised when no text could be confidently read from the image (UC-4)."""


def _ocr_engine_name() -> str:
    return os.environ.get("OCR_ENGINE", "easyocr").lower()


@lru_cache(maxsize=1)
def _get_easyocr_reader():
    import easyocr

    return easyocr.Reader(["en"], gpu=_cuda_available())


def _cuda_available() -> bool:
    try:
        import torch

        return torch.cuda.is_available()
    except ImportError:
        return False


def _extract_with_easyocr(image_bytes: bytes) -> str:
    reader = _get_easyocr_reader()
    image = np.array(Image.open(io.BytesIO(image_bytes)).convert("RGB"))
    results = reader.readtext(image)  # list of (bbox, text, confidence)

    confident_lines = [text for _bbox, text, confidence in results if confidence >= MIN_CONFIDENCE]
    return "\n".join(confident_lines)


def _extract_with_tesseract(image_bytes: bytes) -> str:
    import pytesseract

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return pytesseract.image_to_string(image)


def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    engine = _ocr_engine_name()
    text = _extract_with_tesseract(image_bytes) if engine == "tesseract" else _extract_with_easyocr(image_bytes)
    text = text.strip()

    if len(text) < MIN_TEXT_LENGTH:
        raise OcrExtractionError(
            "No readable text could be detected in this image. Try a clearer image or the "
            "Text input mode instead."
        )
    return text
