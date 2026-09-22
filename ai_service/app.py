"""FastAPI AI service entry point (SRS Section 5.2, 5.3).

Run with: `uvicorn ai_service.app:app --host 0.0.0.0 --port 8000`
Interactive docs (SRS Section 2.6): http://localhost:8000/docs
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ai_service.bert_model.predict import ModelNotTrainedError, get_model
from ai_service.routes.analyze import router as analyze_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_service")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Loads the model once at process startup rather than on the first
    request, so the first real user doesn't pay the load-time cost. A
    missing model (fresh checkout, before training has run) is logged, not
    fatal — /health still responds, only /analyze/* endpoints will 503."""
    try:
        get_model()
        logger.info("Model loaded successfully at startup.")
    except ModelNotTrainedError as exc:
        logger.warning(f"No trained model available at startup: {exc}")
    yield


app = FastAPI(
    title="Explainable Fake Job Detection — AI Service",
    version="1.0.0",
    description=(
        "Preprocessing, BERT fraud classification, trust/risk/severity/decision engines, "
        "and SHAP+LIME explainability (SRS Modules 1-7)."
    ),
    lifespan=lifespan,
)

_allowed_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5000").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(analyze_router)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


@app.exception_handler(ModelNotTrainedError)
def handle_model_not_trained(_request: Request, exc: ModelNotTrainedError):
    return JSONResponse(status_code=503, content={"status": 503, "error": str(exc)})


@app.exception_handler(Exception)
def handle_unexpected_error(request: Request, exc: Exception):
    """NFR-8: never leak stack traces or internal paths to the client."""
    logger.error(f"Unhandled error on {request.method} {request.url.path}", exc_info=exc)
    return JSONResponse(
        status_code=500, content={"status": 500, "error": "An unexpected error occurred."}
    )
