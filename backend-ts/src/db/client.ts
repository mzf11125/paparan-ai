import { createClient } from "@supabase/supabase-js";
import type { PolicyBrief } from "./schema.js";

function getClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!key) throw new Error("No Supabase key configured (SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY)");
  return createClient(process.env.SUPABASE_URL!, key);
}

export async function saveBrief(brief: PolicyBrief): Promise<void> {
  const { error } = await getClient().from("paparan_reports").upsert({
    id: brief.id,
    topic: brief.title,
    region: brief.region,
    report_type: "on_demand",
    content: brief,
    created_at: brief.date ? new Date(brief.date).toISOString() : new Date().toISOString(),
  });
  if (error) throw new Error(`Supabase save failed: ${error.message}`);
}

export async function getBriefs(region?: string): Promise<PolicyBrief[]> {
  let query = getClient()
    .from("paparan_reports")
    .select("id, topic, region, content, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (region) query = query.eq("region", region);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getBriefById(id: string): Promise<PolicyBrief | null> {
  const { data, error } = await getClient()
    .from("paparan_reports")
    .select("id, topic, region, content, created_at")
    .eq("id", id)
    .single();
  if (error) return null;
  return mapRow(data);
}

function mapRow(row: Record<string, unknown>): PolicyBrief {
  const content = row.content as Record<string, unknown> | null;
  // If content is a full PolicyBrief, use it directly
  if (content && typeof content === "object" && content.executiveSummary) {
    return { ...content, id: row.id as string } as PolicyBrief;
  }
  // Otherwise build from top-level columns
  return {
    id: row.id as string,
    title: (content?.title as string) ?? (row.topic as string) ?? "Untitled",
    date: (content?.date as string) ?? ((row.created_at as string) ?? new Date().toISOString()).split("T")[0],
    region: (content?.region as string) ?? (row.region as string) ?? "Global",
    lastUpdated: row.created_at as string | undefined,
    classification: (content?.classification as PolicyBrief["classification"]) ?? "unclassified",
    executiveSummary: (content?.executiveSummary as string[]) ?? [],
    currentSituation: (content?.currentSituation as string) ?? "",
    developments: (content?.developments as PolicyBrief["developments"]) ?? [],
    implications: (content?.implications as string) ?? "",
    risks: (content?.risks as string[]) ?? [],
    opportunities: (content?.opportunities as string[]) ?? [],
    actions: (content?.actions as PolicyBrief["actions"]) ?? [],
    sources: (content?.sources as PolicyBrief["sources"]) ?? [],
    tags: (content?.tags as string[]) ?? [],
    rpjmn_alignment: content?.rpjmn_alignment as Record<string, number> | undefined,
    rdtii_evidence: content?.rdtii_evidence as PolicyBrief["rdtii_evidence"],
    urgency_score: content?.urgency_score as number | undefined,
    confidence_score: content?.confidence_score as PolicyBrief["confidence_score"],
    diplomat_meta: content?.diplomat_meta as Record<string, unknown> | undefined,
  };
}
