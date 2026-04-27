# Paparan.ai

AI-powered policy intelligence system transforming fragmented information into structured, decision-ready briefs for policymakers in ASEAN.


## 📖 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Status](#-status)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Database Setup (Supabase)](#-database-setup-supabase)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Policy Alignment (RPJMN & RDTII)](#-policy-alignment-rpjmn--rdtii)
- [Bellingcat OSINT Integration](#-bellingcat-osint-integration)
- [LLM Provider Switching](#-llm-provider-switching)
- [News Sources](#-news-sources)
- [Running Tests](#-running-tests)
- [Key Design Decisions](#-key-design-decisions)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [FAQ & Troubleshooting](#-faq--troubleshooting)
- [License](#-license)

## 🌟 Overview
Government policymakers face an overwhelming volume of fragmented data—from news articles and corporate filings to geospatial anomalies and conflict reports. **Paparan.ai** cuts through the noise by deploying a multi-agent AI system that aggregates, cross-references, and synthesizes OSINT (Open Source Intelligence) into actionable, decision-ready policy briefs. 

Designed specifically for the ASEAN geopolitical landscape, Paparan.ai ensures that intelligence is preserved, policy proposals align with national development goals (like Indonesia's RPJMN), and diplomats receive exactly what they need to act.

## ✨ Key Features
- **Multi-Agent Orchestration**: A sophisticated LangGraph pipeline featuring specialized agents (Scraper, Gov Intel, Analyst, Researcher, Simulator) working in concert.
- **Deep OSINT Integration**: Built-in integrations with Bellingcat-approved tools (Sentinel Hub, VesselFinder, OpenCorporates, NASA FIRMS, ACLED).
- **Auto-Archiving**: Every scraped intelligence source is automatically archived to the Wayback Machine to prevent link rot and preserve historical records.
- **Automatic Policy Alignment**: Policy briefs are instantly scored against Indonesia's RPJMN Asta Cita and ASEAN RDTII pillars.
- **Diplomat & Executive Exports**: One-click generation of PDF memos, PowerPoint slide decks, and Diplomat Briefings complete with talking points and distribution lists.
- **Cache-First RAG**: High-performance Retrieval-Augmented Generation using Supabase pgvector to reduce LLM latency and API costs.
- **LLM Agnostic**: Seamlessly switch between Anthropic (Claude) and z.ai (OpenAI-compatible) models without changing agent code.

## 🚦 Status


| Layer | Status |
|---|---|
| Frontend (Vite + React 19) | ✅ Live on Vercel |
| Backend (FastAPI + LangGraph) | ✅ Deployable via Railway or Docker |
| AI agents (DeepAgents + claude-opus-4-5 / z.ai) | ✅ Built — needs `ANTHROPIC_API_KEY` or `ZAI_API_KEY` |
| Database (Supabase + pgvector) | ✅ Schema ready — needs Supabase project |
| RPJMN/RDTII scoring | ✅ Static Asta Cita 8-pillar + RDTII 7-pillar scoring |
| PDF/PPTX export | ✅ reportlab + python-pptx with diagonal watermarks |
| Diplomat briefing | ✅ Protocol memo, K/L distribution list, talking points, read receipt |
| Bellingcat OSINT tools | ✅ Spatial, maritime, corporate, environmental, archive, conflict |
| Palantir ontology tools | ✅ Wired to Supabase (SDI indicators, K/L codes, policy docs) |
| Spatial / geo tools | ✅ Real Nominatim geocoding + OSM/Sentinel Hub links |
| ASEAN intelligence | ✅ Policy simulator, knowledge graph, cross-brief synthesis |
| Intelligence cycle | ✅ Change tracking, urgency scoring, outcome feedback loop |

---

## 🏗 Architecture

```
React Frontend (Vite + React 19)
    ↓ REST + Supabase JWT
FastAPI Backend (Railway / Docker)
    ↓
LangGraph Orchestrator
    ├── Scraper Agent          (Tavily → Supabase feed_items + Wayback auto-archive)
    ├── Gov Intelligence Agent (DeepAgents + SDI tools + spatial + conflict + maritime)
    ├── Financial Analyst Agent (DeepAgents + corporate actor + stability index)
    ├── Deep Research Agent    (cache-first PGVector → Tavily, claude-opus-4-5 / z.ai)
    ├── RPJMN Scorer Agent     (static Asta Cita 8-pillar + RDTII 7-pillar)
    ├── ASEAN Simulator Agent  (scenario modeling + knowledge graph)
    ├── Synthesizer Agent      (cross-brief pattern recognition)
    └── Conversational RAG     (DeepAgents + PGVector retriever, SSE streaming)
    ↓
Supabase (Postgres + pgvector)
    ↓
Bellingcat OSINT Layer
    ├── spatial_agent.py       (Nominatim + Sentinel Hub + Google Earth)
    ├── maritime_tools.py      (VesselFinder AIS + strait traffic)
    ├── corporate_tools.py     (OpenCorporates ASEAN jurisdictions)
    ├── environmental_tools.py (GFW deforestation + NASA FIRMS + Global Fishing Watch)
    ├── archive_tools.py       (Wayback Machine CDX auto-archiving)
    └── conflict_tools.py      (ACLED events + stability index)
```

---

## 🛠 Tech Stack

### Frontend
- **Vite + React 19 + TypeScript**
- **Tailwind CSS** — government-grade design system
- **React Router v7** — client-side routing
- **Zustand** — state management
- **TanStack Query** — data fetching with API fallback to mock data

### Backend
- **FastAPI + Uvicorn** — REST API with SSE streaming
- **LangGraph** — multi-agent orchestration
- **DeepAgents** (`create_deep_agent`) — all agent construction
- **LangChain** — RAG chains, tools, retrievers
- **LangMem** — cross-session user memory + knowledge graph
- **langchain-postgres (PGVector)** — vector semantic search
- **Tavily** — tiered web search (7 tools, cache-first, parallel fetch)
- **Supabase** — Postgres + pgvector + Auth + Storage
- **reportlab + python-pptx** — PDF/PPTX export with watermarks
- **Railway** — backend deployment + cron
- **Docker** — containerized deployment

### AI / LLM
- **Anthropic Claude** (`claude-opus-4-5`) — default LLM for all agents
- **z.ai** (`z1-preview`) — optional drop-in replacement via `LLM_PROVIDER=zai`
- **Voyage-3** (via `langchain-anthropic`) — embeddings

### OSINT / Bellingcat Integration
- **Nominatim (OpenStreetMap)** — free geocoding, no API key
- **Sentinel Hub EO Browser** — satellite imagery links
- **VesselFinder** — public AIS vessel tracking
- **OpenCorporates** — corporate registration lookup (free tier, 500 req/day)
- **Global Forest Watch** — deforestation alerts API
- **NASA FIRMS** — fire hotspot data (free MAP_KEY)
- **Global Fishing Watch** — fishing vessel activity (public tier)
- **Wayback Machine CDX** — source archiving (free, no key)
- **ACLED** — conflict event data (free registration)

---

## 📂 Project Structure

```
paparan-ai/
├── src/                          # React frontend
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── BriefsLibraryPage.tsx  # + cross-brief synthesis
│   │   ├── BriefDetailPage.tsx    # + export buttons, RPJMN alignment, outcome rating
│   │   ├── BriefEditorPage.tsx    # + AI generation panel (POST /api/paparan)
│   │   ├── NewsFeedPage.tsx       # + live feed from backend
│   │   ├── WatchlistPage.tsx
│   │   ├── AnalyticsDashboardPage.tsx
│   │   ├── AseanDashboardPage.tsx # RDTII tracker, simulator, knowledge graph
│   │   ├── ChatPage.tsx           # SSE streaming with auth token
│   │   ├── SettingsPage.tsx
│   │   └── LoginPage.tsx
│   ├── components/
│   │   ├── brief/
│   │   │   ├── RpjmnAlignment.tsx  # 8-pillar + RDTII score bars
│   │   │   └── DiplomatView.tsx    # Protocol memo, distribution list, talking points
│   │   └── ...
│   └── services/
│       ├── api.ts                  # Central API client with Supabase JWT injection
│       ├── briefService.ts         # Real API calls + mock fallback
│       └── exportService.ts        # PDF/PPTX/diplomat download, outcome, synthesis
│
├── backend/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── app/
│   │   ├── main.py                 # 35+ endpoints
│   │   ├── config.py               # + LLM_PROVIDER, ZAI_API_KEY, FIRMS_MAP_KEY, ACLED_*
│   │   ├── llm.py                  # LLM factory — Anthropic or z.ai
│   │   ├── agents/
│   │   │   ├── orchestrator.py     # + spatial/env/archive enrichment, version chaining
│   │   │   ├── scraper.py          # + Wayback auto-archive on ingest
│   │   │   ├── gov_intel.py        # + conflict, maritime, spatial tools
│   │   │   ├── analyst.py          # + corporate actor, stability index
│   │   │   ├── researcher.py       # cache-first RAG → Tavily
│   │   │   ├── conversational.py   # SSE streaming RAG
│   │   │   ├── rpjmn_scorer.py
│   │   │   ├── asean_simulator.py
│   │   │   └── synthesizer.py
│   │   ├── tools/
│   │   │   ├── tavily_tools.py     # 7 tools, Bellingcat domains, cache-first
│   │   │   ├── supabase_tools.py
│   │   │   ├── palantir_tools.py   # Wired to real Supabase data
│   │   │   ├── spatial_tools.py    # Real Nominatim geocoding
│   │   │   ├── rpjmn_tools.py      # Asta Cita scoring + talking points
│   │   │   ├── rdtii_tools.py      # 7-pillar mapper
│   │   │   ├── export_tools.py     # PDF, PPTX, diplomat PDF
│   │   │   ├── knowledge_graph.py  # LangMem entity graph
│   │   │   └── bellingcat/
│   │   │       ├── spatial_agent.py
│   │   │       ├── maritime_tools.py
│   │   │       ├── corporate_tools.py
│   │   │       ├── environmental_tools.py
│   │   │       ├── archive_tools.py
│   │   │       └── conflict_tools.py
│   │   └── db/
│   │       └── schema.py           # PolicyBrief + rpjmn_alignment, spatial_context, etc.
│   ├── supabase/migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_feed_cache.sql
│   │   ├── 003_bappenas_metadata.sql
│   │   └── 004_rpjmn.sql           # brief_versions, brief_outcomes, rpjmn_alignments
│   └── tests/                      # 39 tests, all passing
│       ├── conftest.py             # Stubs all external deps, fixes sys.path
│       ├── test_rpjmn_tools.py
│       ├── test_export_tools.py
│       ├── test_knowledge_graph.py
│       ├── test_spatial_tools.py
│       ├── test_palantir_tools.py
│       ├── test_maritime_tools.py
│       ├── test_corporate_tools.py
│       ├── test_environmental_tools.py
│       ├── test_archive_tools.py
│       └── test_conflict_tools.py
```

---

## 🚀 Comprehensive Setup Guide

This step-by-step tutorial will guide you from zero to a fully running local instance of Paparan.ai.

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/paparan-ai.git
cd paparan-ai
```

### Step 2: Get Required API Keys
Paparan requires a few API keys to function fully. 
1. **Anthropic (Claude)**: Go to [console.anthropic.com](https://console.anthropic.com/), add billing credits (even $5 is enough for testing), and generate an API key. 
   *Alternative*: Use **z.ai** by setting `LLM_PROVIDER=zai` and getting a key from [z.ai](https://z.ai).
2. **Tavily (Search)**: Go to [tavily.com](https://tavily.com/), sign up, and get an API key. The free tier gives you 1,000 searches/month.
3. **Supabase**: Go to [supabase.com](https://supabase.com) and create a new free project.

*(Optional but recommended OSINT keys)*:
- **NASA FIRMS**: For fire hotspots. Register at [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/api/).
- **ACLED**: For conflict data. Register at [acleddata.com](https://acleddata.com/register/).

### Step 3: Supabase Database Setup 🗄
1. Once your Supabase project is ready, go to **Database → Extensions**.
2. Search for `vector` and enable the **pgvector** extension.
3. Go to **Database → SQL Editor → New query**.
4. You must run the migrations in exact order. Open the files in your code editor, copy the contents, and run them sequentially in Supabase:
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `backend/supabase/migrations/002_feed_cache.sql`
   - Run `backend/supabase/migrations/003_bappenas_metadata.sql`
   - Run `backend/supabase/migrations/004_rpjmn.sql`
5. Go to **Project Settings → API** and copy your `Project URL`, `anon` public key, and `service_role` secret key.
6. Go to **Project Settings → Database** and copy the `Connection string (URI)`. Ensure you select **psycopg** mode (should look like `postgresql+psycopg://...`).

### Step 4: Backend Setup (Python) 🐍
1. Open a new terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -e .
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
5. Edit `backend/.env` with your API keys from Step 2 & 3:
   ```env
   ANTHROPIC_API_KEY=your-anthropic-key
   TAVILY_API_KEY=your-tavily-key
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql+psycopg://...
   FRONTEND_URL=http://localhost:5173
   ```
6. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend is now running at http://localhost:8000*

### Step 5: Frontend Setup (React) ⚛️
1. Open a second terminal window and stay in the root project folder:
   ```bash
   # Make sure you are in the paparan-ai root directory
   npm install
   ```
2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
3. Edit the root `.env` file:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *The frontend is now running at http://localhost:5173*

### Step 6: Verify Installation ✅
1. Open your browser to `http://localhost:5173`.
2. You should see the Paparan login/dashboard page.
3. Because the backend is running, the frontend will connect automatically, fetch feed items from your Supabase DB, and allow you to generate AI policy briefs.


## 🚢 Deployment

### Frontend → Vercel

Push to `main` — Vercel auto-deploys. Set in Vercel dashboard:

```
VITE_API_URL=https://your-railway-app.railway.app
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend → Railway

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Set **Root Directory** to `backend/`
3. Railway detects the `Dockerfile` automatically
4. Add all environment variables from the table below
5. Add cron: **Settings → Cron** → `POST /api/scrape/cron` at `0 22 * * *` UTC (06:00 WIB)

### Backend → Docker (self-hosted / VPS)

```bash
cd backend
docker build -t paparan-api .
docker run -p 8000:8000 --env-file .env paparan-api
# or
docker compose up -d
```

---

## 🔐 Environment Variables

### Frontend (`.env`)

```bash
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (`backend/.env`)

**Required:**
```bash
ANTHROPIC_API_KEY=        # Claude + Voyage embeddings — https://console.anthropic.com
TAVILY_API_KEY=           # Web search — https://tavily.com
SUPABASE_URL=             # https://xxxx.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=             # postgresql+psycopg://...
FRONTEND_URL=http://localhost:5173
```

**LLM Provider (choose one):**
```bash
# Default — Anthropic Claude (no extra config needed)
LLM_PROVIDER=anthropic

# Alternative — z.ai (OpenAI-compatible)
LLM_PROVIDER=zai
ZAI_API_KEY=              # https://z.ai
ZAI_BASE_URL=https://api.z.ai/v1   # default, can omit
ZAI_MODEL=z1-preview               # default, can omit
```

> When `LLM_PROVIDER=zai`, all agents (Gov Intel, Analyst, Researcher, RPJMN Scorer, ASEAN Simulator, Synthesizer, Conversational RAG) switch to z.ai. Voyage-3 embeddings remain on Anthropic regardless.

**Optional (Bellingcat OSINT — tools degrade gracefully without these):**
```bash
FIRMS_MAP_KEY=            # NASA FIRMS fire hotspots — https://firms.modaps.eosdis.nasa.gov/api/
ACLED_API_KEY=            # Conflict events — https://acleddata.com/register/
ACLED_EMAIL=              # ACLED account email

LANGSMITH_API_KEY=        # LangSmith tracing — https://smith.langchain.com
LANGSMITH_TRACING=true
```

---

## 📡 API Endpoints

### Core
| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/paparan` | Generate a policy brief (full agent pipeline) |
| `GET` | `/api/feed` | Paginated ASEAN news feed |
| `GET` | `/api/search?q=` | Semantic search over feed |
| `POST` | `/api/chat` | Conversational RAG (SSE streaming) |
| `GET` | `/api/briefs` | List user's briefs |
| `GET` | `/api/briefs/{id}` | Single brief |
| `POST` | `/api/upload` | Upload document for RAG/SDI extraction |
| `POST` | `/api/scrape/trigger` | Manually trigger scraper |

### Export & Diplomat
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/briefs/{id}/export/pdf` | Download brief as PDF (watermark) |
| `GET` | `/api/briefs/{id}/export/pptx` | Download brief as PowerPoint (5 slides) |
| `POST` | `/api/briefs/{id}/export/diplomat-pdf` | Formal diplomatic memo PDF |
| `POST` | `/api/briefs/{id}/rpjmn-score` | Score brief against RPJMN Asta Cita pillars |
| `POST` | `/api/briefs/{id}/talking-points` | Generate diplomat talking points |
| `POST` | `/api/briefs/{id}/acknowledge` | Record read receipt |
| `GET` | `/api/briefs/{id}/versions` | Brief version history |
| `POST` | `/api/briefs/{id}/outcome` | Record policymaker rating (1–5 stars) |
| `GET` | `/api/briefs/{id}/outcome` | Get outcomes and average rating |

### ASEAN Intelligence
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/asean/simulate` | Simulate ASEAN policy scenario |
| `GET` | `/api/asean/knowledge-graph?q=` | Query policy knowledge graph |
| `POST` | `/api/briefs/synthesize` | Cross-brief synthesis (2–10 briefs) |

### Bellingcat OSINT
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/intelligence/maritime/{region}` | Vessel tracking (VesselFinder AIS) |
| `GET` | `/api/intelligence/environment/{region}` | Deforestation + fire + fishing alerts |
| `GET` | `/api/intelligence/conflict/{region}` | Conflict events (ACLED) |
| `POST` | `/api/intelligence/corporate` | Identify corporate actors in text |
| `POST` | `/api/intelligence/archive` | Archive URL to Wayback Machine |

### Bappenas / SDI
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/bappenas/documents` | List uploaded documents |
| `GET` | `/api/bappenas/indicators` | List extracted SDI indicators |
| `POST` | `/api/bappenas/indicators/check-consistency` | Cross-K/L consistency check |
| `GET` | `/api/bappenas/references/kl-codes` | All K/L codes (148 entries) |
| `GET` | `/api/bappenas/references/sectors` | All sector codes |

---

## 🎯 Policy Alignment (RPJMN & RDTII)

### RPJMN 2025–2029 Asta Cita Pillars

Every brief is automatically scored against Indonesia's 8 national development pillars (keyword-frequency, 0.0–1.0, no external API):

| ID | Pillar |
|---|---|
| AC1 | Memperkuat Ideologi Pancasila |
| AC2 | Memantapkan Sistem Pertahanan dan Keamanan |
| AC3 | Meningkatkan Lapangan Kerja Berkualitas |
| AC4 | Membangun dari Desa dan Bawah |
| AC5 | Melanjutkan Hilirisasi dan Industrialisasi |
| AC6 | Membangun dari Bawah untuk Pemerataan Ekonomi |
| AC7 | Memperkuat Reformasi Politik, Hukum, dan Birokrasi |
| AC8 | Memperkuat Penyelarasan Kehidupan yang Harmonis |

## RDTII Pillars (ASEAN DTS Roadmap / Perpres 195/2024)

| ID | Pillar |
|---|---|
| P1 | Digital Trade Facilitation |
| P2 | Digital Economy Infrastructure |
| P3 | Digital Payments & Fintech |
| P4 | E-Commerce & Digital Trade |
| P5 | Data Governance & Privacy |
| P6 | Cybersecurity & Trust |
| P7 | Digital Inclusion & Capacity |

---

## 🔍 Bellingcat OSINT Integration

All tools degrade gracefully — missing API keys return structured fallbacks, agents never crash.

| Category | Tool | API | Key Required |
|---|---|---|---|
| Spatial | `geolocate_policy_area` | Nominatim (OSM) | No |
| Spatial | `get_satellite_context` | Sentinel Hub viewer | No |
| Maritime | `track_maritime_activity` | VesselFinder public | No |
| Maritime | `get_strait_traffic` | VesselFinder public | No |
| Corporate | `identify_corporate_actors` | OpenCorporates | No (500 req/day) |
| Corporate | `get_asean_subsidiaries` | OpenCorporates | No |
| Environment | `get_deforestation_alerts` | Global Forest Watch | No |
| Environment | `get_fire_hotspots` | NASA FIRMS | `FIRMS_MAP_KEY` (free) |
| Environment | `get_fishing_activity` | Global Fishing Watch | No |
| Archive | `archive_source` | Wayback Machine | No |
| Archive | `check_archive` | Wayback CDX API | No |
| Conflict | `get_conflict_events` | ACLED | `ACLED_API_KEY` (free) |
| Conflict | `get_stability_index` | ACLED | `ACLED_API_KEY` (free) |

---

## 🧠 LLM Provider Switching

Paparan supports two LLM providers via `app/llm.py`:

| Setting | Provider | Model | Notes |
|---|---|---|---|
| `LLM_PROVIDER=anthropic` (default) | Anthropic | `claude-opus-4-5` | Requires `ANTHROPIC_API_KEY` |
| `LLM_PROVIDER=zai` | z.ai | `z1-preview` | Requires `ZAI_API_KEY`; OpenAI-compatible |

Switching providers affects all 9 agents simultaneously. Voyage-3 embeddings always use Anthropic regardless of `LLM_PROVIDER`.

---

## 📰 News Sources

| Tier | Sources |
|---|---|
| Indonesian Government | bappenas.go.id, dpr.go.id, bi.go.id, ojk.go.id, kemenkeu.go.id, bps.go.id |
| ASEAN & International | asean.org, worldbank.org, imf.org, adb.org |
| ASEAN Parliaments | parliament.gov.my, parliament.gov.sg, congress.gov.ph, quochoi.vn |
| Tier 1 News | reuters.com, apnews.com, bloomberg.com, ft.com, channelnewsasia.com |
| Indonesian News | antaranews.com, kontan.co.id, bisnis.com, kompas.com, tempo.co |
| Policy Research | iseas.edu.sg, lowyinstitute.org, crisisgroup.org, csis.org, acleddata.com |
| Environment/OSINT | globalforestwatch.org, globalfishingwatch.org, reliefweb.int, hrw.org |
| Islamic / Web3 | salaamgateway.com, coindesk.com, theblock.co |

---

## 🧪 Running Tests

```bash
cd backend
pip install pytest
python -m pytest tests/ -v
```

Expected: **39 passed** — all tests mock external dependencies via `conftest.py`, no live API calls required.

---

## 💡 Key Design Decisions

**Intelligence cycle** — Paparan implements the full OSINT intelligence cycle: collection (scraper + Tavily), processing (agents), analysis (RPJMN scoring, synthesis), dissemination (PDF/PPTX/diplomat export), and feedback (outcome ratings).

**Graceful degradation** — Every Bellingcat tool catches all exceptions and returns a structured fallback. Agents never crash due to a missing API key or network timeout.

**Cache-first RAG** — Deep Research agent checks PGVector (cosine similarity ≥ 0.85) before calling Tavily. Saves tokens and latency.

**Source preservation** — Every scraped URL is auto-archived to the Wayback Machine. Intelligence doesn't disappear when government pages are deleted.

**LLM portability** — Single `app/llm.py` factory. Switching from Claude to z.ai requires one env var change, zero code changes.

**Frontend fallback** — `briefService.ts` calls the real backend and falls back to in-memory mock data when the API is unreachable. The app is fully usable in offline/dev mode.

**Government-grade privacy** — LangGraph `Auth` resource-level access control: threads tagged with `owner=user_id`, cross-user access returns 404 (not 403 — existence not leaked).

**ASEAN-first positioning** — No direct competitor owns this space. Statt.com targets US/EU corporate GR teams; Paparan targets ASEAN government policymakers.

---

## 🗺 Roadmap

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the frontend roadmap and [BACKEND_IMPLEMENTATION_PLAN.md](./BACKEND_IMPLEMENTATION_PLAN.md) for the full backend task breakdown.


---

## 🤝 Contributing
We welcome contributions from the community! To contribute:
1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

Please ensure that you run the test suite (`pytest tests/`) before submitting your PR.

---

## ❓ FAQ & Troubleshooting

**Q: The AI agents are failing or timing out.**  
A: Ensure your `ANTHROPIC_API_KEY` or `ZAI_API_KEY` is correctly set and has available billing credits.

**Q: The PDF/PPTX export isn't working.**  
A: Ensure you have installed the required system dependencies for `reportlab` and `python-pptx` if you are running outside of Docker.

**Q: Migrations fail to run on Supabase.**  
A: Make sure you run them in the exact order specified (001 through 004). The `pgvector` extension must be enabled *before* running `001_initial_schema.sql`.

---

## 📄 License

MIT
