from typing import Any, Literal

from pydantic import BaseModel


class AnalysisResponse(BaseModel):
    extractedText: str
    verdict: Literal["legitimate", "suspicious", "fraudulent"]
    legitimacyScore: int
    fraudProbability: float
    riskCategory: Literal["Low", "Medium", "High", "Critical"]
    confidence: Literal["high", "medium", "low"]
    summary: str
    reasoning: list[str]
    redFlags: list[str]
    greenFlags: list[str]
    advice: list[str]
    company: dict[str, Any]
    source: dict[str, Any]
    checks: list[dict[str, Any]]
    factors: list[dict[str, Any]]
    highlights: list[dict[str, Any]]
    explanation: dict[str, Any] | None = None
    signals: dict[str, Any]
    engine: dict[str, Any]


class ErrorResponse(BaseModel):
    status: int
    error: str
