# Paparan.ai

AI-powered policy intelligence system transforming fragmented information into structured, decision-ready briefs for policymakers in ASEAN.

## Status

| Layer | Status |
|---|---|
| Frontend (Vite + React) | ✅ Live on Vercel |
| Backend (FastAPI + LangGraph) | 🔧 Built, deploy to Railway |
| AI agents (Claude + Tavily) | 🔧 Built, needs API keys |
| Database (Supabase + pgvector) | 🔧 Schema ready, needs project |

---

## Architecture

```
React Frontend (Vite)
    ↓ REST + JWT
FastAPI Backend (Railway)
    ↓
LangGraph Orchestrator
    ├── Scraper Agent          (Tavily → Supabase feed_items)
    ├── Gov Intelligence Agent (global-government-analysis skill)
    ├── Financial Analyst Agent (earnings-analysis + macro-rates skills)
    ├── Deep Research Agent    (DeepAgents, cache-first)
    └── Conversational RAG     (PGVector retriever, SSE streaming)
    ↓
Supabase (Postgres + pgvector)
```

---

## Tech Stack

### Frontend
- **Vite + React 19 + TypeScript**
- **Tailwind CSS** — government-grade design system
- **React Router v7** — client-side routing
- **Zustand** — state management
- **TanStack Query** — data fetching

### Backend
- **FastAPI + Uvicorn** — REST API with SSE streaming
- **LangGraph** — multi-agent orchestration
- **DeepAgents** — deep research sub-agent pattern
- **LangChain** — RAG chains, tools, retrievers
- **LangMem** — cross-session user memory
- **langchain-postgres (PGVector)** — vector semantic search
- **Tavily** — web search and scraping
- **Supabase** — Postgres + pgvector + Auth + Storage
- **Railway** — backend deployment + cron

### AI
- **Anthropic Claude** (`claude-sonnet-4-5`) — brief generation, agents
- **Voyage-3** (via `langchain-anthropic`) — embeddings

---

## Project Structure

```
paparan-ai/
├── src/                          # React frontend
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── BriefsLibraryPage.tsx
│   │   ├── BriefDetailPage.tsx
│   │   ├── BriefEditorPage.tsx
│   │   ├── NewsFeedPage.tsx
│   │   ├── WatchlistPage.tsx
│   │   ├── AnalyticsDashboardPage.tsx
│   │   ├── ChatPage.tsx          # Conversational RAG chat
│   │   ├── SettingsPage.tsx
│   │   └── LoginPage.tsx
│   ├── components/
│   │   ├── ui/                   # Design system primitives
│   │   ├── Layout/               # AppShell, Sidebar, Header
│   │   ├── brief/                # Brief display components
│   │   ├── dashboard/            # Dashboard widgets
│   │   └── landing/              # Landing page sections
│   ├── contexts/                 # AppContext (Zustand store)
│   ├── services/                 # briefService (API layer)
│   ├── hooks/                    # Custom React hooks
│   ├── types/                    # TypeScript types (Paparan ontology)
│   └── data/                     # Mock data (dev only)
│
├── backend/                      # Python backend
│   ├── app/
│   │   ├── main.py               # FastAPI app + all routes
│   │   ├── config.py             # Settings + source tier config
│   │   ├── agents/
│   │   │   ├── orchestrator.py   # Top-level router
│   │   │   ├── scraper.py        # Feed ingestion (LangGraph)
│   │   │   ├── gov_intel.py      # Gov intelligence agent
│   │   │   ├── analyst.py        # Financial analyst agent
│   │   │   ├── researcher.py     # Deep research (cache-first)
│   │   │   └── conversational.py # RAG chat agent
│   │   ├── tools/
│   │   │   ├── tavily_tools.py   # Tiered web search
│   │   │   ├── supabase_tools.py # Cache + semantic search tools
│   │   │   └── skills_loader.py  # Claude Code skills loader
│   │   ├── db/
│   │   │   ├── client.py         # Supabase singleton
│   │   │   ├── vector_store.py   # PGVector + retrievers
│   │   │   └── schema.py         # Pydantic ontology models
│   │   └── security/
│   │       └── auth.py           # LangGraph resource-level auth
│   ├── supabase/migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_feed_cache.sql
│   ├── scripts/
│   │   └── install_skills.sh
│   ├── pyproject.toml
│   ├── railway.toml
│   └── Procfile
│
├── supabase/                     # Supabase config
├── docs/                         # Setup guides
├── vercel.json                   # Vercel deployment config
├── IMPLEMENTATION_PLAN.md        # Frontend roadmap
└── BACKEND_IMPLEMENTATION_PLAN.md # Backend roadmap
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Supabase project
- Anthropic API key
- Tavily API key

### Frontend

```bash
npm install
cp .env.example .env   # fill in VITE_API_URL
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Backend

