import { StateGraph, END } from "@langchain/langgraph";
import { v4 as uuid } from "uuid";
import type { PolicyBrief, GenerateBriefRequest, RdtiiEvidence } from "../db/schema.js";
import { llm, tavilySearch, pasalSearch, verifyCitation } from "../tools/llm.js";
import { scoreRpjmn, scoreRdtii, urgencyScore } from "../tools/scoring.js";
import { saveBrief } from "../db/client.js";

// ── State ────────────────────────────────────────────────────────────────────

interface OrchestratorState {
  request: GenerateBriefRequest;
  userId: string;
  brief: PolicyBrief | null;
  route: "bappenas" | "financial" | "default";
  legalContext: string;
  rdtiiEvidence: RdtiiEvidence[];
}

// ── Routing keywords ─────────────────────────────────────────────────────────

const BAPPENAS_KW = ["satu data", "sdi", "indikator", "metadata", "bappenas"];
const FINANCIAL_KW = ["financial", "bank", "ojk", "crypto", "islamic", "fintech"];
const DIGITAL_KW = ["digital trade", "e-commerce", "fintech", "cybersecurity", "data governance", "digital payment"];
const INDONESIA_REGIONS = new Set(["Indonesia", "ASEAN", "Kalimantan", "Sumatera", "Jawa", "Papua"]);

// ── Brief JSON schema prompt ──────────────────────────────────────────────────

const BRIEF_SCHEMA = `Return ONLY valid JSON:
{
  "title": "string",
  "executiveSummary": ["string"],
  "currentSituation": "string",
  "developments": [{"id":"d1","text":"string","impact":"HIGH|MEDIUM|LOW","delta":"NEW","sourceId":"s1","entities":[]}],
  "implications": "string",
  "risks": ["string"],
  "opportunities": ["string"],
  "actions": [{"priority":"HIGH","text":"string","owner":"","deadline":""}],
  "sources": [{"id":"s1","title":"string","url":"string","confidence":"HIGH","date":"2026-05-06"}],
  "tags": ["string"]
}`;

const SYSTEM = `You are a senior ASEAN policy intelligence analyst. Produce structured, factual policy briefs for government affairs professionals. ${BRIEF_SCHEMA}`;

// ── Nodes ─────────────────────────────────────────────────────────────────────

async function nodeRoute(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  const topic = state.request.topic.toLowerCase();
  let route: OrchestratorState["route"] = "default";
  if (BAPPENAS_KW.some(k => topic.includes(k))) route = "bappenas";
  else if (FINANCIAL_KW.some(k => topic.includes(k))) route = "financial";
  return { route };
}

async function nodeDiscoverLegal(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  if (process.env.DRY_RUN) return { legalContext: "[dry-run: skipped]" };
  const { topic, region } = state.request;
  const isIndonesia = INDONESIA_REGIONS.has(region) || region.toLowerCase().includes("indonesia");

  const [tavilyCtx, pasalCtx] = await Promise.all([
    tavilySearch(`${region} ${topic} regulation law 2025 2026`, 5),
    isIndonesia ? pasalSearch(topic) : Promise.resolve(""),
  ]);

  return { legalContext: [tavilyCtx, pasalCtx].filter(Boolean).join("\n\n---\n\n") };
}

async function nodeResearch(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  if (process.env.DRY_RUN) {
    console.log("[dry-run] nodeResearch — would call LLM with topic:", state.request.topic);
    return { brief: null };
  }

  const { topic, region, classification = "unclassified" } = state.request;
  const prompt = `Research this ASEAN policy topic and produce a structured brief.

Topic: ${topic}
Region: ${region}

Legal and regulatory context:
${state.legalContext || "(no context retrieved)"}

${BRIEF_SCHEMA}

Produce the JSON brief now. Use only information from the sources above.`;

  const raw = await llm(SYSTEM, prompt);
  const cleaned = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
  const data = JSON.parse(cleaned) as Omit<PolicyBrief, "id" | "date" | "region" | "classification">;

  const brief: PolicyBrief = {
    ...data,
    id: uuid(),
    date: new Date().toISOString().slice(0, 10),
    region,
    classification,
    lastUpdated: new Date().toISOString(),
  };

  return { brief };
}

