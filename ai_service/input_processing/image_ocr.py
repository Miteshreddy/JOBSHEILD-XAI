"""Screenshot channel: OCR with RapidOCR (ONNX, pure pip — no system binaries,
no PyTorch). Set OCR_ENGINE=tesseract to use a local Tesseract install instead.
The route falls back to the vision-capable reasoning model when OCR finds
too little text."""
from __future__ import annotations

import io
import os
from functools import lru_cache

import numpy as np
from PIL import Image

MIN_CONFIDENCE = 0.5
MIN_TEXT_LENGTH = 3
MAX_SIDE = 2200


class OcrExtractionError(Exception):
    """Raised when no text could be confidently read from the image."""


def _ocr_engine_name() -> str:
    return os.environ.get("OCR_ENGINE", "rapidocr").lower()


@lru_cache(maxsize=1)
def _get_rapidocr():
    from rapidocr_onnxruntime import RapidOCR

    return RapidOCR()


def _load_image(image_bytes: bytes) -> Image.Image:
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise OcrExtractionError("The file could not be read as an image.") from exc
    scale = MAX_SIDE / max(image.size)
    if scale < 1:
        image = image.resize((int(image.width * scale), int(image.height * scale)))
    return image


def _extract_with_rapidocr(image: Image.Image) -> str:
    result, _elapsed = _get_rapidocr()(np.array(image))
    if not result:
        return ""
    # result rows: [box, text, score]; keep reading order (top-to-bottom, left-to-right).
    rows = sorted((r for r in result if float(r[2]) >= MIN_CONFIDENCE), key=lambda r: (round(r[0][0][1] / 12), r[0][0][0]))
    return "\n".join(r[1] for r in rows)


def _extract_with_tesseract(image: Image.Image) -> str:
    import pytesseract

    return pytesseract.image_to_string(image)


def extract_text_from_image_bytes(image_bytes: bytes) -> str:
    image = _load_image(image_bytes)
    text = (_extract_with_tesseract(image) if _ocr_engine_name() == "tesseract" else _extract_with_rapidocr(image)).strip()
    if len(text) < MIN_TEXT_LENGTH:
        raise OcrExtractionError("No readable text could be detected in this image. Try a sharper screenshot or paste the text instead.")
    return text
