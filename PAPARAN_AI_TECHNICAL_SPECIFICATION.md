# Paparan AI / PaparanBrief - Comprehensive Technical Specification

---

## Executive Summary

**Paparan AI** is an AI-powered **Policy Intelligence System** designed specifically for ASEAN policymakers. It transforms fragmented information from multiple sources into structured, decision-ready policy briefs with actionable recommendations.

> "Paparan is not an AI summarizer. It is a decision intelligence system."

---

## Table of Contents

1. [What is Paparan AI?](#what-is-paparan-ai)
2. [The Brief System](#the-brief-system)
3. [Multi-Agent Architecture](#multi-agent-architecture)
4. [OSINT Integration](#osint-integration)
5. [Policy Framework Alignment](#policy-framework-alignment)
6. [Technical Architecture](#technical-architecture)
7. [Design System](#design-system)
8. [Export Formats](#export-formats)
9. [Key Differentiators](#key-differentiators)
10. [Business Context](#business-context)
11. [Competitive Landscape](#competitive-landscape)
12. [User Workflows](#user-workflows)
13. [Complete Data Models & Schemas](#complete-data-models--schemas)
14. [Complete Component Inventory](#complete-component-inventory)
15. [Complete API Endpoints](#complete-api-endpoints)
16. [All Backend Agents](#all-backend-agents)
17. [Complete Styling System](#complete-styling-system)
18. [Environment Configuration](#environment-configuration)
19. [Deployment Configuration](#deployment-configuration)
20. [State Management](#state-management)
21. [Monitoring & Observability](#monitoring--observability)

---

## What is Paparan AI?

### Core Value Proposition
- **Reduces cognitive load**: Condenses 2-4 hours of reading into minutes of actionable intelligence
- **Structured output**: Provides consistent, institutional-grade briefs (not generic AI summaries)
- **Temporal awareness**: Tracks changes over time ("What changed since last briefing?")
- **Decision support**: Not just information, but recommendations for action

### Target Users

| User Type | Role | Use Case |
|-----------|------|----------|
| **Senior Diplomat** | Ministry of Foreign Affairs | Prepare briefs before meetings |
| **Policy Analyst** | Bappenas (Indonesian National Development Planning) | Synthesize multi-source data |
| **Investment Officer** | BKPM (Investment Coordinating Board) | Corporate due diligence |
| **Trade Analyst** | ASEAN institutions | Regional trade intelligence |

---

## The Brief System

### What is a "Policy Brief"?

A structured document following a strict 7-section schema:

```typescript
PolicyBrief {
  // Metadata
  id: string
  title: string
  date: string
  region: string
  classification: "unclassified" | "official" | "confidential" | "secret"

  // Core Content (7 Sections)
  executiveSummary: string[]      // 5 high-signal bullet points
  currentSituation: string         // What's happening now
  developments: Development[]      // Delta-aware developments
  implications: string             // Strategic implications
  risks: Risk[]                    // Classified risks
  opportunities: Opportunity[]     // Identified opportunities
  actions: Action[]                // Recommended actions

  // Intelligence Metadata
  sources: Source[]                // Traceable citations
  tags: string[]

  // Policy Alignment
  rpjmn_alignment: dict            // Indonesia RPJMN scoring
  rdtii_evidence: list             // ASEAN Digital Trade mapping

  // OSINT Enrichments
  spatial_context: dict            // Geographic data
  environmental_indicators: dict   // Environmental data
  conflict_context: dict           // Conflict event data
  archived_sources: list           // Wayback Machine archives
}
```

### Development Types (Delta Detection)

| Type | Meaning |
|------|---------|
| **NEW** | Newly emerged information |
| **UPDATED** | Previous information updated |
| **ESCALATED** | Situation has intensified |
| **DE-ESCALATED** | Situation has improved |

---

## Multi-Agent Architecture

### Agent Pipeline (LangGraph)

```
User Input → Route Request → Specialized Agents → Synthesis → Output
                ↓
    ┌───────────┴───────────┐
    │                       │
    Bappenas Route          Default/Financial Route
    (SDI Metadata)          (Policy Analysis)
```

### Specialized Agents

| Agent | Purpose |
|-------|---------|
| **Route Request** | Determines path based on topic analysis |
| **Gov Intel Agent** | Collects government intelligence |
| **Analyst Agent** | Analyzes financial/corporate data |
| **Researcher Agent** | Cache-first RAG + web search |
| **RPJMN Scorer** | Scores against Indonesia's 8 national development pillars |
| **RDTII Extractor** | Maps to ASEAN Digital Trade 7 pillars |
| **OSINT Enrichment** | Adds spatial, environmental, conflict context |
| **Synthesizer** | Cross-brief synthesis |
| **Consistency Checker** | Validates cross-brief contradictions |

---

## OSINT Integration (Bellingcat Tools)

| Domain | Tool | Data |
|--------|------|------|
| **Spatial** | Nominatim, Sentinel Hub | Geocoding, satellite imagery |
| **Maritime** | VesselFinder | AIS tracking, strait traffic |
| **Corporate** | OpenCorporates | ASEAN subsidiary lookup |
| **Environmental** | Global Forest Watch, NASA FIRMS | Deforestation, fire data |
| **Conflict** | ACLED | Conflict events, stability index |
| **Archive** | Wayback Machine | Auto-archiving to prevent link rot |

---

## Policy Framework Alignment

### RPJMN (Indonesia's National Medium-Term Development Plan)
- Scores against **8 national development pillars** (Asta Cita)
- Extracts **SDI indicators** per Satu Data Indonesia standards
- Provides pillar-level alignment visualization

### RDTII (ASEAN Digital Trade Integration Initiative)
- Maps to **7 Digital Trade pillars**
- Extracts regulatory evidence
- Supports ASEAN trade policy analysis

---

## Technical Architecture

### Frontend

| Component | Technology |
|-----------|------------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 3.4 (custom government theme) |
| State Management | Zustand + React Query |
| Routing | React Router 7 |
| UI Components | Custom library (shadcn/ui inspired) |
| Forms | React Hook Form + Zod |

### Backend

| Component | Technology |
|-----------|------------|
| Framework | FastAPI (Python) / Hono (TypeScript) |
| AI Orchestration | LangGraph multi-agent workflows |
| Database | Supabase (PostgreSQL + pgvector) |
| Authentication | Supabase Auth (magic links) |
| LLM | Anthropic Claude |

### Key Pages

- Landing Page (`/`)
- Brief Editor (`/brief/new`, `/brief/edit/:id`)
- Briefs Library (`/briefs`)
- Brief Detail (`/brief/:id`)
- ASEAN Dashboard (`/asean`)
- Analytics Dashboard (`/analytics`)
- News Feed (`/feed`)
- Watchlist (`/watchlist`)
- Chat (`/chat`)

---

## Design System

### Brand Identity
- **Government-grade aesthetic** - Institutional, professional, authoritative
- **Not startup-like** - Avoids generic tech company patterns

### Visual Elements

| Element | Specification |
|---------|---------------|
| **Primary Color** | Navy blue (#1D4ED8) |
| **Typography** | Libre Baskerville (headings), Source Serif 4 (body), DM Sans (UI) |
| **Classification Badges** | Green (unclassified), Amber (confidential), Red (secret) |
| **Document Style** | Paper cards, subtle shadows, official watermarks |

---

## Export Formats

### 1. PDF Memo
- Official brief format
- Diagonal watermark based on classification
- Government document styling

### 2. PowerPoint Deck
- 5-slide executive summary
- Talking points included
- Diplomat-ready format

### 3. Diplomat Brief
- Formal memo structure
- Distribution list
- Classification handling
- Action items highlighted

---

## Key Differentiators

| Feature | Paparan AI | Competitors |
|---------|------------|-------------|
| **Delta Detection** | ✅ NEW/UPDATED/ESCALATED tracking | ❌ None |
| **7-Section Format** | ✅ Institutional schema | ❌ Generic summaries |
| **ASEAN Specialized** | ✅ Built for the region | ❌ General purpose |
| **Source Traceability** | ✅ Every insight linked | ⚠️ Variable |
| **Policy Alignment** | ✅ RPJMN + RDTII scoring | ❌ None |
| **Decision Support** | ✅ Actionable recommendations | ⚠️ Limited |

---

## Business Context

### Industry Domain
- **Government/Policy Intelligence Sector**
- **ASEAN geopolitical focus**
- **National policy analysis** (Indonesia RPJMN)
- **Trade and investment intelligence**

### Current Stage
- **Pre-commercial** (MIS Grant-funded development)
- **Monthly operational costs**: ~3-7 million IDR
- **Development funding**: Rp 10,000,000 MIS Grant (4-month cycle)

### Planned Monetization
- **Freemium Model** - Free daily Paparan (limited), paid on-demand
- **Institutional Licenses** - Per-seat pricing for ministries
- **API Access** - Third-party integration

### Strategic Partnerships
- **Bappenas** - Indonesian national development planning
- **BKPM** - Investment coordination
- **Bellingcat** - OSINT tools integration
- **i.AI UK** - Guidance and standards
- **AWS** - Infrastructure support

---

## Competitive Landscape

### Direct Competitors
**None** - No direct competitor owns the policy intelligence space for ASEAN

### Indirect Competitors

| Tool | Strength | Paparan's Advantage |
|------|----------|---------------------|
| **Perplexity AI** | Fast web search + citations | Structure, delta detection, ASEAN specialization |
| **ChatGPT (Deep Research)** | Flexible reasoning | Institutional format, consistency |
| **Google Gemini** | Large context window | Policy specialization, temporal awareness |
| **NotebookLM** | Document analysis | Web retrieval, policy schema |
| **Genspark** | Multi-source briefs | Decision recommendations, policy alignment |

### Market Positioning
- Creates new category: **Policy Intelligence System**
- Vision: "Bloomberg Terminal for ASEAN diplomacy and trade"

---

## User Workflows

### Creating a Brief
1. Enter topic and region
2. System routes through appropriate agents
3. Collects intelligence from multiple sources
4. Generates structured brief
5. Enriches with OSINT data
6. Scores against policy frameworks
7. User reviews, edits, and exports

### Managing Briefs
- Library view with filtering
- Detail view with full brief
- Version history tracking
- Export to PDF/PPTX/Diplomat format
- Share functionality

---

## Complete Data Models & Schemas

### Core TypeScript Types

```typescript
// Enums
type Impact = "HIGH" | "MEDIUM" | "LOW";
type Delta = "NEW" | "UPDATED" | "ESCALATED" | "DE-ESCALATED";
type Confidence = "HIGH" | "MEDIUM" | "LOW";
type ClassificationLevel = "unclassified" | "official" | "confidential" | "secret";

// Development (Delta-aware item)
interface Development {
  id: string;
  text: string;
  impact: Impact;           // HIGH/MEDIUM/LOW
  delta: Delta;             // NEW/UPDATED/ESCALATED/DE-ESCALATED
  sourceId: string;
  date?: string;
  entities?: string[];      // Extracted entities
}

// Source Reference
interface Source {
  id: string;
  title: string;
  url?: string;
  confidence: Confidence;
  date: string;
}

// Action Item
interface Action {
  priority: Impact;
  text: string;
  owner?: string;
  deadline?: string;
}

// RDTII Evidence (ASEAN Digital Trade)
interface RdtiiEvidence {
  id: string;
  brief_id: string;
  source_url: string;
  clause_text: string;
  pillar_id: string;        // P1–P7
  indicator_code: string;   // e.g. "6.1"
  country: string;
  confidence: Confidence;
  extracted_at: string;
}

// Complete Policy Brief
interface Paparan {
  id: string;
  title: string;
  date: string;
  region: string;
  lastUpdated?: string;
  classification?: ClassificationLevel;

  // 7-Section Content
  executiveSummary: string[];      // 5 bullet points
  currentSituation: string;
  developments: Development[];
  implications: string;
  risks: string[];
  opportunities: string[];
  actions: Action[];
  sources: Source[];
  tags?: string[];

  // Intelligence Enhancements
  rpjmn_alignment?: Record<string, Record<string, number>> | null;
  urgency_score?: number | null;
  source_count?: number;
  confidence_score?: string;
  diplomat_meta?: Record<string, unknown> | null;
  previous_report_id?: string | null;

  // OSINT Enrichments
  spatial_context?: Record<string, unknown>;
  archived_sources?: Array<{url: string, archive_url: string}>;
  environmental_indicators?: Record<string, unknown>;
  conflict_context?: Record<string, unknown>;
  rdtii_evidence?: RdtiiEvidence[];
}
```

### Database Schema (Supabase/PostgreSQL)

```sql
-- Main Tables
users (id, email, full_name, role, tracked_topics, created_at)
paparan_reports (id, user_id, topic, region, report_type, content JSONB, delta_summary JSONB, previous_report_id, created_at)
sources (id, paparan_id, url, title, source_type, confidence, retrieved_at)
documents (id, user_id, file_path, file_name, parsed_text, metadata JSONB, embedding vector(1536), uploaded_at)
developments (id, paparan_id, description, delta_type, impact_level, entities JSONB, source_id)

-- Vector Search
- pgvector extension enabled
- Embeddings stored as vector(1536)
- ivfflat indexing for cosine similarity
```

### SDI Metadata Schema (Indonesian Government Standards)

```python
class SDIIndicatorMetadata:
    # Identitas (Identity)
    indicator_id: str
    indicator_name: str
    indicator_name_en: str

    # Definisi (Definition)
    definition: str
    methodology: str

    # Produsen Data (Data Producer)
    producing_institution: str
    kl_code: str  # Kementerian/Lembaga code

    # Spasio Waktu (Spatial & Temporal)
    spatial_coverage: str
    temporal_coverage: str
    temporal_resolution: TemporalResolution  # annual, quarterly, monthly

    # Unit (Measurement)
    unit: str
    unit_type: UnitType  # nominal, ordinal, ratio

    # Ketersediaan (Availability)
    availability_status: AvailabilityStatus
    last_updated: Optional[datetime]

    # Additional
    sector: str
    sub_sector: str
    sdi_goal_code: str  # Satu Data Indonesia
    sdg_code: str       # UN Sustainable Development Goals
```

---

## Complete Component Inventory

### UI Components (`src/components/ui/`)

| Component | Purpose |
|-----------|---------|
| `Button.tsx` | Base button with variants (primary, secondary, ghost, danger) |
| `Card.tsx` | Paper-card container with elevation |
| `ClassificationBadge.tsx` | 4-level classification badges (banner, inline, compact) |
| `DeltaBadge.tsx` | NEW/UPDATED/ESCALATED/DE-ESCALATED badges |
| `DocumentFrame.tsx` | Government-style document border with watermark |
| `Chart.tsx` | Chart wrapper with loading states |
| `Input.tsx`, `Textarea.tsx` | Form inputs |
| `Select.tsx`, `MultiSelect.tsx` | Dropdown selectors |
| `DatePicker.tsx` | Date selection |
| `Modal.tsx` | Dialog/overlay |
| `CommandPalette.tsx` | Global search (cmd+k) |
| `Skeleton.tsx` | Loading placeholders |
| `Toast.tsx` | Notification system |
| `Tooltip.tsx` | Hover tooltips |
| `Tabs.tsx` | Tab navigation |
| `Pagination.tsx` | List pagination |
| `Spinner.tsx` | Loading indicator |

### Layout Components (`src/components/Layout/`)

| Component | Purpose |
|-----------|---------|
| `AppShell.tsx` | Main layout wrapper with sidebar |
| `Sidebar.tsx` | Navigation sidebar |
| `SidebarItem.tsx` | Sidebar menu items |
| `TopBar.tsx` | Top navigation bar |
| `MobileNav.tsx` | Mobile navigation drawer |

### Page Components (`src/pages/`)

| Page | Route | Purpose |
|------|-------|---------|
| `LandingPage.tsx` | `/` | Public landing page |
| `PaparanBriefPage.tsx` | `/brief/new` | Create new brief |
| `BriefsLibraryPage.tsx` | `/briefs` | List all briefs |
| `BriefDetailPage.tsx` | `/brief/:id` | View single brief |
| `BriefEditorPage.tsx` | `/brief/edit/:id` | Edit existing brief |
| `AnalyticsDashboardPage.tsx` | `/analytics` | Data visualization |
| `AseanDashboardPage.tsx` | `/asean` | ASEAN regional view |
| `NewsFeedPage.tsx` | `/feed` | Daily intelligence feed |
| `WatchlistPage.tsx` | `/watchlist` | Saved briefs |
| `ChatPage.tsx` | `/chat` | Conversational RAG |
| `SettingsPage.tsx` | `/settings` | User preferences |
| `LoginPage.tsx` | `/login` | Authentication |
| `AuthCallbackPage.tsx` | `/auth/callback` | Magic link handler |

### Services (`src/services/`)

| Service | Purpose |
|---------|---------|
| `api.ts` | Central API client with auth |
| `briefService.ts` | Brief CRUD operations |
| `feedService.ts` | News feed management |
| `exportService.ts` | PDF/PPTX generation |

---

## Complete API Endpoints

### Core Paparan API

```
POST /api/paparan
Request: { topic, region, classification?, user_id }
Response: PolicyBrief

GET /api/feed?region=&limit=&offset=
Response: FeedItem[]

GET /api/search?q=&region=&limit=
Response: Semantic search results

GET /api/briefs
Response: Paparan[] (user's briefs)

GET /api/briefs/{id}
Response: Single Paparan

DELETE /api/briefs/{id}
Response: { success: true }

POST /api/chat
Request: { message, thread_id?, user_id }
Response: SSE stream
```

### Bappenas Metadata API

```
POST /api/upload
Request: multipart/form-data (file + metadata)
Response: { status, document_id, job_id }

GET /api/bappenas/documents?status=&limit=&offset=
Response: Document[]

GET /api/bappenas/indicators?document_id=&kl_code=&sector=
Response: SDIIndicatorMetadata[]

POST /api/bappenas/indicators/check-consistency
Request: { indicator_ids[], check_type }
Response: ConsistencyFlag[]

PUT /api/bappenas/consistency-flags/{id}/resolve
Request: { resolution_notes }
Response: Updated flag
```

### Export API

```
GET /api/briefs/{id}/export/pdf
Response: PDF file stream

GET /api/briefs/{id}/export/pptx
Response: PowerPoint file stream

POST /api/briefs/{id}/export/diplomat-pdf
Request: { to, from_name, ref?, distribution[] }
Response: Diplomat PDF

POST /api/briefs/{id}/talking-points
Response: { brief_id, talking_points[] }

POST /api/briefs/synthesize
Request: { brief_ids[] }
Response: Cross-brief synthesis
```

---

## All Backend Agents (Python)

| Agent | File | Purpose |
|-------|------|---------|
| Orchestrator | `orchestrator.py` | LangGraph StateGraph coordinator |
| Gov Intel | `gov_intel.py` | ASEAN government intelligence |
| Analyst | `analyst.py` | Financial/corporate analysis |
| Researcher | `researcher.py` | Cache-first RAG + web search |
| RPJMN Scorer | `rpjmn_scorer.py` | Indonesia policy alignment |
| RDTII Extractor | `rdtii_extractor.py` | ASEAN digital trade mapping |
| Metadata Extractor | `metadata_extractor.py` | SDI-compliant extraction |
| Consistency Checker | `consistency_checker.py` | Cross-brief validation |
| Scraper | `scraper.py` | Web content collection |
| Conversational | `conversational.py` | Chat with SSE streaming |
| Synthesizer | `synthesizer.py` | Multi-brief synthesis |
| ASEAN Simulator | `asean_simulator.py` | Regional scenario modeling |

### Agent Workflow (LangGraph State Machine)

```
User Request
     ↓
route_request (keyword analysis)
     ↓
┌────────┴────────┐
│                 │
Bappenas     Financial      Default
(SDI)        (OJK/BI)      (Gov Intel)
│                 │              │
└─────────────────┴──────────────┘
                    ↓
              run_researcher
              (RAG + Tavily)
                    ↓
              score_rpjmn
              (if Indonesia/ASEAN)
                    ↓
              extract_rdtii
              (if digital trade)
                    ↓
              enrich_osint
              (spatial, maritime, etc.)
                    ↓
              save_brief
                    ↓
              Return PolicyBrief
```

---

## Complete Styling System

### CSS Variables (Custom Properties)

```css
/* Fonts */
--font-display: 'Libre Baskerville', serif;
--font-body: 'Source Serif 4', serif;
--font-ui: 'DM Sans', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Colors - Light Mode */
--color-bg: #f8f9fa;
--color-bg-elevated: #ffffff;
--color-bg-surface: #f1f3f5;
--color-text: #111827;
--color-text-secondary: #4b5563;
--color-primary: #1d4ed8; /* Navy blue */

/* Colors - Dark Mode (.dark class) */
--color-bg: #0A0B0D;
--color-bg-elevated: #111318;
--color-bg-surface: #181B22;
--color-text: #F1F5F9;
--color-text-secondary: #94A3B8;

/* Classification Colors */
--color-classified-unclassified: #16a34a; /* Green */
--color-classified-official: #1d4ed8;     /* Navy */
--color-classified-confidential: #d97706;  /* Amber */
--color-classified-secret: #dc2626;        /* Red */

/* Spacing (8px base unit) */
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */
--space-3xl: 4rem;     /* 64px */
--space-4xl: 6rem;     /* 96px */

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 24px;

/* Shadows */
--shadow-sm: 0 1px 3px rgba(45, 45, 45, 0.06);
--shadow-md: 0 4px 12px rgba(45, 45, 45, 0.08);
--shadow-lg: 0 8px 24px rgba(45, 45, 45, 0.10);

/* Spring Transitions */
--spring-gentle: cubic-bezier(0.25, 0.1, 0.25, 1);
--spring-default: cubic-bezier(0.16, 1, 0.3, 1);
--spring-bouncy: cubic-bezier(0.34, 1.56, 0.64, 1);
--spring-snappy: cubic-bezier(0.12, 0.95, 0.28, 1);
```

### Typography Scale

| Class | Size | Line Height | Letter Spacing | Font |
|-------|------|-------------|----------------|------|
| `display-2xl` | 8rem | 0.9 | -0.04em | Display |
| `display-xl` | 6rem | 0.95 | -0.03em | Display |
| `display-lg` | 4.5rem | 1 | -0.025em | Display |
| `display-md` | 3.75rem | 1 | -0.02em | Display |
| `h1` | 3rem | 1.2 | -0.02em | Display |
| `h2` | 2.25rem | 1.3 | -0.015em | Display |
| `h3` | 1.75rem | 1.4 | -0.01em | Display |
| `h4` | 1.5rem | 1.5 | -0.005em | Body |
| `body-lg` | 1.125rem | 1.6 | 0 | Body |
| `body` | 1rem | 1.6 | 0 | Body |
| `body-sm` | 0.875rem | 1.6 | 0.005em | UI |
| `caption` | 0.75rem | 1.5 | 0.01em | UI |

### Animation Library

```typescript
// src/animations/animations.ts

// Fade animations
fadeIn, fadeOut, fadeInUp, fadeInDown, fadeInLeft, fadeInRight

// Scale animations
scaleIn, scaleOut, scaleUp

// Slide animations
slideInUp, slideInDown, slideInLeft, slideInRight

// Complex animations
reveal, textReveal, borderReveal

// Loading states
shimmer, pulse, pulseSubtle

// Attention
bounce, spin, glow, float
```

---

## Environment Configuration

### Required Environment Variables

```bash
# === FRONTEND (.env) ===
VITE_API_URL=http://localhost:8000
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# === BACKEND PYTHON (.env) ===
# Core Services
ANTHROPIC_API_KEY=
TAVILY_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
FRONTEND_URL=http://localhost:5173

# LLM Provider Configuration
LLM_PROVIDER=zai  # Options: zai, anthropic, zhipu, agentrouter
ZAI_API_KEY=
ZAI_BASE_URL=https://open.bigmodel.cn/api/paas/v4/
ZAI_MODEL=glm-5.1
ZAI_MAX_TOKENS=131072

# Optional - Bellingcat OSINT
FIRMS_MAP_KEY=     # NASA FIRMS fire hotspots
ACLED_API_KEY=     # Conflict events
ACLED_EMAIL=       # ACLED account

# Optional - LangSmith Tracing
LANGSMITH_API_KEY=
LANGSMITH_TRACING=false
```

---

## Deployment Configuration

### Railway Deployment

```json
// railway.json (Python backend)
{
  "build": {
    "dockerfilePath": "backend/Dockerfile"
  },
  "deploy": {
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "on-failure",
    "restartPolicyMaxRetries": 10
  }
}
```

```toml
# nixpacks.toml (TypeScript backend)
[phases.setup]
nixPkgs = ["nodejs_20"]
```

### Docker Multi-Stage Build (Python)

```dockerfile
# Builder stage
FROM python:3.11-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
EXPOSE 8000
HEALTHCHECK --interval=30s CMD curl -f http://localhost:8000/health
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## State Management (Zustand Store)

```typescript
interface AppStore {
  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<Result>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;

  // Briefs Data
  briefs: Paparan[];
  setBriefs: (briefs: Paparan[]) => void;
  addBrief: (brief: Paparan) => void;
  updateBrief: (id: string, updates: Partial<Paparan>) => void;
  deleteBrief: (id: string) => void;

  // Watchlist/Bookmarks
  watchlist: string[];
  addToWatchlist: (id: string) => void;
  removeFromWatchlist: (id: string) => void;
  toggleWatchlist: (id: string) => void;

  // Saved Searches
  savedSearches: SavedSearch[];
  addSavedSearch: (name: string, filters: BriefFilters) => void;
  deleteSavedSearch: (id: string) => void;

  // UI State
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  viewMode: 'grid' | 'list';
  commandPaletteOpen: boolean;

  // Filters
  filters: BriefFilters;
  setFilters: (filters: Partial<BriefFilters>) => void;
  clearFilters: () => void;
}
```

---

## Monitoring & Observability

### Database-Level Monitoring (PostgreSQL)

The system implements comprehensive monitoring via database schemas:

```sql
-- Query Performance Tracking
query_log (query, execution_time_ms, row_count, cache_hits, timestamp)

-- Error Logging
error_log (error_type, severity, message, stack_trace, resolved)

-- System Metrics
metrics (metric_name, metric_type, value, status, source, timestamp)

-- Audit Trails
audit_log (table_name, operation, user_id, changes, ip_address, user_agent)
```

### Monitoring Views

- `vw_slow_queries` - Queries >1000ms
- `vw_error_summary` - Error counts by type
- `vw_health_status` - Current system health
- `vw_daily_performance` - Daily performance metrics
- `vw_user_activity` - User action summaries

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **UI Components** | 25+ |
| **Pages** | 13 |
| **Backend Agents** | 12 |
| **API Endpoints** | 30+ |
| **Database Tables** | 6 main + monitoring |
| **CSS Variables** | 50+ |
| **Animation Keyframes** | 40+ |
| **Font Families** | 4 |
| **OSINT Integrations** | 6 |
| **Policy Frameworks** | 2 (RPJMN + RDTII) |
| **Export Formats** | 3 |
| **Classification Levels** | 4 |

---

## Conclusion

**Paparan AI** is a specialized policy intelligence system that:

1. Converts fragmented information into structured briefs
2. Tracks temporal changes (what's NEW/UPDATED/ESCALATED)
3. Aligns with Indonesia's RPJMN and ASEAN's RDTII frameworks
4. Provides actionable recommendations, not just summaries
5. Uses government-grade security and formatting
6. Serves ASEAN policymakers, diplomats, and analysts

The product fills a critical gap in government decision-making infrastructure by transforming how policymakers consume and act on intelligence in an increasingly complex geopolitical landscape.

---

*Document Version: 1.0*
*Last Updated: 2025*
*Classification: Unclassified*
