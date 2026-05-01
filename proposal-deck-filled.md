# Paparan Brief - AI Incubation for Public Sector 2026 Proposal

---

## Slide 1: Title Slide

**Paparan Brief**

### AI Solution for Bappenas (Use Case 1) and BKPM (Use Case 2)

Presented by: **Paparan Team (BINUS University)**
Team Leader: **Muhammad Zidan Fatonie** | Email: **muhammad.fatonie@binus.ac.id**

---

## Slide 2: Problem Statement

### The Public Sector Challenge

**Problem Owner:** Bappenas (Use Case 1) and BKPM (Use Case 2)

#### The Problem
Bappenas analysts and BKPM investment officers face overwhelming information overload. Reports from ministries, news outlets, corporate filings, and international organizations arrive daily in fragmented formats. Manual synthesis takes hours and often results in missed signals.

**BKPM specific challenge:** Investment licensing decisions require complex due diligence on corporate actors, but information is scattered across multiple government databases, news sources, and compliance reports.

#### Why Now?
Indonesia is accelerating digital transformation in government (e-Gov initiative) and needs decision-ready intelligence tools. Policymakers cannot rely on manual workflows in today's fast-moving geopolitical and economic environment.

---

## Slide 3: AI Solution Overview

### Our Approach

#### Solution Concept
Paparan Brief - Multi-agent AI system that transforms fragmented information into structured, decision-ready policy briefs with automatic delta tracking and source traceability.

#### AI Technology Used
| Technology | Application |
|------------|--------------|
| Large Language Models (Claude) | Document analysis, reasoning, structured output |
| Retrieval-Augmented Generation (RAG) | Web search integration via Tavily API |
| Vector Search (PGVector) | Semantic document retrieval |
| Multi-Agent Orchestration (LangGraph) | Scraper, Gov Intel, Analyst, Researcher agents |

#### Key Features
1. **Delta Detection Engine** - Automatically identifies NEW, UPDATED, ESCALATED, or DE-ESCALATED developments
2. **RPJMN Alignment Scoring** - Automatic scoring against Indonesia's 8-pillar national development goals
3. **SDI Metadata Extraction** - Bilingual extraction of Sustainable Development Goals indicators from documents
4. **Source Traceability** - Every insight links back to original documents or URLs
5. **OSINT Integration** - Built-in access to Bellingcat-approved tools for spatial, maritime, and conflict data

#### Why This AI Approach
Structured institutional format that policymakers actually use. Delta tracking provides temporal awareness that no existing consumer AI tool offers.

---

## Slide 4: Data Requirements

### Data Sources & Strategy

#### Required Data
| Data Type | Source | Availability | Access Method |
|-----------|--------|--------------|---------------|
| Policy Documents | Bappenas internal PDFs | Available via API/upload | Document processing pipeline |
| Sector Codes & K/L Mapping | Bappenas metadata systems | Available via integration | Bappenas tools module |
| News & Reports | Public sources (Bappenas.go.id) | Available via scraping | Tavily API integration |
| Corporate Data | OpenCorporates, filings | Available via API | OpenCorporates integration |
| Investment Data | BKPM OSS (Online Single Submission) | Available via API | BKPM OSS integration |

#### Data Volume & Structure
- **Volume:** Thousands of documents and daily news feeds
- **Structure:** Semi-structured PDFs, unstructured news, structured government databases
- **Quality:** High for official sources, variable for public news

#### Privacy & Security Approach
- **Compliance:** Personal Data Protection Law (UU PDP), Government data security standards
- **Anonymization:** PII redaction from uploaded documents before processing
- **Access Control:** Row-Level Security (RLS), user-level data isolation

---

## Slide 5: System Architecture

