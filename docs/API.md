# API Reference

Interactive, always-current documentation is generated automatically — this file is a map to it, not a duplicate of it:

- **Backend** (Node/Express): Swagger UI at `/api-docs` (source: JSDoc `@openapi` blocks in `backend/routes/*.js`, assembled by `backend/config/swagger.js`).
- **AI service** (FastAPI): interactive docs at `/docs`, generated automatically from `ai_service/schemas/*.py` and the route handlers in `ai_service/routes/analyze.py` — FastAPI does this without any extra annotation effort.

## Backend endpoint summary

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | none | Create an account (FR-11.2) |
| POST | `/api/auth/login` | none | Authenticate |
| POST | `/api/auth/refresh` | refresh cookie | Rotate the access token |
| POST | `/api/auth/logout` | none | Clear the refresh cookie |
| POST | `/api/auth/logout-all` | required | Revoke every outstanding refresh token |
| GET | `/api/auth/me` | required | Current user profile |
| POST | `/api/analyze/text` | optional | FR-1.1 |
| POST | `/api/analyze/url` | optional | FR-1.2 |
| POST | `/api/analyze/pdf` | optional | FR-1.3 (multipart, field name `file`) |
| POST | `/api/analyze/image` | optional | FR-1.4 (multipart, field name `file`) |
| GET | `/api/analyze/:id` | optional* | Reopen a past analysis (UC-5) |
| GET | `/api/history` | required | FR-10.3/10.4, paginated, filter by `riskCategory`, sort by `createdAt`/`riskCategory` |
| GET | `/api/admin/stats` | admin | Aggregate counts |
| GET | `/api/admin/users` | admin | Paginated user list |

\* Anonymous analyses (no account) are viewable by anyone holding the id; account-owned analyses require the owner's token (403 otherwise).

"Auth: optional" means `POST /api/analyze/*` accepts an `Authorization: Bearer` header to tie the result to an account but works without one (FR-11.3).

## Error shape (IR-11)

Every error response, from both the backend and the AI service, has the same shape:

```json
{ "status": 422, "error": "Validation failed.", "details": [{ "field": "email", "message": "..." }] }
```

`details` is only present for validation errors.

## AI service endpoints (called by the backend, not the frontend directly)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/analyze/text` | `{ "text": string }` |
| POST | `/api/v1/analyze/url` | `{ "url": string }` |
| POST | `/api/v1/analyze/pdf` | multipart, field `file` |
| POST | `/api/v1/analyze/image` | multipart, field `file` |
| GET | `/health` | 200 always; `/analyze/*` still 503s if no model is loaded |

All four `/analyze/*` responses share the `AnalysisResponse` shape (`ai_service/schemas/responses.py`): prediction, trust, risk, severity, both explanations, and the decision-support block — see `ai_service/pipeline.py` for exactly how it's assembled.
