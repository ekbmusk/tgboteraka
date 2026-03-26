# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Physics Bot is a Telegram Mini App for school-level physics learning. Four services: frontend (React Mini App), backend (FastAPI REST API), bot (aiogram 3 Telegram bot), admin (React admin panel). All orchestrated via Docker Compose.

- **Product language**: Kazakh (all user-facing text)
- **Engineering language**: English (code, comments, docs)
- **Formula format**: LaTeX via KaTeX (`$...$` and `$$...$$`)

## Build & Run Commands

### Frontend (port 3000)
```bash
cd frontend && npm install && npm run dev
```

### Backend (port 8000)
```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
```

### Bot
```bash
cd bot && pip install -r requirements.txt && python main.py
```

### Admin (port 5174)
```bash
cd admin && npm install && npm run dev
```

### All services via Docker
```bash
docker-compose up --build
```

No test suite or linter is configured. No CI/CD pipelines exist.

## Architecture

### Request Flow
1. User opens Telegram bot → launches Mini App via WebApp button
2. Frontend attaches `X-Telegram-Init-Data` header to all API requests (see `frontend/src/api/client.js`)
3. Backend handles business logic in `app/services/`, thin routers in `app/routers/`
4. AI tutor requests proxied through backend to Groq API (`app/services/gemini_service.py`)
5. Bot runs independent polling loop, calls backend API via httpx

### Frontend Internals
- **State**: Zustand stores — `userStore` (auth state), `progressStore` (scores, streak)
- **Routing**: React Router v6 in `src/App.jsx` — routes are `/`, `/theory`, `/problems`, `/test`, `/progress`, `/rating`, `/ask-ai`, `/help`
- **API proxy**: Vite dev server proxies `/api` → `http://localhost:8000` (see `vite.config.js`)
- **Telegram SDK**: `@twa-dev/sdk` integrated via `src/hooks/useTelegram.js` (haptics, back button, theme)
- **Tailwind**: Custom design tokens in `tailwind.config.js` (colors, animations, gradients)

### Backend Internals
- **Entry**: `main.py` — FastAPI app with lifespan hook that auto-creates tables and seeds data
- **DB**: SQLite via SQLAlchemy 2.0. Session dependency via `get_db()` in `app/database/database.py`
- **Auto-seeding**: On startup, seeds admin user, 6 theory topics, and test question bank
- **Auth**: JWT-based admin auth (`app/utils/auth.py`). Telegram users identified by `telegram_id`
- **All routers prefixed with `/api/`**: users, theory, problems, tests, progress, rating, ai, admin
- **Health check**: `GET /health`

### Bot Internals
- **Entry**: `bot/main.py` — aiogram 3 polling with HTML parse mode
- **Config**: `bot/config.py` loads BOT_TOKEN, MINI_APP_URL, BACKEND_URL from env
- **Background task**: Notification loop runs hourly checking for inactive users
- **Backend calls**: Uses httpx.AsyncClient to hit backend API endpoints

### Docker Networking
Services communicate via service names (e.g., bot uses `http://backend:8000`). Backend health check gates frontend, admin, and bot startup.

## Key Environment Variables

Configure `.env` in project root (loaded by all services):

| Variable | Used By |
|---|---|
| `BOT_TOKEN` / `TELEGRAM_BOT_TOKEN` | bot, backend |
| `MINI_APP_URL` | bot |
| `GROQ_API_KEY` | backend (AI tutor) |
| `BACKEND_URL` | bot |
| `DATABASE_URL` | backend |
| `VITE_API_URL` | frontend (production API base) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | backend (seeded admin) |
| `JWT_SECRET_KEY` | backend (admin auth) |

## Engineering Conventions

- **Kazakh** for all learner-facing content; **English** for code and docs.
- **Tailwind utility classes** only; avoid custom CSS. Follow Telegram theme variables.
- **Mobile-first UX** — must work in Telegram WebView.
- **Thin routers** — business logic goes in `app/services/`, not in router handlers.
- **Pydantic schemas** for all request/response types (`app/schemas/`).
- LaTeX formulas must render correctly via KaTeX (test in `FormulaRenderer` component).
