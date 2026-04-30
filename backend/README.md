# Paparan AI Backend

Backend API for the Paparan AI policy intelligence platform, providing ASEAN policy analysis, Bappenas SDI metadata extraction, and intelligence gathering capabilities.

## Quick Start

```bash
# Install dependencies
python -m venv venv
source venv/bin/activate
pip install -e .

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Verify setup
python verify_setup.py

# Run server
./run.sh
```

Server will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

## Setup Guide

See [SETUP.md](SETUP.md) for complete setup instructions including:
- Supabase configuration
- LLM provider setup (Z.AI, Anthropic, etc.)
- Tavily API for web search
- Optional services (FIRMS, ACLED, LangSmith)

## Features

### Core Capabilities
- **Policy Brief Generation**: Automated policy briefs with executive summaries
- **ASEAN Intelligence**: Regional analysis and scenario simulation
- **Bappenas SDI Extraction**: Extract Indonesia's SDI-compliant metadata from documents
- **Semantic Search**: Vector-based search across documents and feeds
- **Conversational AI**: Streaming chat with RAG capabilities

### Document Processing
- PDF, markdown, and text document upload
- SDI indicator extraction with KL code mapping
- Cross-K/L consistency checking
- Embedding generation for semantic search

### Intelligence Features
- Web search with tiered source prioritization
- Maritime vessel tracking
- Environmental indicators (fire, fishing, deforestation)
- Conflict event monitoring
- Knowledge graph queries

### Export Options
- PDF brief export
- PowerPoint presentation export
- Diplomatic memo format
- RPJMN alignment scoring

## API Endpoints

### Authentication
All endpoints (except `/health`) require Bearer token authentication:
```
Authorization: Bearer <your-supabase-jwt-token>
```

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/paparan` | Generate policy brief |
| GET | `/api/briefs` | List user's briefs |
| GET | `/api/briefs/{id}` | Get specific brief |
| POST | `/api/chat` | Streaming conversational AI |
| GET | `/api/search` | Semantic search |
| GET | `/api/feed` | Get policy feed |

### Document Processing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload document for SDI extraction |
| GET | `/api/bappenas/documents` | List documents |
| GET | `/api/bappenas/indicators` | List extracted indicators |
| POST | `/api/bappenas/indicators/check-consistency` | Check consistency |

### Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/briefs/{id}/export/pdf` | Export as PDF |
| GET | `/api/briefs/{id}/export/pptx` | Export as PowerPoint |
| POST | `/api/briefs/{id}/export/diplomat-pdf` | Diplomatic memo |

### Intelligence

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/intelligence/maritime/{region}` | Vessel tracking |
| GET | `/api/intelligence/environment/{region}` | Environmental indicators |
| GET | `/api/intelligence/conflict/{region}` | Conflict events |
| POST | `/api/asean/simulate` | Simulate ASEAN scenarios |

## Architecture

### Directory Structure
```
backend/
├── app/
│   ├── agents/          # LangGraph agents
│   ├── db/              # Database schemas & client
│   ├── security/        # Auth & RLS
│   ├── tools/           # LLM & external tools
│   ├── config.py        # Configuration
│   ├── llm.py           # LLM factory
│   └── main.py          # FastAPI app
├── supabase/
│   ├── migrations/      # Database migrations
│   └── migrations_combined.sql
├── .env.example         # Environment template
├── SETUP.md             # Setup guide
├── verify_setup.py      # Setup verification
└── run.sh               # Development server
```

### Agent System
- **Orchestrator**: Manages policy brief generation workflow
- **Researcher**: Web research using Tavily tools
- **Metadata Extractor**: SDI/Bappenas document processing
- **Consistency Checker**: Validates data integrity
- **ASEAN Simulator**: Policy scenario modeling
- **Synthesizer**: Multi-brief analysis
- **RPJMN Scorer**: Aligns with Indonesian development plan

### Database
- **PostgreSQL** with **pgvector** extension
- **Row Level Security (RLS)** on all tables
- **Vector embeddings** for semantic search
- **Audit logging** for security
- **Archive tables** for old data

## Configuration

### Environment Variables

Required:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:pass@host:5432/dbname
LLM_PROVIDER=zai  # or anthropic, agentrouter, zhipu
ZAI_API_KEY=your-key  # or ANTHROPIC_API_KEY, etc.
TAVILY_API_KEY=your-tavily-key
```

Optional:
```bash
FIRMS_MAP_KEY=          # NASA fire data
ACLED_API_KEY=          # Conflict data
LANGSMITH_API_KEY=      # LLM tracing
ALLOWED_ORIGINS=        # CORS allowed origins
```

### LLM Providers

| Provider | Models | Context | Notes |
|----------|--------|---------|-------|
| Z.AI | glm-5.1, glm-5, glm-4.7 | Up to 131K | Default |
| Anthropic | claude-opus-4-5, claude-sonnet-4-5 | Up to 200K | High quality |
| AgentRouter | claude-* | Varies | Claude-compatible |
| Zhipu AI | glm-* | Up to 131K | JWT auth |

## Development

### Running Tests
```bash
pytest tests/
```

### Database Migrations
```bash
# In Supabase SQL Editor, run:
cat supabase/migrations_combined.sql
```

### Adding New Endpoints
1. Define route in `app/main.py`
2. Add Pydantic models in `app/db/schema.py`
3. Implement logic in `app/agents/` or `app/tools/`

## Deployment

### Production Considerations
- Use production Supabase instance
- Set proper CORS origins
- Enable SSL/TLS
- Use process manager (systemd, supervisor)
- Configure rate limiting
- Monitor database size
- Archive old data regularly

### Environment
```bash
# Production .env should have:
ALLOWED_ORIGINS=https://your-domain.com
LANGSMITH_TRACING=true  # For debugging
```

## Troubleshooting

### Server Won't Start
- Check port 8000 availability
- Verify dependencies installed
- Run `python verify_setup.py`

### Database Errors
- Verify Supabase credentials
- Run migrations
- Check Supabase logs

### LLM Errors
- Verify API key valid
- Check provider has credits
- Try different provider

## License

Proprietary - All rights reserved

## Support

For detailed setup instructions, see [SETUP.md](SETUP.md)
