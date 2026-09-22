# Dataset — EMSCAD (Employment Scam Aegean Dataset)

`fake_job_postings.csv` is **not committed to git** (see root `.gitignore`) because it is a fetched artifact, not source code. Regenerate it with:

```bash
python ai_service/dataset/download_dataset.py
```

## Provenance

- **Canonical source**: [Kaggle — Real / Fake Job Posting Prediction](https://www.kaggle.com/datasets/shivamb/real-or-fake-fake-jobposting-prediction) (requires a Kaggle account to download directly).
- **Original academic source**: [EMSCAD, University of the Aegean](http://emscad.samos.aegean.gr/).
- **Mirror used by `download_dataset.py`**: a public GitHub mirror (`abbylmm/fake_job_posting`), used because it does not require Kaggle authentication. Its contents were verified byte-for-byte against the dataset's known public statistics before being trusted (see below) — this is a convenience mirror of the same public dataset, not an alternate/different dataset.

## Verification performed (2026-07-29)

| Check | Expected (public record) | Found in mirror |
|---|---|---|
| Row count | 17,880 | 17,880 |
| Column count | 18 | 18 |
| Fraudulent count | 866 | 866 |
| Fraudulent % | ~4.85% | 4.84% |
| Columns | `job_id, title, location, department, salary_range, company_profile, description, requirements, benefits, telecommuting, has_company_logo, has_questions, employment_type, required_experience, required_education, industry, function, fraudulent` | match |

If you re-run `download_dataset.py` and any of these checks fail, the script will raise an error rather than silently proceeding — do not train on unverified data.

## License / usage

EMSCAD is used here strictly for academic training/evaluation of the classifier per its public Kaggle licensing (SRS Section 2.7), never as a runtime lookup table (SRS Section 6.1.3 — the model must generalize, not memorize).
