# Paparan.ai — Product Requirements Document

**Version:** 1.0
**Author:** Zidan
**Date:** April 2026
**Status:** Pre-Development / MIS Grant Submission

---

## 1. Product Overview

### 1.1 What Is Paparan?

Paparan is an AI-powered policy intelligence system that transforms fragmented, multi-source information into structured, decision-ready briefs for policymakers. It operates in two modes:

- **On-demand Paparan:** User uploads documents or inputs a topic, and the system generates a structured policy brief.
- **Daily Paparan Feed:** The system automatically generates a daily intelligence briefing based on tracked topics and regions.

### 1.2 Vision

Become the default intelligence infrastructure for policymakers and trade strategists in ASEAN, replacing fragmented manual workflows with structured, temporally-aware, decision-grade outputs.

### 1.3 Mission

Reduce the cognitive load and time required for policymakers to understand complex developments and take informed action.

### 1.4 Core Concept

"Paparan" (Indonesian: briefing/presentation) is both the product name and the output format. Every Paparan output follows a strict, institutional-grade structure that is:

- **Structured** — fixed schema, not freestyle prose
- **Comparable** — outputs across time follow the same format
- **Traceable** — every insight links back to a source
- **Actionable** — includes decision recommendations, not just information

### 1.5 Positioning

Paparan is **not** an AI summarizer. It is a **decision intelligence system** for policy and trade.

| What Paparan is | What Paparan is not |
|---|---|
| Structured policy brief generator | Generic AI writing tool |
| Delta-aware intelligence system | ChatGPT/Perplexity wrapper |
| Decision support for policymakers | Dashboard or analytics product |
| ASEAN-specialized intelligence layer | General-purpose research tool |

---

## 2. Problem Statement

### 2.1 Core Pain Points

Policymakers (diplomats, trade analysts, government officers) face four compounding problems:

**1. Information Overload**
Dozens of reports, PDFs, cables, and news articles arrive daily. Reading and synthesizing them manually takes hours and often results in missed signals.

**2. Lack of Structure**
Reports come in inconsistent formats from different sources. There is no standardized way to compare insights across documents or time periods.

**3. No Temporal Awareness (Delta Problem)**
The most critical question for a policymaker is: "What changed since my last briefing?" No existing tool answers this reliably across policy domains.

**4. No Decision Support**
Existing tools provide information. Policymakers need recommendations: what to do, what to watch, what to escalate.

### 2.2 Current Workarounds

| Method | Limitation |
|---|---|
| Manual reading | Hours per day, easy to miss signals |
| Personal summaries | Inconsistent, not comparable over time |
| ChatGPT/Perplexity | Unstructured, no delta, no institutional format |
| NotebookLM | Document-level only, no policy schema |

### 2.3 Validation Signal

Direct user research with a working diplomat confirmed two primary complaints:
1. "Too many reports"
2. "Information is often outdated by the time I read it"

These map directly to information overload and temporal decay.

---

## 3. Solution

### 3.1 Product Description

Paparan converts fragmented information into structured, decision-ready policy briefs through a pipeline of controlled retrieval, structured extraction, temporal comparison, and policy-oriented reasoning.

### 3.2 How It Works (High Level)

```
User Input / Scheduled Trigger
         |
    Query Planner
         |
    Retrieval (Tavily API)
         |
    Source Ranking (Paparan logic)
         |
    Claude LLM:
       - extraction
       - structuring
       - reasoning
         |
    Delta Engine (Paparan logic)
         |
    Final Paparan Output
```

### 3.3 Output Format (The "Paparan")

Every output follows this strict schema:

1. **Executive Summary** — 5 bullets maximum, high-signal only
2. **Current Situation** — what is happening now, based on latest inputs
3. **Key Developments (Delta)** — what changed recently, labeled by impact level (HIGH / MEDIUM / LOW) and type (NEW / UPDATED / ESCALATED / DE-ESCALATED)
4. **Strategic Implications** — why the developments matter for trade, diplomacy, and risk exposure
5. **Risks and Opportunities** — classified by severity
6. **Recommended Actions** — concrete next steps (e.g., "Engage Ministry X," "Delay negotiation," "Monitor policy Y")
7. **Sources** — linked back to original documents or URLs for traceability

