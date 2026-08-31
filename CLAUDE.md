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

### Content import from Word files
Source content lives as `.docx` files in `Data/`. Import into the DB from `backend/`:
```bash
python -m scripts.import_content tests      # or: problems | lectures | all
```

No test suite or linter is configured. No CI/CD pipelines exist.

## Architecture

### Request Flow
1. User opens Telegram bot → launches Mini App via WebApp button
2. Frontend attaches `X-Telegram-Init-Data` header to all API requests (see `frontend/src/api/client.js`)
3. Backend handles business logic in `app/services/`, thin routers in `app/routers/`
4. AI tutor requests proxied through backend to Groq API (`app/services/ai_service.py` — OpenAI SDK pointed at `https://api.groq.com/openai/v1`, model from `GROQ_MODEL` env var, default `openai/gpt-oss-120b`; Llama 3.x models were retired by Groq)
5. Bot runs independent polling loop, calls backend API via httpx

### Frontend Internals
- **State**: Zustand stores — `userStore` (auth state), `progressStore` (scores, streak)
- **Routing**: React Router v6 in `src/App.jsx` — routes are `/`, `/theory`, `/problems`, `/test`, `/progress`, `/rating`, `/ask-ai`, `/help`, `/lab`, `/admin`
- **API proxy**: Vite dev server proxies `/api` → `http://localhost:8000` (see `vite.config.js`)
- **Telegram SDK**: `@twa-dev/sdk` integrated via `src/hooks/useTelegram.js` (haptics, back button, theme)
- **Tailwind**: Custom design tokens in `tailwind.config.js` (colors, animations, gradients)
- **Design system («Дәптер» — dark physics notebook)**: ink background with a faint millimetre grid (`body` in `src/index.css`), amber `primary` (#FFB020, ink text `primary-ink` on it) as the only loud accent, sky `secondary` (#5EC8FF) for formulas/AI. Fonts: Unbounded (`.display` — titles, big numbers) + Golos Text (body); both cover Kazakh Cyrillic. Legacy `.glass*` class names are kept but now mean flat paper cards; blur only on TopBar/BottomNav. Shared primitives: `Button`, `Card`, `EmptyState`, `Toast` (`toast.error(...)` from anywhere), `FormulaRenderer` (KaTeX + Markdown-lite, sanitises LLM LaTeX).

### Backend Internals
- **Entry**: `main.py` — FastAPI app; lifespan hook calls `create_tables()` from `app/database/database.py`
- **DB**: SQLite (or Postgres via `DATABASE_URL`) via SQLAlchemy 2.0. Session dependency via `get_db()` in `app/database/database.py`
- **Startup side effects**: `create_tables()` also runs lightweight in-place migrations (adds missing columns; fixes `telegram_id` to BIGINT on Postgres) and seeds the admin user, theory topics (6 sections + 15 lectures), test question bank, and problems — all in `app/database/database.py`
- **CORS**: controlled by `CORS_ORIGINS` env var (comma-separated; defaults to `*`)
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

Configure `.env` in the `physics-bot/` root — backend and bot both load it from their parent directory:

| Variable | Used By |
|---|---|
| `BOT_TOKEN` / `TELEGRAM_BOT_TOKEN` | bot, backend |
| `MINI_APP_URL` | bot |
| `GROQ_API_KEY` | backend (AI tutor) |
| `BACKEND_URL` | bot |
| `DATABASE_URL` | backend (SQLite default; Postgres supported) |
| `VITE_API_URL` | frontend (production API base) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | backend (seeded admin) |
| `JWT_SECRET_KEY` | backend (admin auth) |
| `ADMIN_TELEGRAM_IDS` | backend (Telegram-side admin access) |
| `CORS_ORIGINS` | backend (comma-separated allowlist) |

## Deployment

- **Backend + Bot + Postgres**: Railway project `physics-bot` (account temabeka67@gmail.com). Backend public URL: `https://backend-production-9f9e0.up.railway.app`. Deploy via CLI: copy the service dir to a clean folder (no repo root around it), `railway link -p physics-bot`, then `railway up --service backend|bot` — `railway up` from inside the repo uploads the whole git root, which breaks the Dockerfile build.
- **Content import to prod DB**: Railway Postgres has no public endpoint; run `scripts/import_content.py` as a one-off Railway service (backend code + `Data/` in one image, `restartPolicyType: NEVER`, `DATABASE_URL=${{Postgres.DATABASE_URL}}`), then `railway down --service importer`.
- **Frontend**: Vercel — `https://tgboterakaa.vercel.app` (this is also the bot's `MINI_APP_URL`). Build with `VITE_API_URL` pointing at the Railway backend; note Vite reads env from the `physics-bot/` root (`envDir: '../'` in `vite.config.js`), not `frontend/.env`. Cloudflare Pages (`npm run pages:deploy`) and Dockerfiles exist as alternatives.
- `render.yaml` (Render) is the legacy backend deployment config.

## Engineering Conventions

- **Kazakh** for all learner-facing content; **English** for code and docs.
- **Tailwind utility classes** only; avoid custom CSS. Follow Telegram theme variables.
- **Mobile-first UX** — must work in Telegram WebView.
- **Thin routers** — business logic goes in `app/services/`, not in router handlers.
- **Pydantic schemas** for all request/response types (`app/schemas/`).
- LaTeX formulas must render correctly via KaTeX (test in `FormulaRenderer` component).
