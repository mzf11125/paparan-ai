import re

with open('README.md', 'r') as f:
    content = f.read()

expanded_setup = """## 🚀 Comprehensive Setup Guide

This step-by-step tutorial will guide you from zero to a fully running local instance of Paparan.ai.

### Step 1: Clone the Repository
```bash
git clone https://github.com/your-org/paparan-ai.git
cd paparan-ai
```

### Step 2: Get Required API Keys
Paparan requires a few API keys to function fully. 
1. **Anthropic (Claude)**: Go to [console.anthropic.com](https://console.anthropic.com/), add billing credits (even $5 is enough for testing), and generate an API key. 
   *Alternative*: Use **z.ai** by setting `LLM_PROVIDER=zai` and getting a key from [z.ai](https://z.ai).
2. **Tavily (Search)**: Go to [tavily.com](https://tavily.com/), sign up, and get an API key. The free tier gives you 1,000 searches/month.
3. **Supabase**: Go to [supabase.com](https://supabase.com) and create a new free project.

*(Optional but recommended OSINT keys)*:
- **NASA FIRMS**: For fire hotspots. Register at [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/api/).
- **ACLED**: For conflict data. Register at [acleddata.com](https://acleddata.com/register/).

### Step 3: Supabase Database Setup 🗄
1. Once your Supabase project is ready, go to **Database → Extensions**.
2. Search for `vector` and enable the **pgvector** extension.
3. Go to **Database → SQL Editor → New query**.
4. You must run the migrations in exact order. Open the files in your code editor, copy the contents, and run them sequentially in Supabase:
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `backend/supabase/migrations/002_feed_cache.sql`
   - Run `backend/supabase/migrations/003_bappenas_metadata.sql`
   - Run `backend/supabase/migrations/004_rpjmn.sql`
5. Go to **Project Settings → API** and copy your `Project URL`, `anon` public key, and `service_role` secret key.
6. Go to **Project Settings → Database** and copy the `Connection string (URI)`. Ensure you select **psycopg** mode (should look like `postgresql+psycopg://...`).

### Step 4: Backend Setup (Python) 🐍
1. Open a new terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   ```
3. Install dependencies:
   ```bash
   pip install -e .
   ```
4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
5. Edit `backend/.env` with your API keys from Step 2 & 3:
   ```env
   ANTHROPIC_API_KEY=your-anthropic-key
   TAVILY_API_KEY=your-tavily-key
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql+psycopg://...
   FRONTEND_URL=http://localhost:5173
   ```
6. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend is now running at http://localhost:8000*

### Step 5: Frontend Setup (React) ⚛️
1. Open a second terminal window and stay in the root project folder:
   ```bash
   # Make sure you are in the paparan-ai root directory
   npm install
   ```
2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
3. Edit the root `.env` file:
   ```env
   VITE_API_URL=http://localhost:8000
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *The frontend is now running at http://localhost:5173*

### Step 6: Verify Installation ✅
1. Open your browser to `http://localhost:5173`.
2. You should see the Paparan login/dashboard page.
3. Because the backend is running, the frontend will connect automatically, fetch feed items from your Supabase DB, and allow you to generate AI policy briefs.
"""

# Find the section between ## 🚀 Getting Started and ## 🚢 Deployment
# We will replace Getting Started and Database Setup entirely with our new Comprehensive Setup Guide.
start_idx = content.find("## 🚀 Getting Started")
end_idx = content.find("## 🚢 Deployment")

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + expanded_setup + "\n\n" + content[end_idx:]
    with open('README.md', 'w') as f:
        f.write(new_content)
    print("Successfully expanded setup guide.")
else:
    print("Could not find sections to replace.")

