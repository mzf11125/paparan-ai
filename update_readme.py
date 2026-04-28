import re

with open('README.md', 'r') as f:
    content = f.read()

# The current content starts with:
# # Paparan.ai
# 
# AI-powered policy intelligence system transforming fragmented information into structured, decision-ready briefs for policymakers in ASEAN.
# 
# ## Status

overview_and_features = """
## 📖 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [Status](#-status)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Database Setup (Supabase)](#-database-setup-supabase)
- [Deployment](#-deployment)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Policy Alignment (RPJMN & RDTII)](#-policy-alignment-rpjmn--rdtii)
- [Bellingcat OSINT Integration](#-bellingcat-osint-integration)
- [LLM Provider Switching](#-llm-provider-switching)
- [News Sources](#-news-sources)
- [Running Tests](#-running-tests)
- [Key Design Decisions](#-key-design-decisions)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [FAQ & Troubleshooting](#-faq--troubleshooting)
- [License](#-license)

## 🌟 Overview
Government policymakers face an overwhelming volume of fragmented data—from news articles and corporate filings to geospatial anomalies and conflict reports. **Paparan.ai** cuts through the noise by deploying a multi-agent AI system that aggregates, cross-references, and synthesizes OSINT (Open Source Intelligence) into actionable, decision-ready policy briefs. 

Designed specifically for the ASEAN geopolitical landscape, Paparan.ai ensures that intelligence is preserved, policy proposals align with national development goals (like Indonesia's RPJMN), and diplomats receive exactly what they need to act.

## ✨ Key Features
- **Multi-Agent Orchestration**: A sophisticated LangGraph pipeline featuring specialized agents (Scraper, Gov Intel, Analyst, Researcher, Simulator) working in concert.
- **Deep OSINT Integration**: Built-in integrations with Bellingcat-approved tools (Sentinel Hub, VesselFinder, OpenCorporates, NASA FIRMS, ACLED).
- **Auto-Archiving**: Every scraped intelligence source is automatically archived to the Wayback Machine to prevent link rot and preserve historical records.
- **Automatic Policy Alignment**: Policy briefs are instantly scored against Indonesia's RPJMN Asta Cita and ASEAN RDTII pillars.
- **Diplomat & Executive Exports**: One-click generation of PDF memos, PowerPoint slide decks, and Diplomat Briefings complete with talking points and distribution lists.
- **Cache-First RAG**: High-performance Retrieval-Augmented Generation using Supabase pgvector to reduce LLM latency and API costs.
- **LLM Agnostic**: Seamlessly switch between Anthropic (Claude) and z.ai (OpenAI-compatible) models without changing agent code.

## 🚦 Status
"""

contributing_and_faq = """
---

## 🤝 Contributing
We welcome contributions from the community! To contribute:
1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

Please ensure that you run the test suite (`pytest tests/`) before submitting your PR.

---

## ❓ FAQ & Troubleshooting

**Q: The AI agents are failing or timing out.**  
A: Ensure your `ANTHROPIC_API_KEY` or `ZAI_API_KEY` is correctly set and has available billing credits.

**Q: The PDF/PPTX export isn't working.**  
A: Ensure you have installed the required system dependencies for `reportlab` and `python-pptx` if you are running outside of Docker.

**Q: Migrations fail to run on Supabase.**  
A: Make sure you run them in the exact order specified (001 through 004). The `pgvector` extension must be enabled *before* running `001_initial_schema.sql`.

---

"""

# Replace "## Status" with the new overview and features
new_content = content.replace("## Status", overview_and_features, 1)

# Add headers to existing sections to match ToC emojis
new_content = new_content.replace("## Architecture", "## 🏗 Architecture")
new_content = new_content.replace("## Tech Stack", "## 🛠 Tech Stack")
new_content = new_content.replace("## Project Structure", "## 📂 Project Structure")
new_content = new_content.replace("## Getting Started", "## 🚀 Getting Started")
new_content = new_content.replace("## Database Setup (Supabase)", "## 🗄 Database Setup (Supabase)")
new_content = new_content.replace("## Deployment", "## 🚢 Deployment")
new_content = new_content.replace("## Environment Variables", "## 🔐 Environment Variables")
new_content = new_content.replace("## API Endpoints", "## 📡 API Endpoints")
new_content = new_content.replace("## RPJMN 2025–2029 Asta Cita Pillars", "## 🎯 Policy Alignment (RPJMN & RDTII)\n\n### RPJMN 2025–2029 Asta Cita Pillars")
new_content = new_content.replace("## Bellingcat OSINT Integration", "## 🔍 Bellingcat OSINT Integration")
new_content = new_content.replace("## LLM Provider Switching", "## 🧠 LLM Provider Switching")
new_content = new_content.replace("## News Sources", "## 📰 News Sources")
new_content = new_content.replace("## Running Tests", "## 🧪 Running Tests")
new_content = new_content.replace("## Key Design Decisions", "## 💡 Key Design Decisions")
new_content = new_content.replace("## Roadmap", "## 🗺 Roadmap")

# Insert Contributing and FAQ before License
new_content = new_content.replace("## License", contributing_and_faq + "## 📄 License")

with open('README.md', 'w') as f:
    f.write(new_content)

print("README.md updated successfully.")
