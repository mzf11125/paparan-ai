# Paparan Backend - Railway Deployment

This folder contains a self-contained backend deployment for Railway. It is a copy of the main backend (`../backend/`) configured for standalone deployment on Railway.

## Purpose

This folder allows deploying the Paparan backend to Railway without affecting the main codebase. All backend code, dependencies, and configuration are self-contained here.

## Deployment Instructions

### 1. Create a New Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize from this directory
cd railway-backend
railway init
```

Or use the Railway dashboard:
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo" or "Deploy from CLI"

### 2. Configure Environment Variables

Set the following environment variables in Railway:

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic Claude API key |
| `TAVILY_API_KEY` | Yes | Tavily search API key |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `FRONTEND_URL` | Yes | Deployed frontend URL |
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed CORS origins |
| `WHITELISTED_EMAILS` | No | Comma-separated emails for access control |

### LLM Provider Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `zai` | Primary LLM: `zai`, `anthropic`, `zhipu`, or `agentrouter` |
| `ZAI_API_KEY` | - | Z.AI GLM API key |
| `ZAI_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4/` | Z.AI base URL |
| `ZAI_MODEL` | `glm-5.1` | Z.AI model to use |
| `ZAI_ENABLE_THINKING` | `true` | Enable thinking mode |

See `.env.example` for all available options.

### 3. Deploy

```bash
# Trigger deployment
railway up

# View logs
railway logs

# Open live deployment
railway open
```

### 4. Verify Deployment

Check the health endpoint:
```bash
curl https://your-app.railway.app/health
```

Expected response:
```json
{"status": "ok"}
```

## Syncing Changes from Main Backend

To update this folder with changes from the main backend:

```bash
# Copy app folder
cp -r ../backend/app/* app/

# Copy configuration files
cp ../backend/pyproject.toml .
cp ../backend/Dockerfile .
cp ../backend/Procfile .
cp ../backend/.dockerignore .
cp ../backend/.env.example .

# Commit and deploy
git add .
git commit -m "Sync railway-backend with main backend"
git push
```

## Health Check

The service exposes a `/health` endpoint that Railway uses for health checks:

```bash
curl http://localhost:8000/health
```

## Local Testing

Build and test locally before deploying:

```bash
# Build Docker image
docker build -t paparan-backend .

# Run container
docker run -p 8000:8000 --env-file .env paparan-backend

# Test health endpoint
curl http://localhost:8000/health
```

## Dockerfile Notes

The Dockerfile is configured for Railway deployment:
- Multi-stage build for smaller image size
- Runs as non-root user for security
- Health check on `/health` endpoint
- Exposes port 8000 (configurable via `$PORT`)

## Troubleshooting

### Build Failures
- Check that all dependencies in `pyproject.toml` are available
- Verify Python version compatibility (requires Python 3.11+)

### Runtime Failures
- Verify all environment variables are set correctly
- Check Supabase and database connections
- Review Railway logs: `railway logs`

### Health Check Failures
- Ensure `/health` endpoint returns `{"status": "ok"}`
- Check that the service is listening on the correct port (default: 8000)

## Project Structure

```
railway-backend/
├── app/                    # Application code
│   ├── agents/            # LangGraph agents
│   ├── db/                # Database schemas and clients
│   ├── security/          # Security utilities
│   ├── tools/             # LangChain tools
│   ├── config.py          # Configuration
│   └── main.py            # FastAPI application
├── pyproject.toml         # Python dependencies
├── Dockerfile             # Docker build configuration
├── Procfile               # Process type for Railway
├── railway.json           # Railway configuration
└── .env.example           # Environment variables template
```
