# Paparan.ai

AI-powered policy intelligence system transforming fragmented information into structured, decision-ready briefs for policymakers in ASEAN.

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript
- **Backend**: Supabase (Auth, Postgres, Storage)
- **AI**: Anthropic Claude via AI Gateway (`anthropic/claude-sonnet-4.6`)
- **Retrieval**: Tavily API
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 24+
- Vercel CLI: `npm install -g vercel`

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
```

### Environment Variables

Configure the following in `.env.local`:

```bash
# Supabase (from supabase.com dashboard)
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Tavily API (from tavily.com)
TAVILY_API_KEY=your_tavily_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Enable the `vector` extension in Database > Extensions
3. Run the SQL migrations from `supabase/migrations/001_initial_schema.sql`
4. Run `supabase/storage.sql` to set up document storage

### Vercel Setup

```bash
# Link to Vercel
vercel link

# Enable AI Gateway in Vercel Dashboard, then pull env vars
vercel env pull .env.local
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (app)/             # Protected app routes
│   ├── api/               # API endpoints
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── Layout/            # Layout components
│   └── Paparan/           # Paparan-specific components
└── lib/                   # Core utilities
    ├── supabase.ts        # Supabase client
    ├── schema.ts          # Zod schemas
    ├── tavily.ts          # Tavily API wrapper
    └── paparan.ts         # AI pipeline logic
```

## License

MIT
