# Paparan.ai — Implementation Plan
> Generated: 2026-04-24 | Based on Statt.com competitive analysis

---

## Current State

Paparan.ai is a **Vite + React 19 + TypeScript** frontend prototype. There is no live backend — all data is mock. The README describes a planned Next.js + Supabase stack that has not yet been built.

### What exists today
| Area | Status |
|---|---|
| UI design system | ✅ Complete (classification badges, delta labels, ornaments, seals) |
| Landing page | ✅ Complete |
| Briefs library (mock) | ✅ Complete |
| Brief detail view (mock) | ✅ Complete |
| Brief editor (mock) | ✅ Complete |
| News feed (mock) | ✅ Complete |
| Watchlist (mock) | ✅ Complete |
| Analytics dashboard (mock) | ✅ Complete |
| Settings page (mock) | ✅ Complete |
| Auth (login UI only) | ⚠️ UI exists, no backend |
| Backend / database | ❌ None |
| AI integration (Claude) | ❌ None |
| Real data pipeline | ❌ None |
| Alert system | ❌ None |
| Document upload | ❌ None |
| Export (PDF/Word/PPT) | ❌ None |

---

## Migration: Vite → Next.js App Router

The README targets Next.js 16 + Supabase. The codebase is currently Vite. This migration is a prerequisite for everything else.

### Phase 0 — Framework Migration
**Goal:** Move from Vite to Next.js App Router without breaking the UI.

1. Scaffold Next.js app (`npx create-next-app@latest`)
2. Move `src/components`, `src/hooks`, `src/utils`, `src/types`, `src/data` as-is
3. Convert `src/pages/*.tsx` → `src/app/(app)/[route]/page.tsx`
4. Convert `src/pages/LoginPage.tsx` → `src/app/(auth)/login/page.tsx`
5. Move `src/assets/styles/index.css` → `src/app/globals.css`
6. Replace `react-router-dom` with Next.js `<Link>` and `useRouter`
7. Replace `AppContext` with Next.js server/client component split
8. Verify build passes

**File mapping:**
```
src/pages/LandingPage.tsx          → src/app/page.tsx
src/pages/LoginPage.tsx            → src/app/(auth)/login/page.tsx
src/pages/BriefsLibraryPage.tsx    → src/app/(app)/briefs/page.tsx
src/pages/BriefDetailPage.tsx      → src/app/(app)/briefs/[id]/page.tsx
src/pages/BriefEditorPage.tsx      → src/app/(app)/briefs/[id]/edit/page.tsx
src/pages/NewsFeedPage.tsx         → src/app/(app)/feed/page.tsx
src/pages/WatchlistPage.tsx        → src/app/(app)/watchlist/page.tsx
src/pages/AnalyticsDashboardPage.tsx → src/app/(app)/analytics/page.tsx
src/pages/SettingsPage.tsx         → src/app/(app)/settings/page.tsx
```

---

## Phase 1 — Auth + Database (P0)

**Goal:** Real users, real sessions, real data persistence.

### 1.1 Supabase Setup
- Create Supabase project
- Enable `vector` extension
- Run `supabase/migrations/001_initial_schema.sql`
- Run `supabase/storage.sql`

### 1.2 Auth
- Wire `src/app/(auth)/login/page.tsx` to `supabase.auth.signInWithPassword()`
- Add `src/app/(auth)/signup/page.tsx`
- Add `src/app/auth/callback/route.ts` for OAuth callback
- Add middleware (`src/middleware.ts`) to protect `(app)` routes

**New files:**
```
src/lib/supabase.ts          — browser client
src/lib/supabase-server.ts   — server client (cookies)
src/middleware.ts             — route protection
```

### 1.3 Database Schema (extend existing migration)
```sql
-- briefs: id, user_id, title, classification, region, status, content (jsonb), created_at
-- watchlist: user_id, brief_id
-- alerts: id, user_id, query, regions[], frequency, last_triggered
-- documents: id, user_id, storage_path, filename, processed_at
-- sources: id, brief_id, url, title, snippet, retrieved_at
```