This format is modeled after real diplomatic intelligence briefs used in government workflow, not generic AI outputs.

---

## 4. Target Users

### 4.1 Primary

| User | Need |
|---|---|
| Diplomats | Pre-meeting briefs, situational awareness |
| Policy analysts | Structured synthesis of multi-source data |
| Government officers | Decision support, reporting to superiors |

### 4.2 Secondary

| User | Need |
|---|---|
| Trade agencies | Export/import intelligence |
| Think tanks | Structured research outputs |
| Academic researchers | Policy trend analysis |

### 4.3 User Persona (Primary)

**Name:** Senior Diplomat, Ministry of Foreign Affairs
**Daily workflow:**
- Receives 10-20 reports, cables, news updates
- Must prepare briefs before meetings
- Reports upward to leadership
- Needs to know: "What changed? What matters? What should we do?"

**Key frustration:** Spends 2-3 hours daily just reading and synthesizing. Wants that reduced to 15-30 minutes with higher confidence.

---

## 5. Core Features (V1)

### 5.1 Paparan Generator (Core Feature)

**Input options:**
- Upload documents (PDF, DOCX)
- Text/topic input (e.g., "Indonesia-Vietnam Trade Relations")
- Combination of both

**Output:**
Structured Paparan following the 7-section schema defined in Section 3.3.

**Key behaviors:**
- Claude analyzes uploaded documents and retrieved web sources together
- Output is constrained to the fixed schema (no freestyle)
- Each insight is tagged with source reference
- Quantified data (numbers, dates, percentages) is prioritized over generic statements

### 5.2 Daily Paparan Feed

**Description:**
Automated daily intelligence briefing generated each morning based on the user's tracked topics and regions.

**Example:**
> Paparan — ASEAN Trade | 17 April 2026

**Includes:**
- Top 3-5 developments from the past 24 hours
- Delta labels (NEW, UPDATED, ESCALATED)
- Brief implications for each
- Links to sources

**Value proposition:**
Replaces the need to scan 10+ news sources and reports every morning. Builds a daily usage habit.

**Technical approach:**
- Scheduled trigger (cron job or Supabase Edge Function)
- Tavily retrieval based on user's topic subscriptions
- Claude generates structured daily brief
- Stored and accessible in user's Paparan archive

### 5.3 Delta Detection Engine (Primary Differentiator)

**What it does:**
Compares current Paparan against the most recent previous Paparan on the same topic.

**Output labels:**
- **NEW** — first appearance of this development
- **UPDATED** — existing development with new information
- **ESCALATED** — situation has intensified
- **DE-ESCALATED** — situation has cooled down
- **REMOVED** — previously tracked signal no longer appears

**How it works:**
1. Retrieve previous Paparan from database (same topic)
2. Pass both current data and previous structured output to Claude
3. Claude performs semantic comparison and classifies changes
4. Output includes explicit delta annotations

**Why this matters:**
No existing consumer AI tool (Perplexity, ChatGPT, NotebookLM, Gemini) provides temporal comparison across structured policy outputs. This is Paparan's strongest moat.

### 5.4 Source Traceability

Every insight in a Paparan links back to its source:
- For uploaded documents: section reference
- For web sources: URL and retrieval date
- Confidence indicator: HIGH / MEDIUM / LOW

This is non-negotiable for government users who must verify claims before including them in official communications.

### 5.5 Paparan Archive

- Chronological list of all generated Paparan
- Searchable by topic, date, region
- Side-by-side comparison view (V2)

---

## 6. Non-Goals (V1)

The following are explicitly out of scope for V1 to maintain focus:

- Interactive dashboards or data visualizations
- World map / geospatial views
- Collaboration features (shared workspaces, comments)
- Real-time streaming or live monitoring
- Complex entity relationship graphs
- Multi-language output (Indonesian first, English later)

These are part of the long-term roadmap (see Section 14).

---

## 7. System Architecture

