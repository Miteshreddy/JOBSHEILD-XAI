"""FastAPI AI service entry point (SRS Section 5.2, 5.3).

Run with: `uvicorn ai_service.app:app --host 0.0.0.0 --port 8000`
Interactive docs (SRS Section 2.6): http://localhost:8000/docs
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from pathlib import Path

from dotenv import load_dotenv

# Must run before importing modules that read settings at import time.
load_dotenv(Path(__file__).resolve().parent / ".env")

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402

from ai_service.bert_model.predict import ModelNotTrainedError, get_metadata, get_model  # noqa: E402
from ai_service.reasoning import llm  # noqa: E402
from ai_service.routes.analyze import router as analyze_router  # noqa: E402

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
    title="JobShield — Analysis Service",
    version="2.0.0",
    description=(
        "Text classification, scam-pattern rules, source & employer verification, "
        "local LLM reasoning and evidence fusion."
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


@app.get("/health/components", tags=["health"])
def component_health():
    """Which analysis signals are live — used by setup/launch scripts."""
    try:
        get_model()
        classifier = {"available": True, "version": get_metadata().get("version")}
    except ModelNotTrainedError:
        classifier = {"available": False, "version": None}
    return {"classifier": classifier, "reasoning": llm.status()}


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
