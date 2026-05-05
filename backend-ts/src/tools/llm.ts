import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// Shared LLM client — prefers z.ai, falls back to Anthropic
const zai = process.env.ZAI_API_KEY
  ? new OpenAI({ apiKey: process.env.ZAI_API_KEY, baseURL: "https://api.z.ai/api/paas/v4/" })
  : null;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  baseURL: process.env.ANTHROPIC_BASE_URL ?? "https://api.z.ai/api/anthropic/",
});

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-5";

export async function llm(system: string, prompt: string): Promise<string> {
  if (zai) {
    const res = await zai.chat.completions.create({
      model: process.env.ZAI_MODEL ?? "glm-5.1",
      max_tokens: 8192,
      messages: [{ role: "system", content: system }, { role: "user", content: prompt }],
    });
    const msg = res.choices[0]?.message as { content?: string; reasoning_content?: string };
    return msg?.content ?? msg?.reasoning_content ?? "";
  }
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system,
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content[0];
  return block.type === "text" ? block.text : "";
}

// Tavily search
export async function tavilySearch(query: string, maxResults = 5): Promise<string> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return "";
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: key, query, max_results: maxResults, topic: "news" }),
  });
  if (!res.ok) return "";
  const data = await res.json() as { results?: Array<{ title: string; url: string; content: string }> };
  return (data.results ?? []).map(r => `[${r.title}](${r.url})\n${r.content}`).join("\n\n");
}

// pasal.id — Indonesian legal database
export async function pasalSearch(query: string): Promise<string> {
  const token = process.env.PASAL_API_TOKEN;
  if (!token) return "";
  const res = await fetch(`https://api.pasal.id/v1/search?q=${encodeURIComponent(query)}&limit=3`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return "";
  const data = await res.json() as { results?: Array<{ title: string; content: string; url: string }> };
  return (data.results ?? []).map(r => `[${r.title}](${r.url})\n${r.content}`).join("\n\n");
}

// Citation verifier — checks if excerpt appears verbatim in source
export async function verifyCitation(sourceUrl: string, excerpt: string): Promise<boolean> {
  try {
    const res = await fetch(sourceUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return false;
    const text = await res.text();
    // Normalize whitespace for comparison
    const normalize = (s: string) => s.replace(/\s+/g, " ").toLowerCase().trim();
    return normalize(text).includes(normalize(excerpt.slice(0, 100)));
  } catch {
    return false;
  }
}