### 7.1 Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Next.js (React) | Fast iteration, SSR for SEO, Vercel deployment |
| Backend | Supabase | Auth, Postgres DB, Storage, Edge Functions, RLS |
| LLM | Claude (Anthropic API) | Best-in-class for long-context reasoning and structured output |
| Retrieval | Tavily API | Web search optimized for AI consumption |
| Vector Search | pgvector (Supabase) | Semantic search over stored documents |
| Hosting | Vercel | Frontend deployment, serverless functions |
| Storage | Supabase Storage | Private buckets for uploaded documents |

### 7.2 Why Claude as Primary LLM

Claude is selected for the following reasons critical to Paparan's requirements:

1. **Long-context handling** — Policy documents are often 20-50+ pages. Claude handles large context windows reliably, enabling full-document analysis without aggressive chunking.
2. **Structured output consistency** — Claude produces more stable adherence to JSON schemas and section-based formatting compared to alternatives, which is essential for the fixed Paparan format.
3. **Reasoning depth** — Policy analysis requires multi-layer reasoning (e.g., "Austin semiconductors → Singapore supply chain strategy → bilateral trade implications"). Claude excels at this chained inference.
4. **Lower hallucination rate** — Government users cannot tolerate fabricated claims. Claude's tendency toward conservative, grounded outputs aligns with this requirement.

### 7.3 Detailed Pipeline

```
[1] USER INPUT
    - Upload: PDF / DOCX
    - Topic: free text
    - Region: dropdown (ASEAN countries)

[2] QUERY PLANNER (Paparan logic)
    - Expands topic into 3-5 structured search queries
    - Example: "Indonesia Vietnam trade" becomes:
      * "Indonesia Vietnam trade agreement 2026"
      * "ASEAN tariff policy update"
      * "Vietnam import restrictions"

[3] RETRIEVAL (Tavily API)
    - Executes expanded queries
    - Returns top 5-10 results per query
    - Includes: title, URL, snippet, date

[4] SOURCE RANKING (Paparan logic)
    - Priority: Government/official > major news > regional media > blogs
    - Filters out low-quality or irrelevant sources
    - Assigns confidence scores

[5] DOCUMENT PARSING (if uploaded)
    - PDF: pdfplumber or unstructured
    - DOCX: python-docx
    - Extract: text, metadata, dates, entities

[6] EMBEDDING + STORAGE
    - Chunk parsed documents
    - Generate embeddings (OpenAI or local model)
    - Store in pgvector for future semantic search

[7] CLAUDE PROCESSING
    - Input: ranked sources + parsed documents + previous Paparan
    - System prompt enforces:
      * Institutional tone
      * Fixed 7-section schema
      * Quantified data priority
      * Decision-relevant focus
    - Output: structured JSON

[8] DELTA ENGINE (Paparan logic)
    - Retrieve previous Paparan (same topic)
    - Claude compares current vs. previous
    - Classifies changes: NEW / UPDATED / ESCALATED / DE-ESCALATED

[9] POST-PROCESSING
    - Section validation (all 7 sections present)
    - Source linking (each claim mapped to source)
    - Format rendering (clean UI or PDF export)

[10] STORAGE
    - Store generated Paparan in Supabase
    - Link to sources table
    - Version for future comparison
```

---

## 8. Data Model

### 8.1 Core Tables

**users**
| Field | Type | Notes |
|---|---|---|
| id | UUID | Supabase Auth ID |
| email | text | |
| full_name | text | |
| role | text | diplomat / analyst / admin |
| tracked_topics | jsonb | Topics for daily Paparan |
| created_at | timestamp | |

**paparan_reports**
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| topic | text | e.g., "Indonesia-Vietnam Trade" |
| region | text | e.g., "ASEAN" |
| report_type | text | on_demand / daily |
| content | jsonb | Structured 7-section output |
| delta_summary | jsonb | Change classifications |
| previous_report_id | UUID | FK for delta comparison |
| created_at | timestamp | |

**sources**
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| paparan_id | UUID | FK to paparan_reports |
| url | text | Source URL |
| title | text | Source title |
| source_type | text | government / news / research / uploaded |
| confidence | text | high / medium / low |
| retrieved_at | timestamp | |

