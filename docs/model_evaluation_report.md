# Text classifier — held-out evaluation (v2-20261024T072134Z)

The text classifier is one of four signals (language, scam-pattern rules, source & employer
verification, local LLM reasoning) that the fusion engine combines into each verdict. These
numbers are for the classifier alone.

## Model
- `distilbert-base-uncased` fine-tuned for 2 classes (66,955,010 parameters), max 128 tokens,
  1 epoch on 13,000 rows (all fraud + sampled legit), lower 3 blocks frozen —
  a ~30-minute CPU budget. Exported to ONNX and int8-quantised for serving.
- Ensembled with a TF-IDF (word + char n-gram) logistic regression trained on all 22,182 training rows.
- Ensemble weight (0.1 on the transformer) and threshold (0.425) tuned on validation only.

## Data
EMSCAD (17,880), a capped sample of 9,000 real 2023–24 LinkedIn postings, modern tech-job scams,
labelled Indian job posts, and LLM-generated modern examples (training split only).
2,711 exact/near-duplicates were removed **before** splitting (the previous
pipeline split EMSCAD randomly despite 2,093 duplicate title+description pairs).

| Split | Rows | Fraudulent |
|---|---|---|
| Train | 22,182 | 1,009 |
| Validation | 2,498 | 116 |
| Test | 2,498 | 115 |

## Test results (2,498 held-out postings, 115 fraudulent)

| Model | Accuracy | Precision | Recall | F1 | ROC-AUC | PR-AUC |
|---|---|---|---|---|---|---|
| Ensemble (served) | 0.983 | 0.777 | 0.878 | 0.825 | 0.994 | 0.927 |
| DistilBERT alone @0.5 | 0.976 | 0.778 | 0.670 | 0.720 | 0.948 | 0.768 |
| TF-IDF alone @0.5 | 0.982 | 0.773 | 0.861 | 0.815 | 0.994 | 0.930 |

Confusion matrix (ensemble): 2354 true legit, 29 false alarms, 14 missed scams, 101 caught scams.

### By source

| Source | Rows | Fraudulent | Accuracy | Recall | F1 |
|---|---|---|---|---|---|
| emscad | 1547 | 71 | 0.979 | 0.803 | 0.781 |
| india_posts | 59 | 37 | 0.831 | 1.000 | 0.881 |
| linkedin | 885 | 0 | 0.999 | 0.000 | 0.000 |
| tech_scams | 7 | 7 | 1.000 | 1.000 | 1.000 |

## Honest notes
- The 30-minute DistilBERT run is undertrained (F1 0.72 alone), so validation
  tuning gives it a small ensemble weight. `python -m ai_service.bert_model.train_model --epochs 2`
  (no `--fast`, ~4 h on 4 CPU cores, far less on a GPU) is expected to close much of the gap.
- These numbers are not comparable to the old report's 98.73% accuracy: that test set contained
  near-duplicates of training rows and only EMSCAD postings.
- End-to-end verdicts also use verification and reasoning; see `ai_service/tests/test_fusion.py`
  for the scenario guarantees (e.g. an employer-verified LinkedIn posting with no red flags is
  always ≥ 95 legitimate; fee requests and look-alike domains are always scams).
