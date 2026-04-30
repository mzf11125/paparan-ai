# Paparan AI - Backend Setup Guide

This guide will help you set up the Paparan AI backend for policy brief generation, ASEAN intelligence analysis, and Bappenas metadata extraction.

## Current Status: Partially Working

- Server runs on http://localhost:8000
- Health endpoint responds: `{"status":"ok"}`
- API docs accessible at http://localhost:8000/docs

## What You Need to Get Full Functionality

### Priority 1: Supabase Setup (REQUIRED)

The app uses Supabase for authentication and data storage.

**Steps:**

1. **Create a Supabase Account**
   - Go to https://supabase.com
   - Sign up for a free account

2. **Create a New Project**
   - Click "New Project"
   - Choose a name (e.g., "paparan-ai")
   - Set a strong database password
   - Choose a region close to you

3. **Get Your Credentials**
   - Go to Project Settings → API
   - Copy these values:
     - `SUPABASE_URL` (Project URL)
     - `SUPABASE_ANON_KEY` (anon/public key)
     - `SUPABASE_SERVICE_ROLE_KEY` (service_role key - keep secret!)

4. **Get Database Connection String**
   - Go to Project Settings → Database
   - Copy the connection string (URI format)
   - Replace `[YOUR-PASSWORD]` with your database password

5. **Run Database Migrations**
   - Go to SQL Editor in Supabase dashboard
   - Copy the entire contents of `supabase/migrations_combined.sql`
   - Paste and run the SQL

6. **Update Your `.env` File**
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres
   ```

### Priority 2: LLM Provider API Key (REQUIRED)

Choose one of the following options. The app defaults to Z.AI.

#### Option A: Z.AI (Primary - Recommended)

Z.AI provides GLM models with large context windows.

1. **Sign Up**
   - Go to https://platform.z.ai/
   - Create an account

2. **Get API Key**
   - Go to API Keys section
   - Create a new API key
   - Copy the key

3. **Update `.env`**
   ```bash
   LLM_PROVIDER=zai
   ZAI_API_KEY=your-zai-api-key
   ZAI_MODEL=glm-5.1
   ```

#### Option B: Anthropic Claude (Alternative)

1. **Sign Up**
   - Go to https://console.anthropic.com/
   - Create an account

2. **Get API Key**
   - Go to API Keys section
   - Create a new API key
   - Copy the key

3. **Update `.env`**
   ```bash
   LLM_PROVIDER=anthropic
   ANTHROPIC_API_KEY=your-anthropic-api-key
   ANTHROPIC_MODEL=claude-opus-4-5
   ```

#### Option C: AgentRouter (Claude-compatible)

1. **Sign Up**
   - Go to https://agentrouter.org/
   - Create an account

2. **Get API Key**
   - Copy your API key

3. **Update `.env`**
   ```bash
   LLM_PROVIDER=agentrouter
   AGENTROUTER_API_KEY=your-agentrouter-api-key
   AGENTROUTER_BASE_URL=https://agentrouter.org/
   ```

### Priority 3: Tavily API Key (REQUIRED for Web Search)

Tavily is used for web search and intelligence gathering.

1. **Sign Up**
   - Go to https://tavily.com/
   - Create a free account

2. **Get API Key**
   - Go to API Keys section
   - Copy your API key

3. **Update `.env`**
   ```bash
   TAVILY_API_KEY=your-tavily-api-key
   ```

## Optional Enhancements (Not Required)

These features "degrade gracefully" - the app works without them.

| Service | Purpose | How to Get |
|---------|---------|------------|
| FIRMS_MAP_KEY | NASA fire hotspot data | https://firms.modaps.eosdis.nasa.gov/api/ |
| ACLED_API_KEY | Conflict event data | https://acleddata.com/register/ |
| LANGSMITH_API_KEY | Debug/tracing LLM calls | https://smith.langchain.com/ |

To add optional services, update `.env`:
```bash
# NASA FIRMS for fire data
FIRMS_MAP_KEY=your-firms-key

# ACLED for conflict data
ACLED_API_KEY=your-acled-key
ACLED_EMAIL=your-account-email

# LangSmith for tracing
LANGSMITH_API_KEY=your-langsmith-key
LANGSMITH_TRACING=true
```

## Quick Start Checklist

After setting up the keys above, verify:

- [ ] Supabase connection works
- [ ] LLM responds (test `/api/paparan` endpoint)
- [ ] Web search works (test `/api/search`)
- [ ] Database operations work (check Supabase table viewer)

## Running the Server

### Development Mode

```bash
cd backend
source venv/bin/activate
./run.sh
```

Or manually:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Using Python Directly

```bash
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will be available at:
- Main API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## API Endpoints