### Technical Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User Interface                        │
│         (Bappenas / BKPM Users & Admins)                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  API Layer                            │
│            (FastAPI REST + SSE Streaming)                 │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              LangGraph Multi-Agent System                     │
│    ┌──────────┬──────────┬──────────┐             │
│    │ Scraper  │ Gov Intel │ Analyst   │             │
│    └──────────┴──────────┴──────────┘             │
│              │              │
│              ▼              ▼
│    ┌─────────────────────────────────┐             │
│    │ Claude LLM (Structured Output) │             │
│    └─────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                Data Layer                             │
│    ┌──────────┬──────────┬──────────┐             │
│    │ Supabase│ PGVector  │ Storage   │             │
│    │ (Postgres)│ (Search)  │ (Docs)    │             │
│    └──────────┴──────────┴──────────┘             │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│          External Integrations                             │
│    ├── Bappenas APIs (sector codes, K/L mapping)           │
│    ├── BKPM OSS (investment data)                       │
│    ├── Bellingcat OSINT (spatial, maritime, conflict)     │
│    ├── OpenCorporates (corporate actor tracking)          │
│    └── Tavily (news search)                             │
└─────────────────────────────────────────────────────────┘
```

#### Integration Points
- **Bappenas:** Sector code database, policy document archive, K/L classification system
- **BKPM:** Online Single Submission (OSS), investment licensing database
- **Bellingcat OSINT:** Sentinel Hub, VesselFinder, Global Forest Watch, NASA FIRMS

---

## Slide 6: Use Case & Target Users

### Who Will Use This Solution?

#### Primary Users
| User Type | Role | Workflow Integration |
|------------|------|---------------------|
| **Bappenas Analysts** | Policy research & analysis | Upload documents, generate structured briefs |
| **BKPM Investment Officers** | Due diligence & licensing | Corporate actor research, investment screening |
| **Policymakers** | Decision support | Receive daily intelligence feeds |
| **Diplomats** | Pre-meeting preparation | Export PDF memos, talking points |

#### User Journey
1. **Upload / Select** - Upload policy documents or select tracked topic
2. **Analyze** - AI agents retrieve relevant sources and synthesize
3. **Review** - Check structured brief with delta labels and sources
4. **Export** - Download PDF, PPTX, or Diplomat format

#### Government Integration
- **Agency:** Bappenas (Use Case 1), BKPM (Use Case 2)
- **Current Workflow:** Manual reading of reports, web searches, word document drafting
- **With Solution:** Automated synthesis, structured output, delta awareness, source linking

---

## Slide 7: Expected Impact

### Measurable Outcomes

#### Quantitative Impact
| Metric | Current State | Target State | Improvement |
|--------|---------------|--------------|--------------|
| Brief Preparation Time | 2-4 hours | 15-30 minutes | 90% reduction |
| Information Coverage | Manual search limits | 10+ sources per brief | 3x increase |
| Delta Detection | None (manual tracking) | Automatic real-time | NEW capability |
| Source Traceability | Links lost in notes | Every claim linked | 100% traceability |

#### Qualitative Impact
- **Transparency:** Every insight linked to verified source
- **Consistency:** Standardized 7-section format across all briefs
- **Decision Support:** Concrete recommended actions included
- **Temporal Awareness:** Delta labels show what changed recently

#### Scale of Impact
- **Initial Scope:** Bappenas analysts, BKPM investment officers
- **Expansion Potential:** Other ministries (Kemenlu, Kemendikbud), regional ASEAN users

---

## Slide 8: MVP Plan & Timeline

### Development Roadmap (8-Week Program)

```
Week 1-2: Discovery & Alignment
├── Access Bappenas/BKPM data documentation
├── Define integration APIs and data formats
├── Set up sandbox environment with agency
└── Technical setup and data access agreement

Week 3-4: Core Development
├── Implement Bappenas sector code integration
├── Implement BKPM OSS data pipeline
├── Develop corporate actor tracking module
└── Initial testing with sample agency data

Week 5-6: Sandbox Testing
├── Test with real Bappenas policy documents
├── Test with BKPM investment data
├── User feedback collection from agency staff
└── Iteration and refinement

