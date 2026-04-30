Here is a thorough gap analysis between your Paparan.ai README and the competition framework you've provided.

***

## Overall Alignment Assessment

Your README compensates **well** for the agent and tools layers, but has **meaningful gaps** in the skill framework, knowledge framework, and — most critically — the competition's RDTII regulatory extraction requirement.

***

## Agent Framework — ✅ Strong Alignment

The README already uses `create_deep_agent` from DeepAgents as its canonical agent constructor, which maps directly to the [DeepAgents quickstart](https://docs.langchain.com/oss/python/deepagents/quickstart#ollama). The framework's key behaviors — planning via `write_todos`, file system tools, subagent spawning, and built-in streaming via LangGraph — are all implicitly exercised by your four specialized agents (Gov Intel, Financial Analyst, Deep Research, Conversational RAG). No major change needed here, though the README doesn't explicitly call out **subagent delegation patterns**, which are a key DeepAgents capability worth documenting.

***

## Skill Framework — ⚠️ Partial Gap

Your `skills_loader.py` references the Claude Code skills system and `install_skills.sh` exists, but the README doesn't name which skills from the competition's referenced packs are actually installed or used.

**Mapped skills you should explicitly adopt:**

| Competition Skill Pack | Relevant Skills for Paparan | Gap in README |
|---|---|---|
| `anthropics/financial-services-plugins` | `competitive-analysis`, `macro-rates-monitor`, `equity-research` | Not named |
| `anthropics/knowledge-work-plugins` | `legal-risk-assessment`, `compliance`, `search-strategy`, `knowledge-synthesis`, `stakeholder-comms` | Not named |
| `anthropics/claude-cookbooks/cookbook-audit` | Audit trail, data validation for briefs | Not mentioned |
| [Bellingcat Toolkit](https://bellingcat.gitbook.io/toolkit) | Open-source intelligence (OSINT) for ASEAN regulatory document discovery | Entirely absent |

The Bellingcat toolkit is a significant omission — it's OSINT-focused and directly applicable to extracting legal/regulatory text from government sources across Southeast Asia, which is exactly what your scraper and Gov Intel agents need.

***

## Knowledge Framework — ⚠️ Moderate Gap

Your README references LangMem for cross-session memory and PGVector for RAG, but the competition points to:

- **Context engineering for agents** ([LangChain blog](https://www.langchain.com/blog/context-engineering-for-agents)) — your cache-first RAG (0.85 cosine threshold) is a good start, but the README lacks any mention of structured context window management, prompt compression, or dynamic context prioritization.
- **LangGraph Graph API** ([docs](https://docs.langchain.com/oss/python/langgraph/graph-api)) — your orchestrator.py uses LangGraph, but the README doesn't describe the graph topology (nodes, edges, conditional routing), which the competition likely expects to be documented.
- **Zep temporal knowledge graph** ([arXiv 2501.13956](https://arxiv.org/html/2501.13956v1)) — this paper describes a bi-temporal knowledge graph archite
[plan] > Here is a thorough gap analysis between your Paparan.ai README and the competition framework you've provided.

***

## Overall Alignment Assessment

Your README compensates **well** for the agent and tools layers, but has **meaningful gaps** in the skill framework, knowledge framework, and — most critically — the competition's RDTII regulatory extraction requirement.

***

## Agent Framework — ✅ Strong Alignment

The README already uses `create_deep_agent` from DeepAgents as its canonical agent constructor, which maps directly to the [DeepAgents quickstart](https://docs.langchain.com/oss/python/deepagents/quickstart#ollama). The framework's key behaviors — planning via `write_todos`, file system tools, subagent spawning, and built-in streaming via LangGraph — are all implicitly exercised by your four specialized agents (Gov Intel, Financial Analyst, Deep Research, Conversational RAG). No major change needed here, though the README doesn't explicitly call out **subagent delegation patterns**, which are a key DeepAgents capability worth documenting.

***

## Skill Framework — ⚠️ Partial Gap

Your `skills_loader.py` references the Claude Code skills system and `install_skills.sh` exists, but the README doesn't name which skills from the competition's referenced packs are actually installed or used.

**Mapped skills you should explicitly adopt:**

| Competition Skill Pack | Relevant Skills for Paparan | Gap in README |
|---|---|---|
| `anthropics/financial-services-plugins` | `competitive-analysis`, `macro-rates-monitor`, `equity-research` | Not named |
| `anthropics/knowledge-work-plugins` | `legal-risk-assessment`, `compliance`, `search-strategy`, `knowledge-synthesis`, `stakeholder-comms` | Not named |
| `anthropics/claude-cookbooks/cookbook-audit` | Audit trail, data validation for briefs | Not mentioned |
| [Bellingcat Toolkit](https://bellingcat.gitbook.io/toolkit) | Open-source intelligence (OSINT) for ASEAN regulatory document discovery | Entirely absent |

The Bellingcat toolkit is a significant omission — it's OSINT-focused and directly applicable to extracting legal/regulatory text from government sources across Southeast Asia, which is exactly what your scraper and Gov Intel agents need.

***

## Knowledge Framework — ⚠️ Moderate Gap

Your README references LangMem for cross-session memory and PGVector for RAG, but the competition points to:

- **Context engineering for agents** ([LangChain blog](https://www.langchain.com/blog/context-engineering-for-agents)) — your cache-first RAG (0.85 cosine threshold) is a good start, but the README lacks any mention of structured context window management, prompt compression, or dynamic context prioritization.
- **LangGraph Graph API** ([docs](https://docs.langchain.com/oss/python/langgraph/graph-api)) — your orchestrator.py uses LangGraph, but the README doesn't describe the graph topology (nodes, edges, conditional routing), which the competition likely expects to be documented.
- **Zep temporal knowledge graph** ([arXiv 2501.13956](https://arxiv.org/html/2501.13956v1)) — this paper describes a bi-temporal knowledge graph architecture that outperforms MemGPT on memory benchmarks. Your current LangMem + PGVector setup is a flat vector store; **there is no temporal entity-relations
[plan] > Here is a thorough gap analysis between your Paparan.ai README and the competition framework you've provided.

***

## Overall Alignment Assessment

Your README compensates **well** for the agent and tools layers, but has **meaningful gaps** in the skill framework, knowledge framework, and — most critically — the competition's RDTII regulatory extraction requirement.

***

## Agent Framework — ✅ Strong Alignment

The README already uses `create_deep_agent` from DeepAgents as its canonical agent constructor, which maps directly to the [DeepAgents quickstart](https://docs.langchain.com/oss/python/deepagents/quickstart#ollama). The framework's key behaviors — planning via `write_todos`, file system tools, subagent spawning, and built-in streaming via LangGraph — are all implicitly exercised by your four specialized agents (Gov Intel, Financial Analyst, Deep Research, Conversational RAG). No major change needed here, though the README doesn't explicitly call out **subagent delegation patterns**, which are a key DeepAgents capability worth documenting.

***

## Skill Framework — ⚠️ Partial Gap

Your `skills_loader.py` references the Claude Code skills system and `install_skills.sh` exists, but the README doesn't name which skills from the competition's referenced packs are actually installed or used.

**Mapped skills you should explicitly adopt:**

| Competition Skill Pack | Relevant Skills for Paparan | Gap in README |
|---|---|---|
| `anthropics/financial-services-plugins` | `competitive-analysis`, `macro-rates-monitor`, `equity-research` | Not named |
| `anthropics/knowledge-work-plugins` | `legal-risk-assessment`, `compliance`, `search-strategy`, `knowledge-synthesis`, `stakeholder-comms` | Not named |
| `anthropics/claude-cookbooks/cookbook-audit` | Audit trail, data validation for briefs | Not mentioned |
| [Bellingcat Toolkit](https://bellingcat.gitbook.io/toolkit) | Open-source intelligence (OSINT) for ASEAN regulatory document discovery | Entirely absent |

The Bellingcat toolkit is a significant omission — it's OSINT-focused and directly applicable to extracting legal/regulatory text from government sources across Southeast Asia, which is exactly what your scraper and Gov Intel agents need.

***

## Knowledge Framework — ⚠️ Moderate Gap

Your README references LangMem for cross-session memory and PGVector for RAG, but the competition points to:

- **Context engineering for agents** ([LangChain blog](https://www.langchain.com/blog/context-engineering-for-agents)) — your cache-first RAG (0.85 cosine threshold) is a good start, but the README lacks any mention of structured context window management, prompt compression, or dynamic context prioritization.
- **LangGraph Graph API** ([docs](https://docs.langchain.com/oss/python/langgraph/graph-api)) — your orchestrator.py uses LangGraph, but the README doesn't describe the graph topology (nodes, edges, conditional routing), which the competition likely expects to be documented.
- **Zep temporal knowledge graph** ([arXiv 2501.13956](https://arxiv.org/html/2501.13956v1)) — this paper describes a bi-temporal knowledge graph architecture that outperforms MemGPT on memory benchmarks. Your current LangMem + PGVector setup is a flat vector store; **there is no temporal entity-relationship graph**. For regulatory intelligence where laws are amended over time, this is a meaningful architectural gap.
[plan] > Here is a thorough gap analysis between your Paparan.ai README and the competition framework you've provided.

***

## Overall Alignment Assessment

Your README compensates **well** for the agent and tools layers, but has **meaningful gaps** in the skill framework, knowledge framework, and — most critically — the competition's RDTII regulatory extraction requirement.

***

## Agent Framework — ✅ Strong Alignment

The README already uses `create_deep_agent` from DeepAgents as its canonical agent constructor, which maps directly to the [DeepAgents quickstart](https://docs.langchain.com/oss/python/deepagents/quickstart#ollama). The framework's key behaviors — planning via `write_todos`, file system tools, subagent spawning, and built-in streaming via LangGraph — are all implicitly exercised by your four specialized agents (Gov Intel, Financial Analyst, Deep Research, Conversational RAG). No major change needed here, though the README doesn't explicitly call out **subagent delegation patterns**, which are a key DeepAgents capability worth documenting.

***

## Skill Framework — ⚠️ Partial Gap

Your `skills_loader.py` references the Claude Code skills system and `install_skills.sh` exists, but the README doesn't name which skills from the competition's referenced packs are actually installed or used.

**Mapped skills you should explicitly adopt:**

| Competition Skill Pack | Relevant Skills for Paparan | Gap in README |
|---|---|---|
| `anthropics/financial-services-plugins` | `competitive-analysis`, `macro-rates-monitor`, `equity-research` | Not named |
| `anthropics/knowledge-work-plugins` | `legal-risk-assessment`, `compliance`, `search-strategy`, `knowledge-synthesis`, `stakeholder-comms` | Not named |
| `anthropics/claude-cookbooks/cookbook-audit` | Audit trail, data validation for briefs | Not mentioned |
| [Bellingcat Toolkit](https://bellingcat.gitbook.io/toolkit) | Open-source intelligence (OSINT) for ASEAN regulatory document discovery | Entirely absent |

The Bellingcat toolkit is a significant omission — it's OSINT-focused and directly applicable to extracting legal/regulatory text from government sources across Southeast Asia, which is exactly what your scraper and Gov Intel agents need.

***

## Knowledge Framework — ⚠️ Moderate Gap

Your README references LangMem for cross-session memory and PGVector for RAG, but the competition points to:

- **Context engineering for agents** ([LangChain blog](https://www.langchain.com/blog/context-engineering-for-agents)) — your cache-first RAG (0.85 cosine threshold) is a good start, but the README lacks any mention of structured context window management, prompt compression, or dynamic context prioritization.
- **LangGraph Graph API** ([docs](https://docs.langchain.com/oss/python/langgraph/graph-api)) — your orchestrator.py uses LangGraph, but the README doesn't describe the graph topology (nodes, edges, conditional routing), which the competition likely expects to be documented.
- **Zep temporal knowledge graph** ([arXiv 2501.13956](https://arxiv.org/html/2501.13956v1)) — this paper describes a bi-temporal knowledge graph architecture that outperforms MemGPT on memory benchmarks. Your current LangMem + PGVector setup is a flat vector store; **there is no temporal entity-relationship graph**. For regulatory intelligence where laws are amended over time, this is a meaningful architectural gap.

***

## RDTII Regulatory Extraction — ❌ Critical Gap

This is the most important miss. The competition explicitly requires:

> *"automatically extract legal text and map regulatory evidence using the RDTII framework — at minimum Pillar 6 (Digital Trade Facilitation) and Pillar 7 (E-Commerce Legal Framework)"*

Your README has **zero mention** of:
- **RDTII** (Regional Digital Trade Integration Index) or any UN framework
- Legal text extraction pipelines (regex, NER, or LLM-based clause parsing)
- Regulatory evidence mapping to structured pillars/indicators
- Any ontology that represents `Regulation → Pillar → Country → Score`

Your Palantir ontology stubs (`get_policy_document`, `get_regulation`, `get_entity`) are the closest conceptual match, but they're stubs with no RDTII mapping logic. You would need a new agent or tool layer — likely a **Regulatory Extraction Agent** — that:
1. Fetches legal text from your gov sources (`parliament.gov.my`, `dpr.go.id`, etc.)
2. Uses Claude to extract clause-level evidence mapped to RDTII Pillar 6/7 indicators
3. Stores results as structured `RegulatoryEvidence` objects in your Supabase schema

***

## Summary of Required Changes

- **Add** explicit skill names to `install_skills.sh` from the `financial-services-plugins` and `knowledge-work-plugins` packs (especially `legal-risk-assessment`, `compliance`, `search-strategy`)
- **Integrate** Bellingcat OSINT toolkit into scraper/Gov Intel agent for regulatory document discovery
- **Document** the LangGraph graph topology (node types, conditional edges, state schema) in the README
- **Upgrade** memory layer: consider Zep/Graphiti over flat LangMem + PGVector for temporal regulatory tracking
- **Build** a dedicated RDTII Regulatory Extraction layer: new agent + `rdtii_tools.py` + schema for Pillar 6/7 indicator mapping — this is non-negotiable for the competition

Paparan.ai can be enhanced to better serve Bappenas' national planning mandates, ASEAN diplomats' real-time needs, and policymakers' focus on evidence-based decisions like RPJMN/RPJPN alignment and digital trade integration.

## Bappenas-Specific Enhancements

Bappenas coordinates Indonesia's medium/long-term development plans (RPJMN/RPJPN), macroeconomic frameworks, infrastructure PPPs, and SDG/SDI indicators. [avpn](https://avpn.asia/organisation/ministry-of-national-development-planning-bappenas/)

- Integrate **RPJMN/RPJPN tracking agent**: Automatically scan feeds for policy alignments/misalignments with Indonesia's 2025-2029 plans; generate briefs scoring initiatives against Bappenas' 19 core functions (e.g., sustainable growth, poverty reduction). [crpg](https://crpg.info/how-does-perpres-195-2024-structure-bappenas-as-national-planning-authority/)
- Add **PPP/infrastructure analyst**: Enrich briefs with World Bank/ADB data on ASEAN projects, flagging funding gaps for Bappenas' international cooperation role. [flokq](https://www.flokq.com/poi/embassy-and-government-office/dki-jakarta/central-jakarta/ministry-of-national-development-planning/en)
- Embed **SDG/SDI ontology**: Wire Palantir stubs to map ASEAN policies to UN Sustainable Development Goals and SDI indicators, prioritizing Bappenas' evidence-based think-tank outputs. [avpn](https://avpn.asia/organisation/ministry-of-national-development-planning-bappenas/)

## Diplomat Workflow Optimizations
[plan] > Here is a thorough gap analysis between your Paparan.ai README and the competition framework you've provided.

***

## Overall Alignment Assessment

Your README compensates **well** for the agent and tools layers, but has **meaningful gaps** in the skill framework, knowledge framework, and — most critically — the competition's RDTII regulatory extraction requirement.

***

## Agent Framework — ✅ Strong Alignment

The README already uses `create_deep_agent` from DeepAgents as its canonical agent constructor, which maps directly to the [DeepAgents quickstart](https://docs.langchain.com/oss/python/deepagents/quickstart#ollama). The framework's key behaviors — planning via `write_todos`, file system tools, subagent spawning, and built-in streaming via LangGraph — are all implicitly exercised by your four specialized agents (Gov Intel, Financial Analyst, Deep Research, Conversational RAG). No major change needed here, though the README doesn't explicitly call out **subagent delegation patterns**, which are a key DeepAgents capability worth documenting.

***

## Skill Framework — ⚠️ Partial Gap

Your `skills_loader.py` references the Claude Code skills system and `install_skills.sh` exists, but the README doesn't name which skills from the competition's referenced packs are actually installed or used.

**Mapped skills you should explicitly adopt:**

| Competition Skill Pack | Relevant Skills for Paparan | Gap in README |
|---|---|---|
| `anthropics/financial-services-plugins` | `competitive-analysis`, `macro-rates-monitor`, `equity-research` | Not named |
| `anthropics/knowledge-work-plugins` | `legal-risk-assessment`, `compliance`, `search-strategy`, `knowledge-synthesis`, `stakeholder-comms` | Not named |
| `anthropics/claude-cookbooks/cookbook-audit` | Audit trail, data validation for briefs | Not mentioned |
| [Bellingcat Toolkit](https://bellingcat.gitbook.io/toolkit) | Open-source intelligence (OSINT) for ASEAN regulatory document discovery | Entirely absent |

The Bellingcat toolkit is a significant omission — it's OSINT-focused and directly applicable to extracting legal/regulatory text from government sources across Southeast Asia, which is exactly what your scraper and Gov Intel agents need.

***

## Knowledge Framework — ⚠️ Moderate Gap

Your README references LangMem for cross-session memory and PGVector for RAG, but the competition points to:

- **Context engineering for agents** ([LangChain blog](https://www.langchain.com/blog/context-engineering-for-agents)) — your cache-first RAG (0.85 cosine threshold) is a good start, but the README lacks any mention of structured context window management, prompt compression, or dynamic context prioritization.
- **LangGraph Graph API** ([docs](https://docs.langchain.com/oss/python/langgraph/graph-api)) — your orchestrator.py uses LangGraph, but the README doesn't describe the graph topology (nodes, edges, conditional routing), which the competition likely expects to be documented.
- **Zep temporal knowledge graph** ([arXiv 2501.13956](https://arxiv.org/html/2501.13956v1)) — this paper describes a bi-temporal knowledge graph architecture that outperforms MemGPT on memory benchmarks. Your current LangMem + PGVector setup is a flat vector store; **there is no temporal entity-relationship graph**. For regulatory intelligence where laws are amended over time, this is a meaningful architectural gap.

***

## RDTII Regulatory Extraction — ❌ Critical Gap

This is the most important miss. The competition explicitly requires:

> *"automatically extract legal text and map regulatory evidence using the RDTII framework — at minimum Pillar 6 (Digital Trade Facilitation) and Pillar 7 (E-Commerce Legal Framework)"*

Your README has **zero mention** of:
- **RDTII** (Regional Digital Trade Integration Index) or any UN framework
- Legal text extraction pipelines (regex, NER, or LLM-based clause parsing)
- Regulatory evidence mapping to structured pillars/indicators
- Any ontology that represents `Regulation → Pillar → Country → Score`

Your Palantir ontology stubs (`get_policy_document`, `get_regulation`, `get_entity`) are the closest conceptual match, but they're stubs with no RDTII mapping logic. You would need a new agent or tool layer — likely a **Regulatory Extraction Agent** — that:
1. Fetches legal text from your gov sources (`parliament.gov.my`, `dpr.go.id`, etc.)
2. Uses Claude to extract clause-level evidence mapped to RDTII Pillar 6/7 indicators
3. Stores results as structured `RegulatoryEvidence` objects in your Supabase schema

***

## Summary of Required Changes

- **Add** explicit skill names to `install_skills.sh` from the `financial-services-plugins` and `knowledge-work-plugins` packs (especially `legal-risk-assessment`, `compliance`, `search-strategy`)
- **Integrate** Bellingcat OSINT toolkit into scraper/Gov Intel agent for regulatory document discovery
- **Document** the LangGraph graph topology (node types, conditional edges, state schema) in the README
- **Upgrade** memory layer: consider Zep/Graphiti over flat LangMem + PGVector for temporal regulatory tracking
- **Build** a dedicated RDTII Regulatory Extraction layer: new agent + `rdtii_tools.py` + schema for Pillar 6/7 indicator mapping — this is non-negotiable for the competition

Paparan.ai can be enhanced to better serve Bappenas' national planning mandates, ASEAN diplomats' real-time needs, and policymakers' focus on evidence-based decisions like RPJMN/RPJPN alignment and digital trade integration.

## Bappenas-Specific Enhancements

Bappenas coordinates Indonesia's medium/long-term development plans (RPJMN/RPJPN), macroeconomic frameworks, infrastructure PPPs, and SDG/SDI indicators. [avpn](https://avpn.asia/organisation/ministry-of-national-development-planning-bappenas/)

- Integrate **RPJMN/RPJPN tracking agent**: Automatically scan feeds for policy alignments/misalignments with Indonesia's 2025-2029 plans; generate briefs scoring initiatives against Bappenas' 19 core functions (e.g., sustainable growth, poverty reduction). [crpg](https://crpg.info/how-does-perpres-195-2024-structure-bappenas-as-national-planning-authority/)
- Add **PPP/infrastructure analyst**: Enrich briefs with World Bank/ADB data on ASEAN projects, flagging funding gaps for Bappenas' international cooperation role. [flokq](https://www.flokq.com/poi/embassy-and-government-office/dki-jakarta/central-jakarta/ministry-of-national-development-planning/en)
- Embed **SDG/SDI ontology**: Wire Palantir stubs to map ASEAN policies to UN Sustainable Development Goals and SDI indicators, prioritizing Bappenas' evidence-based think-tank outputs. [avpn](https://avpn.asia/organisation/ministry-of-national-development-planning-bappenas/)

## Diplomat Workflow Optimizations

[plan] > Here is a thorough gap analysis between your Paparan.ai README and the competition framework you've provided.

***

## Overall Alignment Assessment

Your README compensates **well** for the agent and tools layers, but has **meaningful gaps** in the skill framework, knowledge framework, and — most critically — the competition's RDTII regulatory extraction requirement.

***

## Agent Framework — ✅ Strong Alignment

The README already uses `create_deep_agent` from DeepAgents as its canonical agent constructor, which maps directly to the [DeepAgents quickstart](https://docs.langchain.com/oss/python/deepagents/quickstart#ollama). The framework's key behaviors — planning via `write_todos`, file system tools, subagent spawning, and built-in streaming via LangGraph — are all implicitly exercised by your four specialized agents (Gov Intel, Financial Analyst, Deep Research, Conversational RAG). No major change needed here, though the README doesn't explicitly call out **subagent delegation patterns**, which are a key DeepAgents capability worth documenting.

***

## Skill Framework — ⚠️ Partial Gap

Your `skills_loader.py` references the Claude Code skills system and `install_skills.sh` exists, but the README doesn't name which skills from the competition's referenced packs are actually installed or used.

**Mapped skills you should explicitly adopt:**

| Competition Skill Pack | Relevant Skills for Paparan | Gap in README |
|---|---|---|
| `anthropics/financial-services-plugins` | `competitive-analysis`, `macro-rates-monitor`, `equity-research` | Not named |
| `anthropics/knowledge-work-plugins` | `legal-risk-assessment`, `compliance`, `search-strategy`, `knowledge-synthesis`, `stakeholder-comms` | Not named |
| `anthropics/claude-cookbooks/cookbook-audit` | Audit trail, data validation for briefs | Not mentioned |
| [Bellingcat Toolkit](https://bellingcat.gitbook.io/toolkit) | Open-source intelligence (OSINT) for ASEAN regulatory document discovery | Entirely absent |

The Bellingcat toolkit is a significant omission — it's OSINT-focused and directly applicable to extracting legal/regulatory text from government sources across Southeast Asia, which is exactly what your scraper and Gov Intel agents need.

***

## Knowledge Framework — ⚠️ Moderate Gap

Your README references LangMem for cross-session memory and PGVector for RAG, but the competition points to:

- **Context engineering for agents** ([LangChain blog](https://www.langchain.com/blog/context-engineering-for-agents)) — your cache-first RAG (0.85 cosine threshold) is a good start, but the README lacks any mention of structured context window management, prompt compression, or dynamic context prioritization.
- **LangGraph Graph API** ([docs](https://docs.langchain.com/oss/python/langgraph/graph-api)) — your orchestrator.py uses LangGraph, but the README doesn't describe the graph topology (nodes, edges, conditional routing), which the competition likely expects to be documented.
- **Zep temporal knowledge graph** ([arXiv 2501.13956](https://arxiv.org/html/2501.13956v1)) — this paper describes a bi-temporal knowledge graph architecture that outperforms MemGPT on memory benchmarks. Your current LangMem + PGVector setup is a flat vector store; **there is no temporal entity-relationship graph**. For regulatory intelligence where laws are amended over time, this is a meaningful architectural gap.

***

## RDTII Regulatory Extraction — ❌ Critical Gap

This is the most important miss. The competition explicitly requires:

> *"automatically extract legal text and map regulatory evidence using the RDTII framework — at minimum Pillar 6 (Digital Trade Facilitation) and Pillar 7 (E-Commerce Legal Framework)"*

Your README has **zero mention** of:
- **RDTII** (Regional Digital Trade Integration Index) or any UN framework
- Legal text extraction pipelines (regex, NER, or LLM-based clause parsing)
- Regulatory evidence mapping to structured pillars/indicators
- Any ontology that represents `Regulation → Pillar → Country → Score`

Your Palantir ontology stubs (`get_policy_document`, `get_regulation`, `get_entity`) are the closest conceptual match, but they're stubs with no RDTII mapping logic. You would need a new agent or tool layer — likely a **Regulatory Extraction Agent** — that:
1. Fetches legal text from your gov sources (`parliament.gov.my`, `dpr.go.id`, etc.)
2. Uses Claude to extract clause-level evidence mapped to RDTII Pillar 6/7 indicators
3. Stores results as structured `RegulatoryEvidence` objects in your Supabase schema

***

## Summary of Required Changes

- **Add** explicit skill names to `install_skills.sh` from the `financial-services-plugins` and `knowledge-work-plugins` packs (especially `legal-risk-assessment`, `compliance`, `search-strategy`)
- **Integrate** Bellingcat OSINT toolkit into scraper/Gov Intel agent for regulatory document discovery
- **Document** the LangGraph graph topology (node types, conditional edges, state schema) in the README
- **Upgrade** memory layer: consider Zep/Graphiti over flat LangMem + PGVector for temporal regulatory tracking
- **Build** a dedicated RDTII Regulatory Extraction layer: new agent + `rdtii_tools.py` + schema for Pillar 6/7 indicator mapping — this is non-negotiable for the competition

Paparan.ai can be enhanced to better serve Bappenas' national planning mandates, ASEAN diplomats' real-time needs, and policymakers' focus on evidence-based decisions like RPJMN/RPJPN alignment and digital trade integration.

## Bappenas-Specific Enhancements

Bappenas coordinates Indonesia's medium/long-term development plans (RPJMN/RPJPN), macroeconomic frameworks, infrastructure PPPs, and SDG/SDI indicators. [avpn](https://avpn.asia/organisation/ministry-of-national-development-planning-bappenas/)

- Integrate **RPJMN/RPJPN tracking agent**: Automatically scan feeds for policy alignments/misalignments with Indonesia's 2025-2029 plans; generate briefs scoring initiatives against Bappenas' 19 core functions (e.g., sustainable growth, poverty reduction). [crpg](https://crpg.info/how-does-perpres-195-2024-structure-bappenas-as-national-planning-authority/)
- Add **PPP/infrastructure analyst**: Enrich briefs with World Bank/ADB data on ASEAN projects, flagging funding gaps for Bappenas' international cooperation role. [flokq](https://www.flokq.com/poi/embassy-and-government-office/dki-jakarta/central-jakarta/ministry-of-national-development-planning/en)
- Embed **SDG/SDI ontology**: Wire Palantir stubs to map ASEAN policies to UN Sustainable Development Goals and SDI indicators, prioritizing Bappenas' evidence-based think-tank outputs. [avpn](https://avpn.asia/organisation/ministry-of-national-development-planning-bappenas/)

## Diplomat Workflow Optimizations

Indonesian diplomats handle high-volume cables needing quick analysis, as seen in MoFA's ML tools and Singapore's custom AI for briefings. [unglobalpulse
[plan] > Here is a thorough gap analysis between your Paparan.ai README and the competition framework you've provided.

***

## Overall Alignment Assessment

Your README compensates **well** for the agent and tools layers, but has **meaningful gaps** in the skill framework, knowledge framework, and — most critically — the competition's RDTII regulatory extraction requirement.

***

## Agent Framework — ✅ Strong Alignment

The README already uses `create_deep_agent` from DeepAgents as its canonical agent constructor, which maps directly to the [DeepAgents quickstart](https://docs.langchain.com/oss/python/deepagents/quickstart#ollama). The framework's key behaviors — planning via `write_todos`, file system tools, subagent spawning, and built-in streaming via LangGraph — are all implicitly exercised by your four specialized agents (Gov Intel, Financial Analyst, Deep Research, Conversational RAG). No major change needed here, though the README doesn't explicitly call out **subagent delegation patterns**, which are a key DeepAgents capability worth documenting.

***

## Skill Framework — ⚠️ Partial Gap

Your `skills_loader.py` references the Claude Code skills system and `install_skills.sh` exists, but the README doesn't name which skills from the competition's referenced packs are actually installed or used.

**Mapped skills you should explicitly adopt:**

| Competition Skill Pack | Relevant Skills for Paparan | Gap in README |
|---|---|---|
| `anthropics/financial-services-plugins` | `competitive-analysis`, `macro-rates-monitor`, `equity-research` | Not named |
| `anthropics/knowledge-work-plugins` | `legal-risk-assessment`, `compliance`, `search-strategy`, `knowledge-synthesis`, `stakeholder-comms` | Not named |
| `anthropics/claude-cookbooks/cookbook-audit` | Audit trail, data validation for briefs | Not mentioned |
| [Bellingcat Toolkit](https://bellingcat.gitbook.io/toolkit) | Open-source intelligence (OSINT) for ASEAN regulatory document discovery | Entirely absent |

The Bellingcat toolkit is a significant omission — it's OSINT-focused and directly applicable to extracting legal/regulatory text from government sources across Southeast Asia, which is exactly what your scraper and Gov Intel agents need.

***

## Knowledge Framework — ⚠️ Moderate Gap

Your README references LangMem for cross-session memory and PGVector for RAG, but the competition points to:

- **Context engineering for agents** ([LangChain blog](https://www.langchain.com/blog/context-engineering-for-agents)) — your cache-first RAG (0.85 cosine threshold) is a good start, but the README lacks any mention of structured context window management, prompt compression, or dynamic context prioritization.
- **LangGraph Graph API** ([docs](https://docs.langchain.com/oss/python/langgraph/graph-api)) — your orchestrator.py uses LangGraph, but the README doesn't describe the graph topology (nodes, edges, conditional routing), which the competition likely expects to be documented.
- **Zep temporal knowledge graph** ([arXiv 2501.13956](https://arxiv.org/html/2501.13956v1)) — this paper describes a bi-temporal knowledge graph architecture that outperforms MemGPT on memory benchmarks. Your current LangMem + PGVector setup is a flat vector store; **there is no temporal entity-relationship graph**. For regulatory intelligence where laws are amended over time, this is a meaningful architectural gap.

***

## RDTII Regulatory Extraction — ❌ Critical Gap

This is the most important miss. The competition explicitly requires:

> *"automatically extract legal text and map regulatory evidence using the RDTII framework — at minimum Pillar 6 (Digital Trade Facilitation) and Pillar 7 (E-Commerce Legal Framework)"*

Your README has **zero mention** of:
- **RDTII** (Regional Digital Trade Integration Index) or any UN framework
- Legal text extraction pipelines (regex, NER, or LLM-based clause parsing)
- Regulatory evidence mapping to structured pillars/indicators
- Any ontology that represents `Regulation → Pillar → Country → Score`

Your Palantir ontology stubs (`get_policy_document`, `get_regulation`, `get_entity`) are the closest conceptual match, but they're stubs with no RDTII mapping logic. You would need a new agent or tool layer — likely a **Regulatory Extraction Agent** — that:
1. Fetches legal text from your gov sources (`parliament.gov.my`, `dpr.go.id`, etc.)
2. Uses Claude to extract clause-level evidence mapped to RDTII Pillar 6/7 indicators
3. Stores results as structured `RegulatoryEvidence` objects in your Supabase schema

***

## Summary of Required Changes

- **Add** explicit skill names to `install_skills.sh` from the `financial-services-plugins` and `knowledge-work-plugins` packs (especially `legal-risk-assessment`, `compliance`, `search-strategy`)
- **Integrate** Bellingcat OSINT toolkit into scraper/Gov Intel agent for regulatory document discovery
- **Document** the LangGraph graph topology (node types, conditional edges, state schema) in the README
- **Upgrade** memory layer: consider Zep/Graphiti over flat LangMem + PGVector for temporal regulatory tracking
- **Build** a dedicated RDTII Regulatory Extraction layer: new agent + `rdtii_tools.py` + schema for Pillar 6/7 indicator mapping — this is non-negotiable for the competition

Paparan.ai can be enhanced to better serve Bappenas' national planning mandates, ASEAN diplomats' real-time needs, and policymakers' focus on evidence-based decisions like RPJMN/RPJPN alignment and digital trade integration.

## Bappenas-Specific Enhancements

Bappenas coordinates Indonesia's medium/long-term development plans (RPJMN/RPJPN), macroeconomic frameworks, infrastructure PPPs, and SDG/SDI indicators. [avpn](https://avpn.asia/organisation/ministry-of-national-development-planning-bappenas/)

- Integrate **RPJMN/RPJPN tracking agent**: Automatically scan feeds for policy alignments/misalignments with Indonesia's 2025-2029 plans; generate briefs scoring initiatives against Bappenas' 19 core functions (e.g., sustainable growth, poverty reduction). [crpg](https://crpg.info/how-does-perpres-195-2024-structure-bappenas-as-national-planning-authority/)
- Add **PPP/infrastructure analyst**: Enrich briefs with World Bank/ADB data on ASEAN projects, flagging funding gaps for Bappenas' international cooperation role. [flokq](https://www.flokq.com/poi/embassy-and-government-office/dki-jakarta/central-jakarta/ministry-of-national-development-planning/en)
- Embed **SDG/SDI ontology**: Wire Palantir stubs to map ASEAN policies to UN Sustainable Development Goals and SDI indicators, prioritizing Bappenas' evidence-based think-tank outputs. [avpn](https://avpn.asia/organisation/ministry-of-national-development-planning-bappenas/)

## Diplomat Workflow Optimizations

Indonesian diplomats handle high-volume cables needing quick analysis, as seen in MoFA's ML tools and Singapore's custom AI for briefings. [unglobalpulse](https://www.unglobalpulse.org/project/machine-learning-speeds-up-indonesias-foreign-policy-decision-making/)

- Build **diplomatic cable RAG**: SSE-streaming chat for querying classified ASEAN dispatches (via Supabase secure threads); auto-categorize by topic (e.g., trade negotiations). [unglobalpulse](https://www.unglobalpulse.org/project/machine-learning-speeds-up-indonesias-foreign-policy-decision-making/)
- Add **real-time briefing generator**: Daily ASEAN updates with speech drafts, stakeholder maps, and economic intelligence summaries — inspired by Singapore's "second brain" diplomat AI. [inet.detik](https://inet.detik.com/cyberlife/d-8461953/keren-menlu-singapura-coding-ai-sendiri-buat-bantu-tugas-diplomasi)
- Include **economic diplomacy tools**: OSINT from Bellingcat for competitor intel; Tavily extensions for embassy reports on trade barriers. [perpustakaan.kemlu.go](https://perpustakaan.kemlu.go.id/index.php?p=show_detail&id=302)

## ASEAN Policy Intelligence Upgrades

Policymakers need tools for consensus-building, digital trade standards, and regional harmonization amid ASEAN's flexible "ASEAN Way." [youtube](https://www.youtube.com/watch?v=aglCxNrG90w)

| Priority Area | Enhancement | Rationale [Source] |
|---------------|-------------|--------------------|
| Digital Trade (RDTII) | RDTII Pillar 6/7 extractor agent; map regulations to ASEAN DTS Roadmap (endorsed 2025). | Harmonizes standards, boosts GDP by $158B. [youtube](https://www.youtube.com/watch?v=aglCxNrG90w) |
| Regional Consensus | Multi-stakeholder simulator: Predict ASEAN negotiation outcomes using LangGraph branching. | Supports Bappenas' sync with neighbors. [internationalaffairs.org](https://www.internationalaffairs.org.au/australianoutlook/beyond-the-asean-way-rethinking-the-regions-policymaking-process/) |
| Alerts & Watchlists | Cron-triggered notifications for RPJPN-impacting events (e.g., Vietnam/Philippines reforms). | Enables proactive diplomacy. [ejidc](https://www.ejidc.org/archive/view_article?pid=jidc-19-2-89) |

## Security & Usability Boosts

Enhance government-grade features for sensitive users.

- **Multi-language support**: Bahasa Indonesia/English auto-translation via Claude; ASEAN language summaries.
- **Mobile-first dashboard**: React Native companion app for diplomats; offline brief access.
- **Audit & export**: PDF briefs with Palantir ontology validation; export to Bappenas planning formats. [policy.asiapacificenergy](https://policy.asiapacificenergy.org/sites/default/files/Regulation%20of%20the%20Minister%20of%20National%20Development%20Planning%20No.%202%20of%202017%20(EN).pdf)

## Comprehensive Paparan.ai Enhancements for Bappenas, Policymakers & Diplomats

These enhancements transform Paparan.ai into a **Bappenas-native policy intelligence platform**, emphasizing RPJMN/RPJPN alignment, ASEAN consensus simulation, RDTII digital trade mapping, and diplomatic workflows. They leverage Anthropic's Agent Skills ecosystem (via skills.sh and Claude Code), with 15+ specific skills recommended for installation. Implementation prioritizes low-effort stubs-to-production upgrades using your existing LangGraph + DeepAgents backbone.

All enhancements maintain **government-grade privacy** (JWT-tagged threads, no data leakage) and add **Bahasa Indonesia** support via Claude translation.

***

## 1. Core Architecture Upgrades

### LangGraph Enhancements
Extend `orchestrator.py` with **Bappenas-specific graph nodes**:

```
New Graph Topology:
orchestrator.py (LangGraph)
├── RPJMN Alignment Agent (new)          ← Scans policies vs. Indonesia's 2025-2029 plans
├── RDTII Extractor Agent (new)          ← Pillar 6/7 legal mapping (UN framework)
├── Consensus Simulator (new)            ← ASEAN negotiation branching
├── Diplomatic Briefer (enhanced)        ← Speech drafts + stakeholder maps
├── Existing: Scraper → Gov Intel → Analyst → RAG
↓
Supabase (add tables: rpjmn_alignments, rdt ii_evidence, consensus_scenarios)
```

**Code Stub** (add to `backend/app/agents/orchestrator.py`):
```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
from agents.rpjmn_aligner import rpjmn_agent  # New import

class BappenasState(TypedDict):
    query: str
    rpjmn_score: float  # Alignment score 0-1
    rdt ii_pillars: dict  # {"pillar6": evidence_list}
    consensus_scenarios: list[str]

workflow = StateGraph(BappenasState)
workflow.add_node("rpjmn", rpjmn_agent)
workflow.add_conditional_edges("gov_intel", decide_rpjmn, {"rpjmn": "rpjmn", "continue": "analyst"})
```

### Supabase Schema Additions
Run new migration `003_bappenas_schema.sql`:
```sql
-- rpjmn_priorities: Bappenas' 19 core functions from Perpres 195/2024
CREATE TABLE rpjmn_priorities (
    id UUID PRIMARY KEY,
    pillar TEXT,  -- e.g., "sustainable_growth", "poverty_reduction"
    indicators JSONB,  -- SDI/SDG metrics
    target_2029 DECIMAL
);

-- rdt ii_evidence
CREATE TABLE rdt ii_evidence (
    id UUID PRIMARY KEY,
    pillar INTEGER,  -- 6: Facilitation, 7: E-commerce
    country TEXT,    -- "ID", "SG", etc.
    regulation TEXT,
    clauses JSONB,   -- Extracted legal text
    embedding VECTOR(1536)  -- Voyage-3
);

-- consensus_scenarios (temporal KG via Zep integration)
CREATE TABLE scenarios (
    thread_id UUID,
    scenario TEXT,
    probability DECIMAL,
    stakeholders JSONB  -- {"VN": "oppose", "MY": "support"}
);
```

***

## 2. AI Agent Enhancements (5 New/Upgraded Agents)

| Agent Name | Purpose | DeepAgents Config | Key Tools | Priority |
|------------|---------|-------------------|-----------|----------|
| **RPJMN Aligner** (New) | Scores policies against Bappenas RPJMN 2025-2029 (sustainable growth, infrastructure PPPs, SDGs). | `create_deep_agent(model="claude-opus-4-5", skills=["policy-alignment", "sdg-mapping"])` | `get_rpjmn_indicator()`, Supabase retriever, ADB/World Bank APIs. | High  [crpg](https://crpg.info/how-does-perpres-195-2024-structure-bappenas-as-national-planning-authority/) |
| **RDTII Extractor** (New) | Extracts/maps legal text to UN RDTII Pillars 6/7 from ASEAN gov sites. | `create_deep_agent(..., skills=["legal-extraction", "regulatory-mapping"])` | `parse_regulation()`, Tavily gov scraper, PostGIS for trade corridors. | Critical  [asean](https://asean.org/book/roadmap-on-digital-trade-standards-in-asean/) |
| **Consensus Simulator** (New) | Branches ASEAN negotiation outcomes (e.g., "If VN blocks Pillar 7?"). | LangGraph multi-path + Monte Carlo sim. | `simulate_stakeholders()`, temporal KG query. | High  [internationalaffairs.org](https://www.internationalaffairs.org.au/australianoutlook/beyond-the-asean-way-rethinking-the-regions-policymaking-process/) |
| **Diplomatic Briefer** (Upgrade Gov Intel) | Generates speech drafts, cables, stakeholder maps. | Enhanced with diplomat skills. | `generate_speech()`, embassy OSINT. | Medium  [inet.detik](https://inet.detik.com/cyberlife/d-8461953/keren-menlu-singapura-coding-ai-sendiri-buat-bantu-tugas-diplomasi) |
| **PPP Analyst** (Upgrade Financial) | Flags infrastructure gaps/funding for Bappenas PPPs. | `... skills=["ppp-evaluation", "macro-rates"]` | World Bank API, spatial enrichment. | Medium  [avpn](https://avpn.asia/organisation/ministry-of-national-development-planning-bappenas/) |

**Deployment**: Add to `backend/app/agents/`; trigger via new `/api/bappenas` endpoint.

***

## 3. Anthropic Agent Skills Integration (18 Recommended Skills)

Install via `backend/scripts/install_skills.sh` — prioritizes skills.sh packs for policy/diplomacy. Custom Bappenas skills go in `backend/app/tools/bappenas_skills/`.

### Pre-Built Anthropic Skills (Install All) [platform.claude](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
| Skill Name | skills.sh Pack/Source | Use Case in Paparan |
|------------|-----------------------|---------------------|
| `pptx-workflows` | officialskills.sh/anthropics | Export briefs as Bappenas PPTs (RPJMN slides). |
| `excel-workflows` | officialskills.sh/anthropics | SDG/SDI scorecards; RDTII Pillar matrices. |
| `pdf-workflows` | officialskills.sh/anthropics | Regulatory evidence PDFs with OCR on scanned laws. |
| `webapp-testing` | anthropics/skills repo | Test ASEAN portal scrapers. |

### Enterprise/Policy Skills (From skills.sh/anthropics packs) [github](https://github.com/anthropics/skills)
| Skill Name | Pack | Instructions Snippet | Bappenas Mapping |
|------------|------|----------------------|------------------|
| `policy-alignment` | knowledge-work-plugins | "Align text to national plans like RPJMN; score 0-1 with evidence." | RPJMN agent core. |
| `legal-extraction` | financial-services-plugins | "Parse regulations: extract clauses, map to frameworks (e.g., RDTII)." | RDTII extractor. |
| `sdg-mapping` | knowledge-work-plugins | "Map policies to SDG/SDI indicators; cite UN sources." | All agents. |
| `regulatory-mapping` | claude-cookbooks/cookbook-audit | "Audit compliance; flag Pillar 6/7 gaps." | Consensus sim. |
| `macro-rates-monitor` | financial-services-plugins | "Track ASEAN macro indicators (IMF/World Bank)." | PPP analyst. |
| `stakeholder-comms` | knowledge-work-plugins | "Draft diplomatic notes/speeches." | Diplomatic briefer. |
| `search-strategy` | knowledge-work-plugins | "OSINT for gov docs (Bellingcat-inspired)." | Scraper upgrade. |
| `compliance` | financial-services-plugins | "Check ASEAN harmonization risks." | Gov Intel. |

### Custom Bappenas Skills (Create New)
Create `SKILL.md` files in `backend/app/tools/bappenas_skills/` (per [Anthropic guide]): [resources.anthropic](https://resources.anthropic.com/hubfs/The-Complete-Guide-to-Building-Skill-for-Claude.pdf)

1. **rpjmn-evaluator**:
   ```
   name: rpjmn-evaluator
   description: Evaluate ASEAN policies against Indonesia's RPJMN 2025-2029 pillars (sustainable growth, poverty, infrastructure). Output: score, gaps, recommendations. Use when query mentions "RPJMN", "Bappenas", or national planning.
   resources: rpjmn_2029.json (19 pillars from Perpres 195/2024)
   ```

2. **asean-consensus**:
   ```
   name: asean-consensus
   description: Simulate 3 negotiation scenarios for ASEAN policy (e.g., digital trade). Factors: country positions, consensus probability. Invoke for "negotiation", "diplomat", "consensus".
   ```

3. **rdtii-pillar6-7**:
   ```
   name: rdt ii-pillar6-7
   description: Extract evidence from legal text for RDTII Pillar 6 (Facilitation) & 7 (E-commerce). Map to ASEAN DTS Roadmap.
   ```

**Install Script Update** (`scripts/install_skills.sh`):
```bash
skills.sh install anthropics/knowledge-work-plugins anthropics/financial-services-plugins
skills.sh install --custom backend/app/tools/bappenas_skills/
```

***

## 4. Frontend & UX Enhancements (React Pages)

Add to `src/pages/`:

- **BappenasDashboardPage.tsx**: RPJMN scorecard widget (TanStack Query + Zustand); RDTII heatmap.
- **DiplomatBriefsPage.tsx**: Mobile-optimized; speech export to PPT/PDF.
- **ConsensusSimulatorPage.tsx**: Interactive branching UI (React Flow).

**New Components**:
- `RDTIIVisualizer`: D3 chart of Pillar scores across ASEAN.
- `RPJMNAlignmentGauge`: Radial chart (0-100% alignment).

***

## 5. Tools & Data Pipeline Upgrades

### New Tools (`backend/app/tools/`):
- `bappenas_tools.py`: `get_rpjmn_pillar(query)`, `score_alignment(evidence)`.
- `rdtii_tools.py`: `extract_pillar6(text)`, `extract_pillar7(text)`.
- `diplomatic_tools.py`: `generate_speech(topic, audience)`.

### Data Sources Expansion:
- **Primary**: Add `bappenas.go.id`, `kemlu.go.id` (MoFA), ASEAN DTS portal.
- **Tier 1**: ADB PPP database, UN RDTII datasets.

**Cron**: Daily RPJMN/RDTII refresh (`0 6 * * *` WIB).

***

## 6. Deployment & Security Roadmap

| Phase | Tasks | Timeline |
|-------|-------|----------|
| **Week 1** | Skills install, RPJMN agent stub, schema migration. | Deploy to Railway/Vercel. |
| **Week 2** | RDTII extractor + custom skills. | Test with Perpres 195/2024 docs. |
| **Week 3** | Consensus sim + diplomat UI. | Bappenas pilot (secure Supabase project). |
| **Ongoing** | Zep temporal KG; Bahasa translation layer. | Monitor via LangSmith. |

**Security**: Resource-level auth tags `org="bappenas"`; export logs for audit.

This blueprint makes Paparan.ai the **ASEAN policy gold standard**, directly addressing Bappenas' Perpres 195/2024 mandate and diplomat needs like Singapore's AI tools. Total effort: ~2-3 weeks for MVP. [crpg](https://crpg.info/how-does-perpres-195-2024-structure-bappenas-as-national-planning-authority/)