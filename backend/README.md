# Backend — Explainable Fake Job Detection

Node.js/Express, MVC layout. Auth, request validation, rate limiting, and orchestration of calls to the AI service. See the [root README](../README.md) and [`docs/`](../docs/) for the full project.

## Setup

```bash
npm install
copy .env.example .env    # fill in real secrets for anything beyond local dev
npm run dev                # http://localhost:5000, needs MongoDB + the AI service running
```

API docs: http://localhost:5000/api-docs

## Tests

```bash
npx jest --runInBand
```

Uses `mongodb-memory-server` — no real MongoDB needed to run the suite.

## Layout

```
config/       env loading + MongoDB connection
models/       Mongoose schemas (User, Analysis — SRS Section 6.2)
controllers/  request handlers
routes/       Express routers + OpenAPI (@openapi JSDoc) annotations
middleware/   auth, validation, rate limiting, upload handling, error handling
utils/        JWT helpers, the AI service HTTP client, logger
tests/        Jest + Supertest
```

## Auth model

Access token: short-lived JWT, returned in the response body, sent as `Authorization: Bearer`. Refresh token: longer-lived JWT in an httpOnly cookie (`/api/auth` path only), rotated on every refresh, invalidated globally via a `tokenVersion` bump on logout-all. See `controllers/authController.js`.
