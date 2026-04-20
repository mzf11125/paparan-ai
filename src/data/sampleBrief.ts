import { Paparan } from "@/types/paparan";

export const samplePaparan: Paparan = {
  id: "brief-2026-04-17-asean-trade",
  title: "Vietnam-Indonesia Tariff Dispute",
  date: "17 April 2026",
  region: "ASEAN",
  classification: "official",
  lastUpdated: "17 April 2026 14:30 JKT",
  executiveSummary: [
    "Vietnam imposed 15% tariff on processed food imports from Indonesia.",
    "Bilateral trade volume declined 8% in Q1 2026.",
    "Indonesia requested ASEAN consultations under dispute mechanism.",
    "Domestic lobbying intensifies; potential for retaliatory measures.",
    "RCEP dispute settlement identified as resolution pathway."
  ],
  currentSituation: "Indonesia and Vietnam trade relations have entered a period of friction following Vietnam's unexpected implementation of a 15% tariff on processed food imports from Indonesia, effective April 1, 2026. The tariff, announced via Circular No. 12/2026/TT-BCT, specifically targets products with Indonesian content exceeding 30%.\n\nInitial trade data for Q1 2026 shows an 8% decline in bilateral trade volume compared to the same period in 2025. The processed food sector, which represents approximately $2.3B in annual trade, has been most significantly affected with a 15% decline representing approximately $340M in lost value.\n\nIndonesian Ministry of Trade has formally requested consultations under ASEAN protocols, citing potential violations of the ASEAN Trade in Goods Agreement (ATIGA). Vietnamese officials have characterized the tariff as a \"temporary safeguard measure\" pending review of domestic industry concerns regarding pricing competitiveness.\n\nThe tariff has triggered increased lobbying activity from affected industry associations in both countries. The Indonesian Food and Beverage Association (GAPMMI) has called for retaliatory measures, while their Vietnamese counterpart (VAFood) has petitioned for tariff extension.",
  developments: [
    {
      id: "dev-001",
      text: "Vietnam imposed 15% tariff on processed food imports from Indonesia via Circular No. 12/2026/TT-BCT, effective April 1, 2026.",
      impact: "HIGH",
      delta: "NEW",
      sourceId: "src-001",
      date: "01 April 2026",
      entities: ["Vietnam MOIT", "Indonesia MOT"]
    },
    {
      id: "dev-002",
      text: "Q1 2026 bilateral trade volume declined 8% YoY; processed food sector dropped 15% ($340M impact).",
      impact: "HIGH",
      delta: "ESCALATED",
      sourceId: "src-003",
      date: "15 April 2026",
      entities: ["GAPMMI", "VAFood"]
    },
    {
      id: "dev-003",
      text: "Indonesia formally requested bilateral consultations under ASEAN Trade in Goods Agreement (ATIGA) Article 16.",
      impact: "MEDIUM",
      delta: "NEW",
      sourceId: "src-002",
      date: "10 April 2026",
      entities: ["ASEAN Secretariat"]
    },
    {
      id: "dev-004",
      text: "Vietnamese officials characterized tariff as \"temporary safeguard measure\" pending domestic industry review.",
      impact: "MEDIUM",
      delta: "UPDATED",
      sourceId: "src-004",
      date: "12 April 2026",
      entities: ["Vietnam MOIT"]
    },
    {
      id: "dev-005",
      text: "GAPMMI considering retaliatory measures; VAFood petitioning for tariff extension.",
      impact: "LOW",
      delta: "NEW",
      sourceId: "src-005",
      date: "14 April 2026",
      entities: ["GAPMMI", "VAFood"]
    },
    {
      id: "dev-006",
      text: "RCEP dispute settlement mechanism identified as potential resolution pathway, though unused since agreement inception.",
      impact: "MEDIUM",
      delta: "NEW",
      sourceId: "src-006",
      date: "16 April 2026",
      entities: ["RCEP Secretariat"]
    }
  ],
  implications: "The tariff signals a concerning shift toward protectionism within ASEAN trade, potentially undermining the region's commitment to economic integration established under ATIGA and reinforced by RCEP. If left unaddressed, this measure could establish a precedent for similar unilateral actions by other member states.\n\nFrom a geopolitical perspective, the dispute occurs against the backdrop of increasing US-China competition in Southeast Asia. Both countries have been courted as manufacturing alternatives by multinational firms seeking supply chain diversification. Trade friction between two of ASEAN's largest economies (combined GDP: $1.4T) could diminish the region's attractiveness as an integrated production base.\n\nThe tariff's specific targeting of processed food with 30% Indonesian content suggests potential non-tariff barrier concerns, particularly regarding rules of origin enforcement. This could have implications for broader value chain integration within ASEAN, where intermediate goods cross borders multiple times before final assembly.\n\nFor Indonesian exporters, the immediate impact is reduced competitiveness in a market that has absorbed 18% of Indonesia's processed food exports. The 15% tariff, combined with logistics costs, creates a significant price disadvantage against Vietnamese domestic producers and third-country competitors.",
  risks: [
    "Tariff becomes permanent, affecting long-term trade planning and investment decisions.",
    "SME exporters face disruption and potential business closure due to reduced competitiveness.",
    "Retaliatory measures escalate into broader trade war affecting multiple sectors.",
    "Precedent established for other ASEAN members to implement similar protectionist measures.",
    "Supply chain diversification away from ASEAN toward alternative regional arrangements."
  ],
  opportunities: [
    "Leverage RCEP dispute settlement mechanism for formal, binding resolution.",
    "Explore alternative export markets within ASEAN (Thailand, Philippines, Singapore).",
    "Negotiate product-specific exemptions or quota arrangements with Vietnamese authorities.",
    "Strengthen domestic processing capacity to reduce reliance on exports and capture more value domestically.",
    "Engage ASEAN Secretariat for clarificatory guidance on ATIGA compliance and rules of origin."
  ],
  actions: [
    {
      priority: "HIGH",
      text: "Engage Ministry of Trade to formalize consultation request under ATIGA Article 16 within 5 working days.",
      owner: "Trade Policy Division",
      deadline: "22 April 2026"
    },
    {
      priority: "HIGH",
      text: "Conduct impact assessment on affected SMEs; prepare mitigation recommendations for cabinet review.",
      owner: "Economic Research Directorate",
      deadline: "30 April 2026"
    },
    {
      priority: "MEDIUM",
      text: "Monitor Vietnamese policy developments and domestic industry statements on daily basis.",
      owner: "Regional Desk — Vietnam",
      deadline: "Ongoing"
    },
    {
      priority: "MEDIUM",
      text: "Prepare briefing on RCEP dispute settlement mechanism viability and procedural requirements.",
      owner: "Legal Counsel",
      deadline: "25 April 2026"
    },
    {
      priority: "LOW",
      text: "Identify alternative markets for processed food exports (Thailand, Philippines, Singapore) with tariff schedules.",
      owner: "Market Intelligence Unit",
      deadline: "15 May 2026"
    }
  ],
  sources: [
    {
      id: "src-001",
      title: "Vietnam Circular No. 12/2026/TT-BCT on Safeguard Measures for Processed Food",
      url: "https://moit.gov.vn/circular-12-2026",
      confidence: "HIGH",
      date: "01 April 2026"
    },
    {
      id: "src-002",
      title: "ASEAN Trade in Goods Agreement (ATIGA) — Dispute Settlement Provisions",
      url: "https://asean.org/wp-content/uploads/2021/03/ATIGA.pdf",
      confidence: "HIGH",
      date: "N/A"
    },
    {
      id: "src-003",
      title: "Q1 2026 ASEAN Trade Statistics — Bilateral Vietnam-Indonesia",
      url: "https://aseanstats.org/trade-q1-2026",
      confidence: "HIGH",
      date: "15 April 2026"
    },
    {
      id: "src-004",
      title: "Reuters — Vietnam tariffs on Indonesian food imports spark trade dispute",
      url: "https://reuters.com/asia/vietnam-tariffs-indonesia",
      confidence: "HIGH",
      date: "05 April 2026"
    },
    {
      id: "src-005",
      title: "Jakarta Post — Ministry seeks ASEAN intervention on Vietnam tariff",
      url: "https://jakartapost.com/economy/ministry-asean-intervention",
      confidence: "MEDIUM",
      date: "11 April 2026"
    },
    {
      id: "src-006",
      title: "RCEP Economic Partnership Agreement — Chapter 18: Dispute Settlement",
      url: "https://rcepsec.org/dispute-settlement",
      confidence: "HIGH",
      date: "N/A"
    }
  ],
  tags: ["Trade Policy", "ASEAN", "Vietnam", "Indonesia", "Tariffs", "ATIGA", "RCEP", "Food Processing"]
};
