# Paparan.ai — Backend

AI-powered policy intelligence system backend. FastAPI + LangGraph multi-agent system with Supabase (Postgres + pgvector) for ASEAN policy brief generation.

## Status

| Component | Status |
|-----------|--------|
| Backend (FastAPI + LangGraph) | ✅ Ready for deployment |
| AI Agents (DeepAgents + Claude/Z.AI) | ✅ Built |
| Database (Supabase + pgvector) | ✅ Schema ready |
| API (35+ endpoints) | ✅ Production-ready |

## Quick Start

### Prerequisites

- Python 3.11+
- uv (recommended) or pip
- Supabase project (free tier works)

### Installation

```bash
# Clone and navigate to backend
cd backend

# Install dependencies (uv recommended)
uv pip install -e .

# Or with pip
pip install -e .
```

### Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
# Required — LLM
ANTHROPIC_API_KEY=sk-...
# Or for Z.AI (recommended for cost):
LLM_PROVIDER=zai
ZAI_API_KEY=...

# Required — Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...

# CORS — your frontend domain(s)
ALLOWED_ORIGINS=http://localhost:5173,https://your-app.com
```

### Run Locally

```bash
# Development
uvicorn app.main:app --reload --port 8000

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Test the installation:

```bash
curl http://localhost:8000/health
# {"status":"ok"}
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app + 35+ API endpoints
│   ├── config.py            # Settings (pydantic-settings)
│   ├── llm.py               # LLM factory (Z.AI, Claude, Zhipu)
│   ├── agents/              # LangGraph agents
│   │   ├── orchestrator.py      # Main workflow
│   │   ├── conversational.py    # Chat RAG agent
│   │   ├── scraper.py           # News scraper
│   │   ├── gov_intel.py         # Government intelligence
│   │   ├── researcher.py        # Deep research
│   │   ├── rpjmn_scorer.py      # Policy alignment scoring
│   │   ├── asean_simulator.py   # Policy simulator
│   │   ├── synthesizer.py       # Cross-brief synthesis
│   │   ├── metadata_extractor.py # SDI indicator extraction
│   │   └── consistency_checker.py # Cross-K/L validation
│   ├── db/
│   │   ├── client.py        # Supabase client
│   │   ├── schema.py        # Pydantic models
│   │   ├── sdi_schema.py    # SDI-specific models
│   │   └── vector_store.py  # pgvector RAG
│   ├── tools/
│   │   ├── bellingcat/      # OSINT tools
│   │   │   ├── maritime_tools.py
│   │   │   ├── corporate_tools.py
│   │   │   ├── environmental_tools.py
│   │   │   ├── conflict_tools.py
│   │   │   ├── spatial_agent.py
│   │   │   └── archive_tools.py
│   │   ├── rpjmn_tools.py   # RPJMN talking points
│   │   ├── export_tools.py  # PDF/PPTX generation
│   │   ├── knowledge_graph.py
│   │   └── ...
│   └── security/
│       └── auth.py          # JWT validation
├── tests/                   # pytest tests
├── supabase/
│   ├── migrations/          # SQL migrations
│   └── config.toml          # Supabase local dev
├── scripts/
│   └── install_skills.sh    # LangGraph skills
├── pyproject.toml           # Python dependencies
├── Dockerfile               # Production Docker image
├── docker-compose.yml       # Local Docker compose
└── .env.example             # Environment template
```

## API Endpoints

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/paparan` | Generate policy brief |
| `GET` | `/api/feed` | Get news feed |
| `GET` | `/api/search` | Semantic search |
| `GET` | `/api/briefs` | List user's briefs |
| `GET` | `/api/briefs/{id}` | Get brief by ID |
| `POST` | `/api/chat` | Conversational RAG (SSE) |

### Export Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/briefs/{id}/export/pdf` | Export as PDF |
| `GET` | `/api/briefs/{id}/export/pptx` | Export as PowerPoint |
| `POST` | `/api/briefs/{id}/export/diplomat-pdf` | Diplomatic memo PDF |

### Bellingcat OSINT

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/intelligence/maritime/{region}` | Vessel tracking |
| `GET` | `/api/intelligence/environment/{region}` | Environmental indicators |
| `GET` | `/api/intelligence/conflict/{region}` | Conflict events |
| `POST` | `/api/intelligence/corporate` | Corporate actor extraction |
| `POST` | `/api/intelligence/archive` | Archive URL to Wayback |

### ASEAN Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/asean/simulate` | Policy scenario simulation |
| `GET` | `/api/asean/knowledge-graph` | Query knowledge graph |
| `POST` | `/api/briefs/synthesize` | Cross-brief synthesis |

### SDI/Bappenas (Document Processing)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload document for SDI extraction |
| `GET` | `/api/bappenas/documents` | List documents |
| `GET` | `/api/bappenas/indicators` | List extracted indicators |
| `POST` | `/api/bappenas/indicators/check-consistency` | Run consistency check |

Full API docs available at `http://localhost:8000/docs` when running.

## Tech Stack

- **Framework**: FastAPI 0.115+
- **AI Orchestration**: LangGraph 0.2+, DeepAgents
- **LLM Providers**: 
  - Primary: Z.AI GLM-5.1 (131K context, thinking mode)
  - Fallback: Anthropic Claude Opus 4.5
  - Legacy: Zhipu AI GLM
- **Database**: Supabase (Postgres + pgvector)
- **Auth**: Supabase Auth (JWT)
- **Exports**: reportlab (PDF), python-pptx (PowerPoint)

## Deployment

### Railway

1. Push code to GitHub
2. Connect Railway to repository
3. Set build to use `backend/Dockerfile`
4. Add environment variables from `.env.example`
5. Deploy

Railway reads from `railway.json` at root (already configured).

### Docker

```bash
# Build
docker build -t paparan-backend ./backend

# Run
docker run -p 8000:8000 --env-file backend/.env paparan-backend
```

### Docker Compose

```bash
cd backend
docker-compose up -d
```

## LLM Provider Configuration

### Using Z.AI (Recommended)

```env
LLM_PROVIDER=zai
ZAI_API_KEY=your-key
ZAI_MODEL=glm-5.1
ZAI_ENABLE_THINKING=true
```

### Using Anthropic Claude

```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-key
ANTHROPIC_MODEL=claude-opus-4-5
```

### Using AgentRouter

```env
LLM_PROVIDER=agentrouter
AGENTROUTER_API_KEY=your-key
AGENTROUTER_MODEL=claude-sonnet-4-5-20250929
```

## Running Tests

```bash
cd backend
pytest tests/
```

## Database Setup

1. Create Supabase project
2. Enable pgvector extension:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
3. Run migrations from `supabase/migrations/`
4. Set environment variables in `.env`

## Security

- JWT authentication via Supabase Auth
- Email whitelist support (`WHITELISTED_EMAILS`)
- Row-level security (RLS) policies in migrations
- CORS configured via `ALLOWED_ORIGINS`

## License

MIT