Week 7-8: Demo & Handover
├── Final integration with agency systems
├── Impact assessment and performance metrics
└── Demo Day presentation to problem owners
```

#### Key Deliverables
| Week | Deliverable | Success Criteria |
|-------|-------------|-----------------|
| Week 2 | Data & protocol agreement | Signed MoU with Bappenas/BKPM |
| Week 4 | Working MVP | Bappenas module + BKPM module functional |
| Week 6 | Tested prototype | Validated with real agency data |
| Week 8 | Demo-ready solution | Full presentation to problem owners |

---

## Slide 9: Risks & Mitigation

### Risk Assessment Matrix

| Risk Category | Risk | Impact | Mitigation Strategy |
|--------------|-------|---------|-------------------|
| **Data Access** | Agency API integration delays | High | Alternative public sources, manual fallback |
| **Integration** | Legacy system incompatibility | Medium | API wrappers, gradual migration approach |
| **Accuracy** | AI hallucinations in briefs | High | Source traceability, confidence scoring, conservative prompting |
| **Adoption** | User resistance to new workflow | Medium | Training, user-centered design, gradual rollout |
| **Security** | Data privacy concerns | High | RLS, PII redaction, isolated user data |

### Contingency Plans
- **Plan B:** Work with existing data formats and document upload if API access delayed
- **Support Needed:** Agency data owner for integration testing and validation

---

## Slide 10: Team Profile & Background

### Why Our Team?

#### Team Composition
| Name | Role | Expertise | Background |
|------|------|------------|-------------|
| Muhammad Zidan Fatonie | Team Lead | AI/ML, System Architecture | Binus University, Paparan Brief founder |
| Marcell | Business Development | Stakeholder management | Business development, govt relations |
| Komang | Developer | Full-stack development | Web development, API integration |

#### Relevant Experience
- **Paparan Brief:** AI-powered policy intelligence system with delta detection, OSINT integration, and ASEAN specialization
- **Technical Stack:** Next.js, FastAPI, LangGraph, Supabase, Anthropic Claude
- **Academic Context:** Binus University - understanding of government policy needs

#### Government/Public Sector Experience
- Direct collaboration with diplomats for requirements validation
- Understanding of RPJMN alignment and ASEAN policy frameworks
- Experience with Bellingcat OSINT tools and government data sources

#### Differentiators
1. **Delta Detection** - First policy intelligence tool with automatic temporal tracking
2. **Institutional Format** - Structured 7-section brief format modeled after real diplomatic intelligence
3. **ASEAN Specialized** - Built specifically for ASEAN geopolitical context

---

## Appendix: Program Context (Reference)

### Five Actors Ecosystem
```
┌─────────────────────────────────────────────────────────────┐
│                    AI Innovators                                  │
│                   (Paparan Team)                                │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                   Problem Owners                                   │
│          (Ministries with real challenges)                       │
│  • Bappenas  • BKPM                                          │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                  Technology Partners                                 │
│              (AWS infrastructure support)                              │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                   Strategic Partners                                  │
│              (i.AI UK - guidance & standards)                        │
└─────────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────────┐
│                   Program Partners                                   │
│                (Execution & coordination)                              │
└─────────────────────────────────────────────────────────────┘
```

### Four Incubation Phases

| Phase | Duration | Key Activities | Key Deliverables |
|--------|-----------|-----------------|-------------------|
| **Curation** | Weeks 1-2 | Application, concept note, selection | Concept Note, Team Profile |
| **Piloting** | Weeks 3-6 | POC development, real data testing | Working Prototype, Test Results |
| **Validation** | Week 7 | Impact assessment, compliance check | Impact Report, Compliance Doc |
| **Scaling** | Week 8+ | Policy adoption, scale-up planning | Adoption Plan, Market Strategy |

---

## Additional Resources

### Contact Information
- **Program Email:** incubation@amana.id
- **Website:** aiforpublicsector.id

### What Winners Receive
- Grant funding for selected innovators
- AWS cloud infrastructure access throughout program
- Mentoring from industry and government experts
- Hands-on experience with government data systems
- Post-program policy adoption support
- Connections to investment and scale-up ecosystem

### Our Portfolios
- paparanbrief.com - Live policy intelligence demos
- paparanbreif.com - Diplomat briefing format examples
- github.com/mzf11125/paparan-ai - Open source code

---

**End of Proposal**
