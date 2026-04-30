#!/bin/bash
# Railway Environment Variables Setup Script
# Run this script to set environment variables on Railway

echo "Setting Railway environment variables..."

# Required variables
railway variables set ANTHROPIC_API_KEY=your_key_here
railway variables set TAVILY_API_KEY=your_key_here
railway variables set SUPABASE_URL=your_url_here
railway variables set SUPABASE_ANON_KEY=your_key_here
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_key_here
railway variables set DATABASE_URL=your_db_url_here
railway variables set FRONTEND_URL=https://your-frontend-domain.com

# LLM Provider (default is zai)
railway variables set LLM_PROVIDER=zai
railway variables set ZAI_API_KEY=your_zai_key_here

# Optional - for fallback
railway variables set ANTHROPIC_MODEL=claude-opus-4-5

echo "Environment variables set. Please update the placeholder values in Railway dashboard."
