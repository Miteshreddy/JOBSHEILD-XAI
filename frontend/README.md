# Frontend — Explainable Fake Job Detection

React 19 + Vite + TypeScript + Tailwind CSS v4. See the [root README](../README.md) and [`docs/`](../docs/) for the full project.

## Setup

```bash
npm install
npm run dev      # http://localhost:5173, proxies /api to localhost:5000 (see vite.config.ts)
```

## Scripts

- `npm run dev` — dev server with HMR
- `npm run build` — type-check (`tsc -b`) + production build
- `npm test` — Vitest (unit/component tests, jsdom environment)
- `npm run lint` — oxlint

## Structure

```
src/
  api/          axios client + one module per backend resource (auth, analysis, admin)
  store/        zustand auth store (access token in memory only)
  components/
    ui/         generic primitives (Button, Card, Input, Spinner)
    layout/     Navbar, Layout, ProtectedRoute
    dashboard/  Explainability Dashboard pieces (RiskBadge, TrustMeter, SeverityMeter,
                RecommendationCard, SHAP/LIME bar chart)
  pages/        one file per route
  types/        shared TypeScript types matching the backend's Analysis/User shapes
```

## Auth model

The access token lives in memory only (zustand, never localStorage) and is attached via an axios request interceptor. The refresh token is an httpOnly cookie the frontend never reads directly — `App.tsx` calls `/auth/refresh` once on mount to silently restore a session after a page reload, and the axios response interceptor retries once on a 401 by refreshing first.
