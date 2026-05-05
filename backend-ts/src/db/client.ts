import { createClient } from "@supabase/supabase-js";
import type { PolicyBrief } from "./schema.js";

function getClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function saveBrief(brief: PolicyBrief): Promise<void> {
  const { error } = await getClient().from("policy_briefs").upsert({
    id: brief.id,
    title: brief.title,
    date: brief.date,
    region: brief.region,
    classification: brief.classification,
    executive_summary: brief.executiveSummary,
    current_situation: brief.currentSituation,
    developments: brief.developments,
    implications: brief.implications,
    risks: brief.risks,
    opportunities: brief.opportunities,
    actions: brief.actions,
    sources: brief.sources,
    tags: brief.tags,
    rpjmn_alignment: brief.rpjmn_alignment ?? null,
    rdtii_evidence: brief.rdtii_evidence ?? null,
    urgency_score: brief.urgency_score ?? null,
    confidence_score: brief.confidence_score ?? "MEDIUM",
    diplomat_meta: brief.diplomat_meta ?? null,
    last_updated: new Date().toISOString(),
  });
  if (error) throw new Error(`Supabase save failed: ${error.message}`);
}

export async function getBriefs(region?: string): Promise<PolicyBrief[]> {
  let query = getClient()
    .from("policy_briefs")
    .select("*")
    .order("date", { ascending: false })
    .limit(50);
  if (region) query = query.eq("region", region);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getBriefById(id: string): Promise<PolicyBrief | null> {
  const { data, error } = await getClient()
    .from("policy_briefs")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapRow(data);
}

function mapRow(row: Record<string, unknown>): PolicyBrief {
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    region: row.region as string,
    lastUpdated: row.last_updated as string | undefined,
    classification: (row.classification as PolicyBrief["classification"]) ?? "unclassified",
    executiveSummary: (row.executive_summary as string[]) ?? [],
    currentSituation: (row.current_situation as string) ?? "",
    developments: (row.developments as PolicyBrief["developments"]) ?? [],
    implications: (row.implications as string) ?? "",
    risks: (row.risks as string[]) ?? [],
    opportunities: (row.opportunities as string[]) ?? [],
    actions: (row.actions as PolicyBrief["actions"]) ?? [],
    sources: (row.sources as PolicyBrief["sources"]) ?? [],
    tags: (row.tags as string[]) ?? [],
    rpjmn_alignment: row.rpjmn_alignment as Record<string, number> | undefined,
    rdtii_evidence: row.rdtii_evidence as PolicyBrief["rdtii_evidence"],
    urgency_score: row.urgency_score as number | undefined,
    confidence_score: row.confidence_score as PolicyBrief["confidence_score"],
    diplomat_meta: row.diplomat_meta as Record<string, unknown> | undefined,
  };
}