**documents**
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK to users |
| file_path | text | Supabase Storage path |
| file_name | text | Original filename |
| parsed_text | text | Extracted content |
| metadata | jsonb | Date, entities, topics |
| embedding | vector(1536) | pgvector |
| uploaded_at | timestamp | |

**developments**
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| paparan_id | UUID | FK to paparan_reports |
| description | text | What happened |
| delta_type | text | NEW / UPDATED / ESCALATED / DE-ESCALATED |
| impact_level | text | HIGH / MEDIUM / LOW |
| entities | jsonb | Countries, orgs, programs |
| source_id | UUID | FK to sources |

---

## 9. Trust and Security

### 9.1 Principles

All data processed by Paparan must be treated as potentially sensitive. Even non-classified policy information requires careful handling to maintain institutional trust.

### 9.2 Supabase Security Implementation

**Row Level Security (RLS) — Mandatory on all tables**

Every table must have RLS enabled. No exceptions.

```sql
-- Users can only access their own Paparan reports
CREATE POLICY "users_own_paparan"
ON paparan_reports
FOR ALL
USING (auth.uid() = user_id);

-- Users can only access their own documents
CREATE POLICY "users_own_documents"
ON documents
FOR ALL
USING (auth.uid() = user_id);

-- Sources are accessible only through user's reports
CREATE POLICY "users_own_sources"
ON sources
FOR ALL
USING (
  paparan_id IN (
    SELECT id FROM paparan_reports WHERE user_id = auth.uid()
  )
);
```

**Authentication**
- Supabase Auth with JWT
- Role-based access stored in `raw_app_meta_data` (not user-editable)
- Roles: `user`, `analyst`, `admin`

**API Key Security**
- `anon` key: used in frontend, scoped by RLS
- `service_role` key: backend only, never exposed to client
- Service key bypasses RLS entirely, so it must never appear in frontend code

**Document Storage**
- All uploaded files stored in private Supabase Storage buckets
- Access via signed URLs with expiration (e.g., 15 minutes)
- No public file URLs

**Data Handling**
- User data is not used for model training
- Documents are processed and stored within the user's isolated scope
- Audit trail: who accessed what, when, and what was generated

### 9.3 Product Messaging

> "Paparan ensures secure and controlled processing of policy information through database-level access isolation, encrypted storage, and strict data scoping."

### 9.4 Future Security Enhancements (V2+)

- Client-side document encryption before upload
- Separate Supabase projects per organization (institutional clients)
- Document classification levels (public / internal / confidential)
- SOC 2 compliance pathway

---

## 10. UX/UI Design

### 10.1 Design Philosophy

Paparan's interface must communicate: **trust, clarity, and competence.**

It should feel like a government-grade tool, not a startup experiment. Design references: tawf.foundation (clean, calm, institutional).

**Principles:**
- Minimal — no visual clutter, no unnecessary elements
- Calm — soft neutral tones, no aggressive colors or animations
- Readable — typography optimized for long-form policy text
- Non-technical — no jargon, no developer-facing language

### 10.2 Visual Style

