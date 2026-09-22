from ai_service.config.business_rules import BERT_MAX_SEQUENCE_LENGTH
from ai_service.preprocessing.preprocess import preprocess_raw_text, preprocess_record, tokenize_for_bert


def test_tokenize_for_bert_pads_to_max_length():
    tokens = tokenize_for_bert("we are hiring a software engineer")
    assert len(tokens["input_ids"]) == BERT_MAX_SEQUENCE_LENGTH
    assert len(tokens["attention_mask"]) == BERT_MAX_SEQUENCE_LENGTH
    # Real tokens should be attended to (mask=1); padding should not (mask=0)
    assert tokens["attention_mask"][0] == 1
    assert tokens["attention_mask"][-1] == 0


def test_tokenize_for_bert_truncates_long_input():
    long_text = " ".join(["word"] * 2000)
    tokens = tokenize_for_bert(long_text)
    assert len(tokens["input_ids"]) == BERT_MAX_SEQUENCE_LENGTH


def test_preprocess_record_handles_missing_fields():
    fields = {"title": "Software Engineer", "description": "Build great things."}
    result = preprocess_record(fields)
    assert "software engineer" in result["cleaned_text"]
    assert len(result["input_ids"]) == BERT_MAX_SEQUENCE_LENGTH


def test_preprocess_raw_text():
    result = preprocess_raw_text("URGENT hiring now!!! Visit http://example.com")
    assert "http" not in result["cleaned_text"]
    assert len(result["input_ids"]) == BERT_MAX_SEQUENCE_LENGTH
