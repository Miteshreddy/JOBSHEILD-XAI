import pandas as pd
import pytest

from ai_service.bert_model.dataset import EmscadDataset
from ai_service.config.business_rules import BERT_MAX_SEQUENCE_LENGTH


@pytest.fixture
def tiny_csv(tmp_path):
    df = pd.DataFrame([
        {"title": "Software Engineer", "company_profile": "A real company with history.",
         "description": "Build backend systems.", "requirements": "3+ years experience",
         "benefits": "Health insurance", "location": "Remote", "salary_range": "80000-100000",
         "employment_type": "Full-time", "fraudulent": 0},
        {"title": "URGENT WORK FROM HOME", "company_profile": "",
         "description": "Pay registration fee to start.", "requirements": "",
         "benefits": "", "location": "", "salary_range": "", "employment_type": "",
         "fraudulent": 1},
    ])
    path = tmp_path / "tiny.csv"
    df.to_csv(path, index=False)
    return path


def test_dataset_length_and_shapes(tiny_csv):
    dataset = EmscadDataset(tiny_csv)
    assert len(dataset) == 2
    item = dataset[0]
    assert item["input_ids"].shape[0] == BERT_MAX_SEQUENCE_LENGTH
    assert item["attention_mask"].shape[0] == BERT_MAX_SEQUENCE_LENGTH
    assert item["labels"].item() in (0, 1)


def test_class_counts(tiny_csv):
    dataset = EmscadDataset(tiny_csv)
    counts = dataset.class_counts()
    assert counts == {0: 1, 1: 1}
