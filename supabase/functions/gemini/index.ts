// ─────────────────────────────────────────────────────────────────────────────
// CELESTIA — GEMINI PROXY (Supabase Edge Function)
//
// Purpose: keep the Google Gemini API key OFF the device. The mobile app talks
// to this function with a fixed app token; this function injects the real Gemini
// key (stored as the GEMINI_API_KEY secret) and transparently forwards the
// request to Google's Generative Language API — including SSE streaming.
//
// The app's @google/genai client is pointed at this function via
// httpOptions.baseUrl, so the SDK builds the usual `/v1beta/models/...` paths and
// this function relays them 1:1. No request/response shape changes are needed.
//
// NOTE: the gate compares against ALLOWED_APP_TOKEN below, NOT the auto-injected
// SUPABASE_ANON_KEY — that env var no longer matches the legacy anon key the app
// sends (Supabase API-key migration), which caused 401s. ALLOWED_APP_TOKEN is the
// app's public anon key; it is NOT a secret (it ships in the bundle) and only
// serves to block drive-by callers. The only real secret is GEMINI_API_KEY.
//
// Deploy: dashboard → Edge Functions → gemini → Code → paste → Deploy
//         (or `supabase functions deploy gemini`)
// ─────────────────────────────────────────────────────────────────────────────

const GEMINI_BASE = "https://generativelanguage.googleapis.com";

// Public app token the client must present (apikey or Authorization: Bearer).
// Matches SUPABASE_ANON_KEY in src/services/supabase/client.js — keep in sync.
const ALLOWED_APP_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dGV4ZGtodW96dWZmZmd4c3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDAwOTAsImV4cCI6MjA4ODUxNjA5MH0.z6qA3FqIjNaaqTXPKkbiCI1xEk_9f43KDlOKlcf_hkA";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-goog-api-key",
};

// Strip the Supabase function mount prefix so we're left with the bare Gemini
// path. Handles both gateway styles:
//   /functions/v1/gemini/v1beta/models/...   (project URL)
//   /gemini/v1beta/models/...                (functions subdomain)
function geminiPath(pathname: string): string {
  let p = pathname
    .replace(/^\/functions\/v1\/gemini/, "")
    .replace(/^\/gemini/, "");
  if (!p.startsWith("/")) p = "/" + p;
  return p;
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // ── Lightweight gate ──────────────────────────────────────────────────────
  const presented =
    req.headers.get("apikey") ||
    (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (presented !== ALLOWED_APP_TOKEN) {
    return json({ error: "Unauthorized" }, 401);
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) {
    return json({ error: "GEMINI_API_KEY secret is not set" }, 500);
  }

  try {
    // ── Build upstream URL ──────────────────────────────────────────────────
    const incoming = new URL(req.url);
    const target = new URL(GEMINI_BASE + geminiPath(incoming.pathname));
    // Forward query params, but drop any client-supplied key — we inject ours.
    for (const [k, v] of incoming.searchParams) {
      if (k.toLowerCase() === "key") continue;
      target.searchParams.set(k, v);
    }

    // ── Forward ───────────────────────────────────────────────────────────
    const upstreamHeaders = new Headers();
    upstreamHeaders.set("Content-Type", "application/json");
    upstreamHeaders.set("x-goog-api-key", geminiKey);

    const upstream = await fetch(target.toString(), {
      method: req.method,
      headers: upstreamHeaders,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : await req.text(),
    });

    // Stream the body straight through (handles SSE streamGenerateContent).
    const respHeaders = new Headers(CORS_HEADERS);
    respHeaders.set(
      "Content-Type",
      upstream.headers.get("Content-Type") ?? "application/json",
    );
    return new Response(upstream.body, {
      status: upstream.status,
      headers: respHeaders,
    });
  } catch (err) {
    return json({ error: "Proxy upstream error", detail: String(err) }, 502);
  }
});
