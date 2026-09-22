from ai_service.preprocessing.text_cleaning import (
    build_combined_text,
    clean_text,
    remove_emails,
    remove_emoji,
    remove_phone_numbers,
    remove_urls,
    strip_html,
)


def test_strip_html_removes_tags_and_unescapes_entities():
    assert strip_html("<p>Great &amp; Job</p>") == " Great & Job "


def test_remove_urls():
    text = "Apply at https://example.com/jobs/123 now"
    assert "https://" not in remove_urls(text)


def test_remove_emails():
    text = "Contact hr@company.com for details"
    assert "@" not in remove_emails(text)


def test_remove_phone_numbers():
    text = "Call +1 (555) 123-4567 today"
    result = remove_phone_numbers(text)
    assert "555" not in result or "123-4567" not in result


def test_remove_emoji():
    text = "Great opportunity \U0001F600 apply now"
    assert "\U0001F600" not in remove_emoji(text)


def test_clean_text_handles_missing_input():
    assert clean_text(None) == ""
    assert clean_text("") == ""


def test_clean_text_handles_pandas_nan():
    # pandas represents a missing CSV cell as float('nan'), which is truthy
    # in Python — a naive `if not text` guard would let it through and crash
    # unicodedata.normalize (regression: found while testing EmscadDataset).
    assert clean_text(float("nan")) == ""


def test_clean_text_lowercases_and_strips_special_characters():
    result = clean_text("URGENT!!! Job @ Company$$$")
    assert result == result.lower()
    assert "$" not in result


def test_clean_text_is_idempotent_on_plain_text():
    plain = "we are hiring a software engineer"
    assert clean_text(plain) == plain


def test_build_combined_text_skips_missing_fields():
    fields = {
        "title": "Software Engineer",
        "company_profile": None,
        "description": "Build things.",
        "requirements": "",
        "benefits": None,
        "location": "Remote",
        "salary_range": None,
        "employment_type": "Full-time",
    }
    combined = build_combined_text(fields)
    assert "software engineer" in combined
    assert "build things" in combined
    assert "remote" in combined
    # No stray separators from empty fields
    assert "[sep]  [sep]" not in combined.lower()
