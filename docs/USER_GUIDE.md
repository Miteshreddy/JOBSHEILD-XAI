# User Manual

## Analyzing a job posting

1. Go to **Analyze** (works without an account — sign up only if you want your results saved to history).
2. Pick a mode: **Text** (paste it), **URL** (a link to the posting), **PDF Upload**, or **Image Upload** (a screenshot).
3. Click **Analyze**. All four modes run through the identical analysis — the result you get doesn't depend on how you submitted it.

## Reading the result

- **Prediction** — the model's fraudulent/legitimate call and its confidence (fraud probability).
- **Risk badge** (top right) — Low/Medium/High/Critical, color-coded consistently everywhere in the app: green, amber, orange, red.
- **Trust Score** (0–100) — an independent, rule-based credibility score. See the **About** page for exactly which conditions deduct points.
- **Fraud Severity** (0–100) — how dangerous the specific red flags found are, with each triggered flag listed by name.
- **Recommendation** — one plain-language action (e.g. "Verify the company before applying," "Do NOT apply").
- **Warnings** — only shown when there's something to actually warn about; a Low-risk result won't show alarming language for no reason.
- **Explainability** — two expandable panels:
  - *LIME* — which words in **this specific posting** drove the prediction.
  - *SHAP* — what the model relies on **in general**, across many postings, so you can sanity-check whether its overall reasoning makes sense.

## History (requires an account)

Every analysis you run while signed in is saved. Visit **History** to browse past results, filter by risk category, and reopen any of them.

## What this tool is not

It's a decision-support aid, not a verdict. Always independently verify a company's official website and contact channels through your own search, and never pay a fee to apply for or be hired into a job — regardless of what any tool says.
