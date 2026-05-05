# Paparan AI Backend - TypeScript/Node.js

TypeScript rewrite of the Paparan AI backend using NestJS framework.

## Technology Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **LLM**: LangChain.js + LangGraph
- **Job Queue**: BullMQ + Redis
- **Auth**: JWT with Supabase integration

## Project Structure

```
backend-ts/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── config/                    # Configuration
│   │   ├── llm.config.ts
│   │   ├── llm.module.ts
│   │   └── llm.factory.ts
│   ├── common/                    # Shared utilities
│   │   └── decorators/
│   ├── modules/                   # Feature modules
│   │   ├── auth/                  # Authentication
│   │   ├── paparan/               # Policy brief generation
│   │   ├── chat/                  # Chat & RAG
│   │   ├── feed/                  # Feed & Search
│   │   ├── bappenas/              # Bappenas SDI
│   │   ├── intelligence/          # OSINT Intelligence
│   │   ├── asean/                 # ASEAN Intelligence
│   │   ├── scrape/                # Web Scraping
│   │   ├── export/                # Document Export
│   │   ├── agents/                # AI Agents
│   │   └── tools/                 # Integration Tools
│   ├── database/                  # Database Layer
│   ├── jobs/                      # Background Jobs
│   └── models/                    # Data Models
├── package.json
└── tsconfig.json
```

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `ZAI_API_KEY` - Z.AI API key (or other LLM provider)
- `TAVILY_API_KEY` - Tavily search API key
- `REDIS_HOST` - Redis host for BullMQ

## Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## API Documentation

Swagger documentation is available at `http://localhost:3001/docs`

## Development Status

### Phase 1: Foundation (In Progress)
- [x] Project setup
- [x] Database layer
- [x] Authentication module
- [x] LLM provider abstraction
- [ ] Testing

### Phase 2: Core Services (Pending)
- [ ] LLM integration
- [ ] Agent base classes
- [ ] Basic tools

## API Endpoints

### Health
- `GET /health` - Health check

### Auth
- `POST /auth/verify` - Verify token
- `GET /auth/me` - Get current user

### Paparan
- `POST /api/paparan` - Generate policy brief
- `GET /api/paparan/briefs` - List user briefs
- `GET /api/paparan/briefs/:id` - Get specific brief

### Chat
- `POST /api/chat` - Send chat message
- `GET /api/chat/history/:threadId` - Get chat history

### Feed
- `GET /api/feed` - Get feed items

### Bappenas
- `POST /api/bappenas/upload` - Upload document
- `GET /api/bappenas/documents` - List documents
- `GET /api/bappenas/indicators` - Get indicators

### Intelligence
- `GET /api/intelligence/maritime/:region` - Maritime data
- `GET /api/intelligence/environment/:region` - Environmental data
- `GET /api/intelligence/conflict/:region` - Conflict data

## License

Proprietary - All Rights Reserved
