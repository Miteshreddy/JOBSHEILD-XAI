"""Input endpoints. Each builds a `fields` dict and hands off to the same
pipeline; only how the raw content is obtained differs per channel."""
from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool

from ai_service.config.business_rules import MAX_IMAGE_UPLOAD_BYTES, MAX_PDF_UPLOAD_BYTES
from ai_service.input_processing.image_ocr import OcrExtractionError, extract_text_from_image_bytes
from ai_service.input_processing.pdf_extractor import PdfExtractionError, extract_text_from_pdf_bytes
from ai_service.input_processing.url_scraper import ScrapingFailedError, UnsafeUrlError, scrape_job_posting
from ai_service.pipeline import EmptyContentError, run_analysis_pipeline
from ai_service.reasoning import llm
from ai_service.schemas.requests import TextAnalysisRequest, UrlAnalysisRequest
from ai_service.schemas.responses import AnalysisResponse

router = APIRouter(prefix="/api/v1/analyze", tags=["analyze"])

# OCR output shorter than this is treated as a failed read.
MIN_OCR_CHARS = 40


def _run_or_422(fields: dict, input_type: str) -> dict:
    try:
        return run_analysis_pipeline(fields, input_type=input_type)
    except EmptyContentError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/text", response_model=AnalysisResponse)
def analyze_text(request: TextAnalysisRequest):
    """Pasted text has no field structure, so it all goes into `description`."""
    return _run_or_422({"description": request.text}, "text")


@router.post("/url", response_model=AnalysisResponse)
def analyze_url(request: UrlAnalysisRequest):
    try:
        fields = scrape_job_posting(request.url)
    except UnsafeUrlError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except ScrapingFailedError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return _run_or_422(fields, "url")


@router.post("/pdf", response_model=AnalysisResponse)
async def analyze_pdf(file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > MAX_PDF_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="PDF exceeds the maximum allowed size.")
    try:
        extracted_text = await run_in_threadpool(extract_text_from_pdf_bytes, content)
    except PdfExtractionError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return await run_in_threadpool(_run_or_422, {"description": extracted_text}, "pdf")


@router.post("/image", response_model=AnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    content = await file.read()
    if len(content) > MAX_IMAGE_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds the maximum allowed size.")
    try:
        extracted_text = await run_in_threadpool(extract_text_from_image_bytes, content)
    except OcrExtractionError as exc:
        extracted_text, ocr_error = "", exc
    else:
        ocr_error = None
    if len(extracted_text) < MIN_OCR_CHARS:
        transcribed = await run_in_threadpool(llm.transcribe_image, content)
        if transcribed and len(transcribed) > len(extracted_text):
            extracted_text = transcribed
    if not extracted_text:
        raise HTTPException(status_code=422, detail=str(ocr_error or "No readable text found in the image."))
    return await run_in_threadpool(_run_or_422, {"description": extracted_text}, "image")