| Element | Specification |
|---|---|
| Background | Off-white / warm light (#FAFAF8 range) |
| Primary accent | Muted gold or warm amber |
| Text | Dark warm gray (#2D2D2D), not pure black |
| Typography | Clean serif or refined sans-serif (e.g., Source Serif Pro for body, DM Sans for UI) |
| Buttons | Rounded, solid fill, single accent color |
| Cards | Subtle shadow, generous padding |
| Icons | Minimal line icons |

**Avoid:**
- Dark/hacker UI themes
- Neon or saturated colors
- Complex dashboards
- Excessive animations
- "AI glow" or gradient effects

### 10.3 Landing Page Structure

```
[HERO]
  Paparan
  Strategic Briefs for Policymakers

  Turn complex reports into clear, actionable insights.

  [Upload Document]  [Create Paparan]

[TRUST SECTION]
  Built for policymakers
  Structured, reliable outputs
  Source-backed insights

[HOW IT WORKS]
  1. Upload your documents or select a topic
  2. Paparan analyzes key developments
  3. Get a structured, decision-ready brief

[SAMPLE OUTPUT]
  Preview of a clean Paparan output:
    Executive Summary
    Key Developments (with delta labels)
    Recommended Actions

[CTA]
  Create your first Paparan
```

### 10.4 App Interface (V1)

**Sidebar:**
- Create Paparan
- Today's Paparan (daily feed)
- Archive
- Settings

**Main area:**
- Clean document view
- Paparan output rendered in structured sections
- Export buttons (PDF, Copy)

---

## 11. User Flows

### 11.1 Flow A — On-Demand Paparan

```
[1] User opens Paparan
         |
[2] Clicks "Create Paparan"
         |
[3] Input screen:
    - Upload file(s) (drag and drop)
    - OR type topic
    - Optional: select region
         |
[4] Clicks "Generate Paparan"
         |
[5] Loading state:
    "Analyzing documents and identifying key developments..."
         |
[6] Output screen:
    Structured Paparan (7 sections)
    - Delta labels highlighted
    - Sources linked
         |
[7] Actions:
    - Export PDF
    - Copy
    - Save to archive
```

### 11.2 Flow B — Daily Paparan

```
[1] User opens Paparan (morning)
         |
[2] Sees "Today's Paparan" card on home screen
    - Title: "ASEAN Trade | 17 April 2026"
    - 3-5 key developments listed
         |
[3] Clicks to expand
         |
[4] Full daily brief:
    - Developments with delta labels
    - Brief implications
    - Source links
         |
[5] Optional: generate full Paparan from daily brief topic
```

### 11.3 Flow C — Return and Compare

```
[1] User opens Archive
         |
[2] Selects previous Paparan on same topic
         |
[3] System shows delta between current and previous:
    - What is NEW
    - What ESCALATED
    - What DE-ESCALATED
         |
[4] User uses comparison for meeting prep or reporting
```

### 11.4 Flow D — First-Time User (Onboarding)

```
[1] User lands on paparan.ai
         |
[2] Sees hero: "Strategic Briefs for Policymakers"
         |
[3] Clicks "Create Paparan"
         |
[4] Prompted to sign up (email / Google)
         |
[5] Quick onboarding:
    - "What topics do you follow?" (multi-select)
    - "What region?" (ASEAN default)
         |
[6] Redirected to first Paparan creation
         |
[7] After first Paparan: prompt to enable Daily Paparan
```

---

## 12. Competitive Positioning

### 12.1 Landscape

| Tool | Strength | Gap |
|---|---|---|
| Perplexity AI | Fast web search + citations | No structure, no delta, no decisions |
| ChatGPT (Deep Research) | Flexible reasoning, multi-step analysis | Inconsistent outputs, no institutional format |
| Google Gemini | Large context window, Google integration | General-purpose, no policy specialization |
| NotebookLM | Strong document analysis | No delta, no policy schema, no web retrieval |
| Genspark | Multi-source brief generation | No institutional consistency, no decision layer |

### 12.2 Paparan's Advantage

| Capability | Perplexity | ChatGPT | NotebookLM | Paparan |
|---|---|---|---|---|
| Write structured report | Weak | Medium | Medium | **Strong** |
| Consistent institutional format | No | No | No | **Yes** |
| Delta detection (temporal) | No | No | No | **Yes** |
| Decision recommendations | Weak | Weak | No | **Yes** |
| Source traceability | Good | Medium | Good | **Strong** |
| ASEAN/trade specialization | No | No | No | **Yes** |
| Daily intelligence feed | No | No | No | **Yes** |

### 12.3 Positioning Statement

> Paparan is not an AI summarizer. It is a decision intelligence system that converts fragmented information into structured, temporally-aware policy briefs with actionable recommendations.

### 12.4 Category

Paparan creates a new category: **Policy Intelligence System**

It sits one layer above research tools:

```
[Research Layer]  Perplexity / Tavily / News APIs
        |
[Intelligence Layer]  Paparan
        |
[Decision Layer]  Structured briefs, recommendations, delta
```

---

## 13. Cost Structure

### 13.1 Development Costs (MIS Grant Budget)

| Item | Estimated Cost (IDR) | Notes |
|---|---|---|
| Domain (paparan.ai) | 500,000 - 1,200,000 / year | .ai domain registration |
| Claude API (Anthropic) | 1,500,000 - 3,500,000 / month | ~20-50K tokens per Paparan, 5-20 per day |
| Tavily API | 500,000 - 1,500,000 / month | Web retrieval queries |
| Supabase (Pro) | 300,000 - 800,000 / month | Database, Auth, Storage |
| Vercel (Pro) | 200,000 - 500,000 / month | Frontend hosting |
| **Total (monthly)** | **~3,000,000 - 7,500,000** | |
| **Total (4-month grant)** | **~12,000,000 - 30,000,000** | Fits within Rp 10,000,000 grant with scope control |

### 13.2 Cost Optimization Strategy

To fit within the Rp 10,000,000 grant ceiling:

- Use Supabase free tier during development (sufficient for MVP)
- Use Vercel free tier (hobby plan)
- Limit Claude API calls during testing (use smaller context when possible)
- Use Tavily free tier (1,000 searches/month)
- Allocate grant primarily toward: domain + API usage during user testing

### 13.3 Post-Grant Monetization Path

| Model | Description |
|---|---|
| Freemium | Free daily Paparan (limited), paid on-demand |
| Institutional license | Per-seat for ministries and agencies |
| API access | Third-party integration |

---

## 14. Roadmap

### Phase 1 — MVP (Month 1-2) *Grant Scope*

- Paparan Generator (upload + topic input)
- Structured 7-section output
- Claude integration
- Tavily retrieval
- Basic source linking
- User auth (Supabase)
- Clean, minimal UI

### Phase 2 — Daily + Delta (Month 3-4) *Grant Scope*

- Daily Paparan feed
- Delta detection engine
- Topic subscriptions
- Paparan archive with search
- PDF export

### Phase 3 — Intelligence Layer (Post-Grant)

- Improved delta tracking with visual indicators
- Entity extraction and tracking (countries, orgs, programs)
- Topic-based alerts and notifications
- ASEAN-specific knowledge base

### Phase 4 — Platform (Long-Term Vision)

- Interactive dashboard
- World map with policy event visualization
- Geospatial trade flow mapping
- Multi-user institutional accounts
- Intelligence graph layer (entity relationships over time)
- API for third-party integration

---

## 15. Success Metrics

### 15.1 Quantitative

| Metric | Target (V1) |
|---|---|
| Time saved per report | > 70% reduction vs. manual |
| Daily Paparan engagement | > 60% of users check daily |
| Weekly retention | > 50% after 4 weeks |
| Paparan used without edits | > 40% sent as-is |

### 15.2 Qualitative

| Signal | Method |
|---|---|
| "Would you send this to your superior?" | User interview |
| Trust level in output | 1-5 rating per Paparan |
| Clarity of recommendations | Feedback form |

---

## 16. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Output quality too low for gov use | Critical | Strict schema enforcement, user testing with real diplomat, iterative prompt refinement |
| Hallucinated facts in briefs | Critical | Source traceability required, confidence scoring, Claude's conservative tendencies |
| Low adoption (too complex) | High | Minimal UI, "one-click" generation, daily feed habit loop |
| API cost overrun | Medium | Free tiers during MVP, usage caps, cost monitoring |
| Data security concerns | High | RLS, private storage, signed URLs, clear data policy messaging |
| Perceived as "ChatGPT wrapper" | Medium | Delta engine, institutional format, ASEAN specialization as clear differentiators |

---

## 17. MIS Grant Alignment

### 17.1 Innovation Criteria

| Requirement | Paparan's Answer |
|---|---|
| Innovative idea | Policy intelligence with delta detection (no existing tool does this) |
| Real-world application | Direct use by diplomats and policy analysts |
| Prototype feasibility | Built on existing APIs (Claude, Tavily, Supabase), achievable in 4 months |
| Focus area | AI + Software |

### 17.2 Team Structure (2-4 members)

| Role | Responsibility |
|---|---|
| Zidan (Lead) | Architecture, AI pipeline, product design |
| Member 2 | Frontend development (Next.js) |
| Member 3 | Backend + Supabase integration |
| Member 4 (optional) | UI/UX design, user research |

### 17.3 Deliverables

| Month | Deliverable |
|---|---|
| Month 1 | System design + basic Paparan generator |
| Month 2 | Working MVP with Claude + Tavily integration |
| Month 3 | Daily Paparan + delta detection |
| Month 4 | User testing + refinement + final presentation |

---

## 18. Future Vision

Paparan starts as a briefing tool. It evolves into **policy intelligence infrastructure for ASEAN.**

```
V1: Structured brief generator
V2: Delta-aware intelligence system
V3: ASEAN policy monitoring platform
V4: Full intelligence infrastructure with entity graphs and dashboards
```

The long-term positioning:

> "Bloomberg Terminal for ASEAN diplomacy and trade"

This aligns with the broader ecosystem vision connecting to trade infrastructure (Lading Logic) and policy intelligence for the region.

---

## Appendix A: Sample Paparan Output

```
PAPARAN — Indonesia-Vietnam Trade Relations
Generated: 17 April 2026

1. EXECUTIVE SUMMARY
- Vietnam implemented 15% tariff on processed food imports effective April 2026
- Bilateral trade volume declined 8% YoY in Q1 2026
- Indonesia's Ministry of Trade initiated consultation with Vietnamese counterpart
- SME exporters face short-term disruption in food processing sector
- Diplomatic channels remain constructive; resolution expected within 60 days

2. CURRENT SITUATION
Indonesia and Vietnam's trade relationship has entered a period of friction
following Vietnam's unilateral tariff increase on processed food categories.
The tariff specifically targets HS codes 1601-1605, affecting Indonesian
exporters who account for $340M in annual shipments...

3. KEY DEVELOPMENTS (DELTA)
[HIGH — NEW] Vietnam 15% tariff on processed food — implemented 3 April 2026
[MEDIUM — UPDATED] Bilateral consultation initiated — upgraded from "planned"
[LOW — NEW] Vietnamese domestic food industry lobbying for permanent protection

4. STRATEGIC IMPLICATIONS
The tariff represents a shift from Vietnam's historically open stance on
ASEAN intra-regional food trade. This may signal broader protectionist
tendencies that could affect other Indonesian export categories...

5. RISKS AND OPPORTUNITIES
[HIGH RISK] Tariff becomes permanent if no diplomatic resolution by Q3
[MEDIUM OPPORTUNITY] Indonesia can leverage RCEP dispute mechanism
[LOW RISK] Spillover to other ASEAN bilateral relationships

6. RECOMMENDED ACTIONS
- Engage Indonesian Ministry of Trade for RCEP consultation filing
- Delay new SME export expansion to Vietnam in food processing sector
- Monitor Vietnamese parliamentary session (May 2026) for tariff permanence vote
- Strengthen alternative channels through ASEAN Secretary-General

7. SOURCES
[1] Ministry of Trade Vietnam — Official Gazette, 3 April 2026
[2] Reuters — "Vietnam raises food import tariffs," 4 April 2026
[3] ASEAN Secretariat — Trade monitoring report, Q1 2026
```

---

## Appendix B: System Prompt Structure (Reference)

```
You are a senior policy analyst generating a structured intelligence brief
("Paparan") for a government policymaker.

REQUIREMENTS:
- Use institutional tone throughout
- Follow the exact 7-section structure provided
- Prioritize quantified data (numbers, dates, percentages)
- Include entity names (countries, ministries, organizations, programs)
- Classify developments by impact: HIGH / MEDIUM / LOW
- Classify changes by type: NEW / UPDATED / ESCALATED / DE-ESCALATED
- Provide concrete, specific recommended actions
- Avoid generic or vague statements
- Every claim must be attributable to a provided source

STRUCTURE:
1. Executive Summary (5 bullets maximum)
2. Current Situation
3. Key Developments (Delta)
4. Strategic Implications
5. Risks and Opportunities
6. Recommended Actions
7. Sources

CONTEXT:
[Previous Paparan on this topic, if available]
[Retrieved sources from Tavily]
[Uploaded documents, if any]

OUTPUT FORMAT: JSON following the paparan_reports.content schema
```

---

*End of PRD — Paparan.ai v1.0*