### 1.4 Replace Mock Data
- `src/services/briefService.ts` — replace mock returns with Supabase queries
- Remove `src/data/mockBriefs.ts` and `src/data/sampleBrief.ts` once live data flows

---

## Phase 2 — AI Briefer (P0)

**Goal:** Generate real policy briefs using Claude via Vercel AI Gateway.

### 2.1 API Route
```
src/app/api/paparan/route.ts
```
- Accept: `{ topic, regions, classification, context? }`
- Call Tavily for source retrieval
- Call Claude (`anthropic/claude-sonnet-4-5`) with structured prompt
- Return: brief JSON matching existing `PaparanBrief` type + sources array

### 2.2 Prompt Design
The prompt must produce output matching the existing brief schema:
```
executiveSummary, currentSituation, keyDevelopments[],
risksAndOpportunities, strategicImplications, recommendedActions[], sources[]
```
Each source must include `url`, `title`, `snippet` for citation display (uses existing `SourceTooltip` component).

### 2.3 Wire BriefEditorPage
- Replace mock generation in `BriefEditorPage.tsx` with `fetch('/api/paparan', ...)`
- Show streaming progress (Claude supports streaming)
- On completion, save to Supabase `briefs` table

### 2.4 Citation System
- Every AI claim links to a source via `SourceTooltip` (already built)
- Sources stored in `sources` table, linked to `brief_id`

---

## Phase 3 — Real-Time Intelligence Feed (P1)

**Goal:** Replace mock news feed with live ASEAN policy intelligence.

### 3.1 Tavily-Powered Feed
```
src/app/api/feed/route.ts
```
- Query Tavily with ASEAN legislative/regulatory search terms
- Cache results in Supabase (`feed_items` table) with 1-hour TTL
- Return paginated results

### 3.2 Feed Schema
```sql
feed_items: id, title, summary, url, source, region, topic_tags[], published_at, retrieved_at
```

### 3.3 Wire NewsFeedPage
- Replace `mockFeedItems` with API call to `/api/feed`
- Existing filter UI (region, topic) works against real data
- Add infinite scroll / pagination

---

## Phase 4 — Alert System (P1)

**Goal:** Proactive monitoring — notify users when relevant policy developments occur.

### 4.1 Alert Configuration UI
- Add alert creation to `SettingsPage.tsx` (UI already has a settings structure)
- Fields: keyword/topic, regions, frequency (daily/weekly), delivery (in-app/email)

### 4.2 Alert Processing
```
src/app/api/alerts/process/route.ts   — called by Vercel Cron
```
- For each active alert, run Tavily search
- Compare against last triggered results
- If new items found: create notification, update `alerts.last_triggered`

### 4.3 Vercel Cron Config (`vercel.json`)
```json
{
  "crons": [{ "path": "/api/alerts/process", "schedule": "0 6 * * *" }]
}
```

### 4.4 In-App Notifications
- Add notification bell to `Header.tsx` (already has the layout slot)
- Badge count from unread alerts in Supabase

---

## Phase 5 — Document Upload & Analysis (P1)

**Goal:** Users upload policy documents; Claude analyzes them.

### 5.1 Upload API
```
src/app/api/upload/route.ts
```
- Accept PDF/DOCX (max 10MB)
- Store in Supabase Storage (`documents` bucket — already in `storage.sql`)
- Extract text (use `pdf-parse` for PDF)
- Store extracted text in `documents.content`

### 5.2 Document Analysis
- In `BriefEditorPage`, add "Upload Document" option
- Extracted text injected into Claude prompt as additional context
- Sources list shows uploaded document as a citation

---

## Phase 6 — Export (P1)

**Goal:** Export briefs to PDF, Word, and print-optimized HTML.

### 6.1 PDF Export
```
src/app/api/export/pdf/route.ts
```
- Use `@react-pdf/renderer` or Puppeteer (headless Chrome via Vercel)
- Render existing `PaparanBrief` component to PDF
- Preserve classification headers, official seals, ornaments

