from unittest.mock import patch

from fastapi.testclient import TestClient

from ai_service.app import app
from ai_service.input_processing.url_scraper import ScrapingFailedError, UnsafeUrlError
from ai_service.pipeline import EmptyContentError

client = TestClient(app)

FAKE_RESULT = {
    "extractedText": "urgent hiring pay a fee",
    "verdict": "fraudulent",
    "legitimacyScore": 4,
    "fraudProbability": 0.96,
    "riskCategory": "Critical",
    "confidence": "high",
    "summary": "This job shows strong signs of a scam: asks for a fee or deposit.",
    "reasoning": ["Asks for a registration fee."],
    "redFlags": ["Asks for a fee or deposit"],
    "greenFlags": [],
    "advice": ["Don’t pay anything."],
    "company": {"name": None, "website": None, "verified": False},
    "source": {"inputType": "text", "url": None},
    "checks": [],
    "factors": [],
    "highlights": [],
    "signals": {},
    "engine": {},
}


def test_health_check():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


class TestAnalyzeText:
    def test_returns_analysis_for_valid_text(self):
        with patch("ai_service.routes.analyze.run_analysis_pipeline", return_value=FAKE_RESULT):
            res = client.post("/api/v1/analyze/text", json={"text": "urgent hiring pay a fee"})
        assert res.status_code == 200
        assert res.json()["verdict"] == "fraudulent"
        assert res.json()["legitimacyScore"] == 4

    def test_rejects_empty_text(self):
        res = client.post("/api/v1/analyze/text", json={"text": ""})
        assert res.status_code == 422

    def test_maps_empty_content_error_to_422(self):
        with patch(
            "ai_service.routes.analyze.run_analysis_pipeline",
            side_effect=EmptyContentError("no usable text"),
        ):
            res = client.post("/api/v1/analyze/text", json={"text": "   "})
        assert res.status_code == 422


class TestAnalyzeUrl:
    def test_returns_analysis_for_valid_url(self):
        with patch("ai_service.routes.analyze.scrape_job_posting", return_value={"description": "text"}), patch(
            "ai_service.routes.analyze.run_analysis_pipeline", return_value=FAKE_RESULT
        ):
            res = client.post("/api/v1/analyze/url", json={"url": "https://example.com/job"})
        assert res.status_code == 200

    def test_maps_unsafe_url_to_400(self):
        with patch(
            "ai_service.routes.analyze.scrape_job_posting",
            side_effect=UnsafeUrlError("resolves to a non-public address"),
        ):
            res = client.post("/api/v1/analyze/url", json={"url": "http://169.254.169.254/job"})
        assert res.status_code == 400

    def test_maps_scraping_failure_to_422(self):
        with patch(
            "ai_service.routes.analyze.scrape_job_posting",
            side_effect=ScrapingFailedError("insufficient content"),
        ):
            res = client.post("/api/v1/analyze/url", json={"url": "https://example.com/job"})
        assert res.status_code == 422


class TestAnalyzePdf:
    def test_rejects_oversized_pdf(self):
        big_content = b"%PDF-1.4\n" + b"0" * (11 * 1024 * 1024)
        res = client.post(
            "/api/v1/analyze/pdf", files={"file": ("big.pdf", big_content, "application/pdf")}
        )
        assert res.status_code == 413