```bash
cd backend
pip install -e .
cp .env.example .env   # fill in all keys
uvicorn app.main:app --reload
```

API runs at [http://localhost:8000](http://localhost:8000)

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable the `vector` extension: **Database → Extensions → vector**
3. Run migrations in order:
   ```bash
   # In Supabase SQL editor:
   # 1. supabase/migrations/001_initial_schema.sql
   # 2. backend/supabase/migrations/002_feed_cache.sql
   # 3. supabase/storage.sql
   ```

### Install Claude Code Skills (optional, for agents)

```bash
cd backend
bash scripts/install_skills.sh
```

---

## Environment Variables

### Frontend (`.env`)
```bash
VITE_API_URL=http://localhost:8000   # Backend URL
```

### Backend (`backend/.env`)
```bash
ANTHROPIC_API_KEY=        # Claude + Voyage embeddings
TAVILY_API_KEY=           # Web search
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=             # postgresql+psycopg://... (for PGVector)
LANGSMITH_API_KEY=        # Optional — LangSmith tracing
LANGSMITH_TRACING=true
FRONTEND_URL=http://localhost:5173
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/paparan` | Generate a policy brief |
| `GET` | `/api/feed` | Paginated ASEAN news feed |
| `GET` | `/api/search?q=` | Semantic search over feed |
| `POST` | `/api/chat` | Conversational RAG (SSE streaming) |
| `GET` | `/api/chat/history/{id}` | Conversation history |
| `GET` | `/api/briefs` | List user's briefs |
| `GET` | `/api/briefs/{id}` | Single brief |
| `POST` | `/api/upload` | Upload document for RAG |
| `POST` | `/api/scrape/trigger` | Manually trigger scraper |
| `POST` | `/api/scrape/cron` | Railway cron endpoint |

---

## News Sources

| Tier | Sources |
|---|---|
| Primary (gov) | parliament.gov.my, parliament.gov.sg, dpr.go.id, bi.go.id, asean.org, worldbank.org, imf.org, congress.gov.ph, quochoi.vn |
| Tier 1 news | reuters.com, apnews.com, bloomberg.com, ft.com |
| Indonesia | antaranews.com, kontan.co.id, bisnis.com, ojk.go.id |
| Islamic / Web3 | salaamgateway.com, coindesk.com, theblock.co |

---

## Deployment

### Frontend → Vercel
Push to `main` — Vercel auto-deploys using `vercel.json` (Vite, output `dist/`).

### Backend → Railway
1. Connect repo to Railway, set root directory to `backend/`
2. Add all env vars from `backend/.env.example`
3. Railway uses `railway.toml` — starts with `uvicorn app.main:app`
4. Add cron: `POST /api/scrape/cron` at `0 22 * * *` UTC (06:00 WIB)

---

## Key Design Decisions

**Palantir Ontology model** — domain modeled as typed Objects (`PolicyBrief`, `FeedItem`, `Source`, `Development`), Links (`brief_has_source`, `user_watches_brief`), and Actions (`GenerateBrief`, `TriggerAlert`). All agent outputs are validated against Pydantic models.

**Cache-first RAG** — Deep Research agent checks `feed_retriever` (PGVector cosine similarity) before calling Tavily. Only hits the API if top score < 0.85. Saves tokens and latency.

**Government-grade privacy** — LangGraph `Auth` resource-level access control: threads tagged with `owner=user_id`, cross-user access returns 404 (not 403 — existence not leaked). Backed by Supabase JWT.

**ASEAN-first positioning** — No direct competitor owns this space. Statt.com targets US/EU corporate GR teams; Paparan targets ASEAN government policymakers.

---

## Roadmap

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the frontend roadmap and [BACKEND_IMPLEMENTATION_PLAN.md](./BACKEND_IMPLEMENTATION_PLAN.md) for the full backend task breakdown.

## License

MIT