### Core Paparan API
- `POST /api/paparan` - Generate policy briefs
- `GET /api/feed` - Get policy feed items
- `GET /api/search` - Semantic search across documents
- `GET /api/briefs` - List user's briefs
- `GET /api/briefs/{id}` - Get specific brief
- `POST /api/chat` - Streaming conversational AI

### Bappenas/SDI Document Processing
- `POST /api/upload` - Upload document for SDI extraction
- `GET /api/bappenas/documents` - List documents
- `GET /api/bappenas/indicators` - List extracted indicators
- `POST /api/bappenas/indicators/check-consistency` - Check consistency

### Export & Analysis
- `GET /api/briefs/{id}/export/pdf` - Export as PDF
- `GET /api/briefs/{id}/export/pptx` - Export as PowerPoint
- `POST /api/briefs/{id}/rpjmn-score` - Score against RPJMN pillars

### ASEAN Intelligence
- `POST /api/asean/simulate` - Simulate ASEAN scenarios
- `GET /api/asean/knowledge-graph` - Query knowledge graph

### Bellingcat/OSINT Intelligence
- `GET /api/intelligence/maritime/{region}` - Vessel tracking
- `GET /api/intelligence/environment/{region}` - Environmental indicators
- `GET /api/intelligence/conflict/{region}` - Conflict events

## Environment Variable Reference

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| SUPABASE_URL | Supabase project URL | https://xxx.supabase.co |
| SUPABASE_ANON_KEY | Supabase anon key | eyJhbGc... |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service key | eyJhbGc... |
| DATABASE_URL | PostgreSQL connection string | postgresql://... |

### LLM Configuration (One Required)

| Variable | Description | Default |
|----------|-------------|---------|
| LLM_PROVIDER | LLM provider (zai, anthropic, agentrouter, zhipu) | zai |
| ZAI_API_KEY | Z.AI API key | - |
| ANTHROPIC_API_KEY | Anthropic API key | - |
| AGENTROUTER_API_KEY | AgentRouter API key | - |
| ZHIPU_API_KEY | Zhipu AI API key | - |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| TAVILY_API_KEY | Tavily search API key | - |
| FIRMS_MAP_KEY | NASA FIRMS API key | - |
| ACLED_API_KEY | ACLED API key | - |
| ACLED_EMAIL | ACLED account email | - |
| LANGSMITH_API_KEY | LangSmith tracing key | - |
| ALLOWED_ORIGINS | CORS allowed origins | localhost:5173,3000 |

## Troubleshooting

### Server Won't Start

1. Check if port 8000 is already in use:
   ```bash
   lsof -i :8000
   ```

2. Try a different port:
   ```bash
   uvicorn app.main:app --port 8001
   ```

### Supabase Connection Errors

1. Verify your credentials are correct
2. Check Supabase project is active
3. Ensure database migrations have been run
4. Check Supabase logs for errors

### LLM Errors

1. Verify API key is correct
2. Check your LLM provider has available credits
3. Try switching to a different LLM provider

### Tavily Search Errors

1. Verify Tavily API key is valid
2. Check Tavily account has available searches
3. Without Tavily, web search features will be disabled

## Database Schema

The database includes:
- `users` - Extended auth.users with roles
- `paparan_reports` - Policy briefs
- `sources` - Reference data sources
- `documents` - Uploaded documents with embeddings
- `feed_items` - Cached web content with embeddings
- `bappenas_documents` - Uploaded Bappenas documents
- `sdi_indicators` - Extracted SDI indicators
- `extraction_jobs` - Async job tracking
- `consistency_flags` - Data quality issues
- And more (see migrations for full schema)

## Security Notes

1. **Never commit `.env` file** to version control
2. Keep `SUPABASE_SERVICE_ROLE_KEY` secret
3. Use environment variables for all sensitive data
4. Enable Row Level Security (RLS) in Supabase
5. Set up proper CORS origins for production

## Production Deployment

For production deployment:

1. Use a production Supabase instance
2. Set up proper CORS origins
3. Use strong secrets and rotate them regularly
4. Enable SSL/TLS for all connections
5. Set up monitoring and logging
6. Configure rate limiting
7. Use a process manager (systemd, supervisor, etc.)

## Support

For issues or questions:
- Check the API docs at http://localhost:8000/docs
- Review database migrations in `supabase/migrations_combined.sql`
- Check Supabase logs for database errors
- Review LLM provider documentation for API issues
