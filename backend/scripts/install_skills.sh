#!/bin/bash
set -e
echo "Installing Claude Code skills for Paparan.ai..."

# Writing & document quality
npx skills add op7418/humanizer-zh

# Frontend & design
npx skills add anthropics/skills --skill frontend-design

# LangChain / LangGraph (backend agent framework)
npx skills add anthropics/skills --skill langchain-fundamentals
npx skills add anthropics/skills --skill langchain-rag
npx skills add anthropics/skills --skill langgraph-fundamentals
npx skills add anthropics/skills --skill langgraph-persistence
npx skills add anthropics/skills --skill langgraph-docs

# Knowledge work (legal-risk-assessment, compliance, search-strategy, stakeholder-comms)
npx skills add anthropics/knowledge-work-plugins

# Financial services (competitive-analysis, macro-rates-monitor, equity-research)
npx skills add anthropics/financial-services-plugins

# Government intelligence
npx skills add https://github.com/hack23/riksdagsmonitor --skill global-government-analysis

echo "All skills installed."
