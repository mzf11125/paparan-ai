# Paparan.ai

AI-powered policy intelligence system transforming fragmented information into structured, decision-ready briefs for policymakers in ASEAN.

## Current Status

This is a **frontend prototype** built with Vite + React. The backend (Supabase), AI integration (Claude), and real data pipeline are planned — see [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the roadmap.

## Tech Stack

- **Frontend**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Backend** *(planned)*: Supabase (Auth, Postgres, Storage)
- **AI** *(planned)*: Anthropic Claude via Vercel AI Gateway
- **Retrieval** *(planned)*: Tavily API
- **Deployment** *(planned)*: Vercel

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── pages/              # Route-level page components
├── components/
│   ├── ui/             # Reusable UI primitives
│   ├── Layout/         # App shell, sidebar, header
│   ├── brief/          # Brief display components
│   ├── dashboard/      # Dashboard widgets
│   └── landing/        # Landing page sections
├── hooks/              # Custom React hooks
├── contexts/           # React context providers
├── services/           # API/data service layer (mock)
├── data/               # Mock data
├── types/              # TypeScript types
└── utils/              # Utility functions
```

## License

MIT
