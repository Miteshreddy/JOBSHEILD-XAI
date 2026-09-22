# BERT Fraud Classifier — Held-Out Test Evaluation

Evaluated on 2682 held-out test examples (never seen during training or validation-based early stopping/model selection), using the production decision threshold of 0.65 (tuned on the validation set).

## Metrics

| Metric | Value |
|---|---|
| Accuracy | 0.9873 |
| Precision | 0.9068 |
| Recall | 0.8231 |
| F1 | 0.8629 |
| ROC-AUC | 0.9829 |

## Confusion matrix

| | Predicted legitimate | Predicted fraudulent |
|---|---|---|
| Actual legitimate | 2541 | 11 |
| Actual fraudulent | 23 | 107 |

## Baseline comparison (NFR-20 acceptance criterion)

Fraud-BERT (Taneja, Vashishtha & Ratnoo, *Discover Computing*, 2025) reports F1 0.93 / accuracy 99% on EMSCAD ([source](https://link.springer.com/article/10.1007/s10791-025-09502-8)).

**Meets or exceeds baseline: NO**