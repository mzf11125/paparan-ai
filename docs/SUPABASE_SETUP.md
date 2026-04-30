# Supabase Setup Guide

This guide will help you set up Supabase for Paparan.ai.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Basic understanding of SQL

## Step 1: Create a Supabase Project

1. Go to https://supabase.com
2. Click **"New Project"**
3. Enter project details:
   - **Name**: `paparan-ai`
   - **Database Password**: (generate and save securely)
   - **Region**: Choose closest to your users (Singapore recommended for ASEAN)
4. Click **"Create new project"** and wait for setup to complete

## Step 2: Get API Keys

1. Go to **Project Settings** > **API**
2. Copy these values to your `.env.local`:

| Environment Variable | Source |
|---------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (never commit this) |

## Step 3: Enable pgvector Extension

1. Go to **Database** > **Extensions**
2. Search for `vector`
3. Enable **`vector`** (pgvector)

## Step 4: Create Database Tables

Go to **SQL Editor** and run the following script:

```sql
-- ============================================
-- Paparan.ai Database Schema
-- ============================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- Users Table (extends Supabase Auth)
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'analyst', 'admin')),
  tracked_topics JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Paparan Reports
-- ============================================
CREATE TABLE public.paparan_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  region TEXT DEFAULT 'ASEAN',
  report_type TEXT DEFAULT 'on_demand' CHECK (report_type IN ('on_demand', 'daily')),
  content JSONB NOT NULL,
  delta_summary JSONB,
  previous_report_id UUID REFERENCES paparan_reports(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Sources
-- ============================================
CREATE TABLE public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paparan_id UUID REFERENCES paparan_reports(id) ON DELETE CASCADE,
  url TEXT,
  title TEXT,
  source_type TEXT CHECK (source_type IN ('government', 'news', 'research', 'uploaded')),
  confidence TEXT CHECK (confidence IN ('HIGH', 'MEDIUM', 'LOW')),
  retrieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Documents (for uploaded files)
-- ============================================
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  parsed_text TEXT,
  metadata JSONB,
  embedding vector(1536),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Developments (for delta tracking)
-- ============================================
CREATE TABLE public.developments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paparan_id UUID REFERENCES paparan_reports(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  delta_type TEXT CHECK (delta_type IN ('NEW', 'UPDATED', 'ESCALATED', 'DE-ESCALATED')),
  impact_level TEXT CHECK (impact_level IN ('HIGH', 'MEDIUM', 'LOW')),
  entities JSONB,
  source_id UUID REFERENCES sources(id)
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX idx_paparan_user_topic ON paparan_reports(user_id, topic);
CREATE INDEX idx_paparan_created ON paparan_reports(created_at DESC);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_embedding ON documents USING ivfflat(embedding vector_cosine_ops);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paparan_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Users can only access their own data
CREATE POLICY "users_own_data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "users_own_paparan" ON paparan_reports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "users_own_sources" ON sources
  FOR ALL USING (
    paparan_id IN (
      SELECT id FROM paparan_reports WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "users_own_developments" ON developments
  FOR ALL USING (
    paparan_id IN (
      SELECT id FROM paparan_reports WHERE user_id = auth.uid()
    )
  );

-- Allow inserts for authenticated users
CREATE POLICY "users_can_insert_paparan" ON paparan_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_insert_documents" ON documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_insert_sources" ON sources
  FOR INSERT WITH CHECK (
    paparan_id IN (
      SELECT id FROM paparan_reports WHERE user_id = auth.uid()
    )
  );
```

## Step 5: Create Storage Bucket (Optional)

For document uploads:

1. Go to **Storage**
2. Click **"Create a new bucket"**
3. Enter:
   - **Name**: `documents`
   - **Public bucket**: OFF (private)
4. Click **"Create bucket"**

Then add RLS policy for storage:

```sql
-- Storage bucket policies
CREATE POLICY "users_can_upload_documents"
ON storage.objects FOR INSERT
WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "users_can_view_own_documents"
ON storage.objects FOR SELECT
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## Step 6: Enable Email Auth

1. Go to **Authentication** > **Providers**
2. Ensure **Email** provider is enabled
3. Optionally enable **Google** OAuth

## Step 7: Verify Setup

Run these queries to verify your setup:

```sql
-- Check tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies WHERE schemaname = 'public';

-- Check pgvector
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
```

## Troubleshooting

### RLS Issues

If you get permission denied errors:

```sql
-- Check current RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Disable RLS for testing (NOT recommended for production)
ALTER TABLE public.paparan_reports DISABLE ROW LEVEL SECURITY;
```

### Connection Issues

If the app can't connect to Supabase:
1. Verify your `.env.local` has correct values
2. Check Supabase project status (dashboard might show maintenance)
3. Ensure your IP is not blocked (check Supabase dashboard > Settings > API)

### Reset Database

To start fresh:

```sql
-- Drop all tables (CAUTION: deletes all data)
DROP TABLE IF EXISTS public.developments CASCADE;
DROP TABLE IF EXISTS public.sources CASCADE;
DROP TABLE IF EXISTS public.paparan_reports CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
```

Then re-run the schema creation script above.