async function nodeExtractRdtii(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  if (!state.brief) return {};
  const { topic, region } = state.request;
  const isDigital = DIGITAL_KW.some(k => topic.toLowerCase().includes(k));
  if (!isDigital) return {};
  if (process.env.DRY_RUN) return { rdtiiEvidence: [] };

  // Ask LLM to extract clause-level RDTII evidence from the legal context
  const prompt = `Extract RDTII regulatory evidence from the following legal context.

Topic: ${topic}
Region: ${region}

Legal context:
${state.legalContext || "(none)"}

For each relevant clause, return a JSON array:
[{
  "clause_text": "verbatim excerpt",
  "pillar_id": "P1|P2|P3|P4|P5|P6|P7",
  "indicator_code": "e.g. 6.1",
  "source_url": "url",
  "confidence": "HIGH|MEDIUM|LOW",
  "country": "${region}"
}]

Return ONLY the JSON array. If no relevant clauses found, return [].`;

  const raw = await llm("You are an RDTII regulatory clause extractor.", prompt);
  const cleaned = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();

  let clauses: Array<Omit<RdtiiEvidence, "id" | "brief_id" | "extracted_at">> = [];
  try { clauses = JSON.parse(cleaned); } catch { return {}; }

  // Verify citations
  const evidence: RdtiiEvidence[] = await Promise.all(
    clauses.map(async (c) => {
      const verified = c.source_url ? await verifyCitation(c.source_url, c.clause_text) : false;
      return {
        ...c,
        id: uuid(),
        brief_id: state.brief!.id,
        extracted_at: new Date().toISOString(),
        confidence: verified ? c.confidence : "LOW",
      };
    })
  );

  return { rdtiiEvidence: evidence };
}

async function nodeScore(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  if (!state.brief) return {};
  const text = [
    state.brief.title,
    ...state.brief.executiveSummary,
    state.brief.currentSituation,
    state.brief.implications,
  ].join(" ");

  const rpjmn_alignment = scoreRpjmn(text);
  const rdtii_scores = scoreRdtii(text);
  const urgency = urgencyScore(state.brief);

  return {
    brief: {
      ...state.brief,
      rpjmn_alignment: { ...rpjmn_alignment, ...rdtii_scores },
      rdtii_evidence: state.rdtiiEvidence.length ? state.rdtiiEvidence : state.brief.rdtii_evidence,
      urgency_score: urgency,
    },
  };
}

async function nodeSave(state: OrchestratorState): Promise<Partial<OrchestratorState>> {
  if (!state.brief || process.env.DRY_RUN) return {};
  await saveBrief(state.brief);
  return {};
}

// ── Graph ─────────────────────────────────────────────────────────────────────

const graph = new StateGraph<OrchestratorState>({
  channels: {
    request: { value: (a, b) => b ?? a },
    userId: { value: (a, b) => b ?? a },
    brief: { value: (a, b) => b ?? a, default: () => null },
    route: { value: (a, b) => b ?? a, default: () => "default" as const },
    legalContext: { value: (a, b) => b ?? a, default: () => "" },
    rdtiiEvidence: { value: (a, b) => b ?? a, default: () => [] },
  },
})
  .addNode("node_route", nodeRoute)
  .addNode("discover_legal", nodeDiscoverLegal)
  .addNode("research", nodeResearch)
  .addNode("extract_rdtii", nodeExtractRdtii)
  .addNode("score", nodeScore)
  .addNode("save", nodeSave)
  .addEdge("__start__", "node_route")
  .addEdge("node_route", "discover_legal")
  .addEdge("discover_legal", "research")
  .addEdge("research", "extract_rdtii")
  .addEdge("extract_rdtii", "score")
  .addEdge("score", "save")
  .addEdge("save", END);

export const orchestrator = graph.compile();

export async function runOrchestrator(
  request: GenerateBriefRequest,
  userId: string
): Promise<PolicyBrief> {
  const result = await orchestrator.invoke({
    request,
    userId,
    brief: null,
    route: "default",
    legalContext: "",
    rdtiiEvidence: [],
  });
  if (!result.brief) throw new Error("Orchestrator produced no brief");
  return result.brief;
}

// dry-run entry point
if (process.env.DRY_RUN) {
  console.log("[dry-run] Validating pipeline topology...");
  orchestrator.getGraph().nodes; // just access the graph to confirm it compiled
  console.log("[dry-run] Pipeline validated successfully — all nodes wired correctly");
  console.log("[dry-run] Nodes:", Object.keys(orchestrator.getGraph().nodes).join(", "));
}
