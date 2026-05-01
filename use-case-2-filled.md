# Use Case 2 - Brief Update: BKPM Investment Intelligence

---

## Slide A: Use Case 2 Title

**Paparan Brief**

### AI Solution for BKPM (Investment Coordinating Board)

---

## Slide B: AI Solution (Updated for Use Case 2)

### Solution Adaptation

#### What Changes from Use Case 1?
- **Core Solution:** Same multi-agent AI system adapted for investment intelligence use case
- **Key Differences:** Focus shifts from policy analysis to corporate actor tracking and investment screening

#### How AI is Applied Here
| AI Technology | Use Case 1 (Bappenas) | Use Case 2 (BKPM) |
|--------------|-------------------------|-------------------------|
| LLM (Claude) | Policy document analysis | Corporate actor identification, risk assessment |
| RAG (Tavily) | Policy news search | Investment news, regulatory changes |
| Vector Search (PGVector) | Policy semantic search | Company, investment semantic search |
| Multi-Agent | Policy synthesis agents | Investment screening, due diligence agents |

#### Why This Approach Works for This Agency
BKPM investment officers need to quickly assess corporate actors and investment proposals. AI-powered synthesis of news, filings, and compliance data reduces due diligence time from days to minutes.

---

## Slide C: Simple Architecture (Updated for Use Case 2)

### System Architecture Adaptation

```
┌─────────────────────────────────────────────────┐
│                   User Interface                        │
│            (BKPM Investment Officers)                          │
└─────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────┐
│                  API Layer                            │
│              [BKPM OSS integration endpoint]                      │
└─────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────┐
│              AI / ML Services                          │
│    [Investment screening agent]                         │
│    [Corporate actor tracking agent]                     │
│    [Risk assessment agent]                            │
└─────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────┐
│                Data Layer                             │
│    [BKPM OSS database]                              │
│    [OpenCorporates integration]                       │
│    [Investment news feed]                             │
└─────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────┐
│          BKPM Systems (Integration)                      │
│    (Online Single Submission - OSS)                       │
└─────────────────────────────────────────────────┘
```

#### Integration Differences
- **New Integration:** BKPM OSS (Online Single Submission) API for real-time investment data
- **Data Flow Changes:** Focus on corporate entities, investment records, and licensing status vs policy documents

---

## Slide D: Selected Use Case

### Problem Statement for Use Case 2

#### Problem Owner
**BKPM (Badan Koordinasi Penanaman Modal - Investment Coordinating Board)**

#### The Specific Challenge
- Investment officers must conduct due diligence on hundreds of proposals
- Corporate actor information is scattered across multiple sources
- Time-sensitive decisions require fast, accurate intelligence
- Manual research leads to incomplete risk assessment

#### How Our Solution Addresses It
| Challenge | Our Solution | Expected Outcome |
|-----------|--------------|-----------------|
| Scattered corporate data | Centralized AI synthesis from multiple sources | Complete corporate profiles |
| Time-consuming research | Automated information gathering | 80% faster due diligence |
| Incomplete risk assessment | AI-powered risk flagging | Better risk coverage |
| Manual tracking | Automatic change alerts on monitored companies | Real-time updates |

---

## Slide E: Expected Impact (Updated for Use Case 2)

### Impact Metrics for BKPM

#### Quantitative Impact
| Metric | Current State | Target State | Improvement |
|--------|---------------|--------------|--------------|
| Due Diligence Time | 3-7 days | 4-8 hours | 75% reduction |
| Corporate Data Coverage | Manual search limits | 10+ sources per company | 3x increase |
| Risk Detection Accuracy | Human-dependent analysis | AI + human review | Higher consistency |
| Proposal Processing Time | Variable | Standardized format | Predictable turnaround |

#### Qualitative Impact for BKPM
- **For Investment Officers:** Faster, more complete due diligence
- **For Agency:** Better investment decisions with comprehensive intelligence
- **For Investors:** Clearer investment environment with consistent data

#### Scale and Replication Potential
- **Initial Scope:** BKPM investment officers and analysts
- **Replication Potential:** Other investment agencies, regional ASEAN investment boards

---

## End of Use Case 2 Brief

---

# Quick Reference - Problem Owner: BKPM

Based on program information:

| Agency | Domain | Key Services |
|---------|---------|--------------|
| **BKPM** | Investment | Investment licensing, investment promotion, investor services, OSS (Online Single Submission) |

---

**Note:** This brief update focuses specifically on how Paparan Brief adapts to BKPM's investment intelligence needs while maintaining the same core AI architecture.
