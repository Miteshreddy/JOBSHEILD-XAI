from typing import Any

from pydantic import BaseModel


class DecisionSupport(BaseModel):
    recommendation: str
    warnings: list[str]
    verificationSuggestions: list[str]


class AnalysisResponse(BaseModel):
    extractedText: str
    fraudProbability: float
    predictionLabel: str
    trustScore: int
    trustBand: str
    riskCategory: str
    severityScore: int
    severityFlags: list[str]
    shapExplanation: dict[str, Any]
    limeExplanation: dict[str, Any]
    decision: DecisionSupport


class ErrorResponse(BaseModel):
    status: int
    error: str
