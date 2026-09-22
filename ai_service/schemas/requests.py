from pydantic import BaseModel, Field


class TextAnalysisRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw pasted job advertisement text (FR-1.1)")


class UrlAnalysisRequest(BaseModel):
    url: str = Field(..., description="Job advertisement URL to scrape (FR-1.2)")