### 6.2 Word Export
- Use `docx` npm package
- Map brief sections to Word styles (Heading 1/2, body text)

### 6.3 Print CSS
- Already partially implemented in `index.css` (`@media print`)
- Verify classification banners and page breaks render correctly

---

## Phase 7 — Watchlist & Saved Briefs (P2)

**Goal:** Persist watchlist to database (currently mock).

- Wire `WatchlistPage.tsx` to Supabase `watchlist` table
- Add/remove from watchlist via `briefService.ts`
- Watchlist items show delta status (NEW/UPDATED) when brief is regenerated

---

## Phase 8 — ASEAN Data Coverage (P2)

**Goal:** Structured coverage of ASEAN legislative/regulatory bodies.

### Priority data sources to index via Tavily:
| Country | Source |
|---|---|
| Malaysia | Parliament.gov.my, MyGovUC |
| Singapore | Parliament.gov.sg, AGC.gov.sg |
| Indonesia | DPR.go.id, JDIH.go.id |
| Thailand | Parliament.go.th |
| Philippines | Congress.gov.ph, Senate.gov.ph |
| Vietnam | Quochoi.vn |
| ASEAN | ASEAN.org, ERIA.org |

### Structured search queries (run daily via cron):
- `"[country] parliament bill [current year]"`
- `"[country] regulatory announcement [current year]"`
- `"ASEAN [topic] policy [current year]"`

---

## Phase 9 — Stakeholder Intelligence (P2)

**Goal:** Track key policymakers and organizations relevant to ASEAN policy.

- `stakeholders` table: name, role, organization, country, topics[], profile_url
- Stakeholder cards in brief detail view (link to relevant officials)
- Sourced from public government directories + Tavily enrichment

---

## Tech Debt & Cleanup

| Item | Action |
|---|---|
| `tailwind.config.js` + `tailwind.config.ts` both exist | Remove `.js` version |
| `design_guidelines.md` + `DESIGN_GUIDELINES.md` both exist | Consolidate |
| `src/pages/` (Vite) vs `src/app/` (Next.js) | Resolve during Phase 0 |
| Mock data in `src/data/` | Remove after Phase 1-2 |
| `scripts/debug-*.ts` | Remove or move to `scripts/dev/` |

---

## Milestone Summary

| Phase | Deliverable | Priority | Effort |
|---|---|---|---|
| 0 | Vite → Next.js migration | P0 | Medium |
| 1 | Auth + Supabase + real data | P0 | High |
| 2 | AI Briefer (Claude + Tavily) | P0 | Medium |
| 3 | Live intelligence feed | P1 | Medium |
| 4 | Alert system | P1 | Medium |
| 5 | Document upload + analysis | P1 | Medium |
| 6 | Export (PDF/Word/Print) | P1 | Low |
| 7 | Persistent watchlist | P2 | Low |
| 8 | ASEAN data coverage | P2 | High |
| 9 | Stakeholder intelligence | P2 | High |

---

## What NOT to Build (Statt.com features to skip)

- **Bill redlining** — requires structured legislative data APIs (not available for ASEAN at scale)
- **Contact directory** — ASEAN government contact data is fragmented; low ROI vs. effort
- **Interest-group tracking** — US-centric feature (lobbying disclosures, LDA filings); no ASEAN equivalent
- **Calendar integration** — Nice-to-have; defer until core pipeline is live
- **140+ market coverage** — Statt's breadth is a weakness for focus; stay ASEAN-first

---

## Paparan.ai Unique Advantages to Protect

These are differentiators vs. Statt.com — do not dilute them:

1. **Government-grade design** — classification system, official seals, serif typography
2. **ASEAN-first positioning** — no direct competitor owns this space
3. **Delta tracking** — NEW/UPDATED/ESCALATED status on briefs
4. **Region-based navigation** — APAC/EMEA/Americas/ASEAN/Global views
5. **Policymaker audience** — Statt targets corporate GR teams; Paparan targets government officials
