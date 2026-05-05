import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { createClient } from "@supabase/supabase-js";
import { runOrchestrator } from "./agents/orchestrator.js";
import { getBriefs, getBriefById } from "./db/client.js";
import type { GenerateBriefRequest } from "./db/schema.js";

const app = new Hono();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use("*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", process.env.FRONTEND_URL ?? "*");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  if (c.req.method === "OPTIONS") return c.text("", 200);
  await next();
});

// ── Auth helper ───────────────────────────────────────────────────────────────
const supabaseAdmin = () => createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY!
);

async function getUserId(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data } = await supabaseAdmin().auth.getUser(token);
  return data.user?.id ?? null;
}

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/health", (c) => c.json({ ok: true, service: "paparan-backend-ts" }));

/** GET /api/briefs?region=Indonesia */
app.get("/api/briefs", async (c) => {
  const region = c.req.query("region");
  const briefs = await getBriefs(region);
  return c.json(briefs);
});

/** GET /api/briefs/:id */
app.get("/api/briefs/:id", async (c) => {
  const brief = await getBriefById(c.req.param("id"));
  if (!brief) return c.json({ error: "Not found" }, 404);
  return c.json(brief);
});

/**
 * POST /api/paparan
 * Body: { topic, region, classification? }
 * Response: SSE stream — events: { type: "chunk"|"done"|"error", data?: PolicyBrief }
 */
app.post("/api/paparan", async (c) => {
  const userId = await getUserId(c.req.header("Authorization"));
  const body = await c.req.json<GenerateBriefRequest>();

  if (!body.topic?.trim() || !body.region?.trim()) {
    return c.json({ error: "topic and region are required" }, 400);
  }

  c.header("Content-Type", "text/event-stream");
  c.header("Cache-Control", "no-cache");

  return stream(c, async (s) => {
    await s.write(": ping\n\n");
    try {
      const brief = await runOrchestrator(body, userId ?? "anonymous");
      await s.write(`data: ${JSON.stringify({ type: "chunk", data: brief })}\n\n`);
      await s.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    } catch (err) {
      await s.write(`data: ${JSON.stringify({ type: "error", message: (err as Error).message })}\n\n`);
    }
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? "8000");
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Paparan backend running on port ${PORT}`);
});
