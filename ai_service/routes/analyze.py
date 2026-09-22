"""FR-1.1-1.4 input endpoints. Each builds a `fields` dict in the standard
shape and hands off to the identical pipeline (FR-1.6) — the only thing that
differs between channels is how the raw content is obtained.
"""
from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile

from ai_service.config.business_rules import MAX_IMAGE_UPLOAD_BYTES, MAX_PDF_UPLOAD_BYTES
from ai_service.input_processing.image_ocr import OcrExtractionError, extract_text_from_image_bytes
from ai_service.input_processing.pdf_extractor import PdfExtractionError, extract_text_from_pdf_bytes
from ai_service.input_processing.url_scraper import ScrapingFailedError, UnsafeUrlError, scrape_job_posting
from ai_service.pipeline import EmptyContentError, run_analysis_pipeline
from ai_service.schemas.requests import TextAnalysisRequest, UrlAnalysisRequest
from ai_service.schemas.responses import AnalysisResponse

router = APIRouter(prefix="/api/v1/analyze", tags=["analyze"])


def _run_or_422(fields: dict) -> AnalysisResponse:
    try:
        return run_analysis_pipeline(fields)
    except EmptyContentError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/text", response_model=AnalysisResponse)
def analyze_text(request: TextAnalysisRequest):
    """UC-1: raw pasted text has no field structure, so it all goes into
    `description` — the shared signal detectors still work correctly since
    they scan the combined text regardless of which field it came from."""
    return _run_or_422({"description": request.text})


@router.post("/url", response_model=AnalysisResponse)
def analyze_url(request: UrlAnalysisRequest):
    """UC-2."""
    try:
        fields = scrape_job_posting(request.url)
    except UnsafeUrlError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ScrapingFailedError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return _run_or_422(fields)


@router.post("/pdf", response_model=AnalysisResponse)
async def analyze_pdf(file: UploadFile = File(...)):
    """UC-3."""
    content = await file.read()
    if len(content) > MAX_PDF_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="PDF exceeds the maximum allowed size.")
    try:
        extracted_text = extract_text_from_pdf_bytes(content)
    except PdfExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return _run_or_422({"description": extracted_text})


@router.post("/image", response_model=AnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """UC-4."""
    content = await file.read()
    if len(content) > MAX_IMAGE_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds the maximum allowed size.")
    try:
        extracted_text = extract_text_from_image_bytes(content)
    except OcrExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return _run_or_422({"description": extracted_text})
