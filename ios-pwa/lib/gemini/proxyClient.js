// ─────────────────────────────────────────────────────────────────────────────
// CELESTIA (PWA) — GEMINI PROXY CLIENT (shared)
//
// Mirrors src/services/gemini/proxyClient.js. Keeps the real Gemini API key OFF
// the client by routing all AI calls through the Supabase `gemini` Edge Function,
// which injects the key server-side. The "apiKey" below is a placeholder the
// proxy ignores. The anon key is public (RLS-protected) and safe to ship.
//
// See: supabase/functions/gemini/index.ts
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenAI } from "@google/genai";

export const SUPABASE_URL = "https://fztexdkhuozufffgxstc.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dGV4ZGtodW96dWZmZmd4c3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDAwOTAsImV4cCI6MjA4ODUxNjA5MH0.z6qA3FqIjNaaqTXPKkbiCI1xEk_9f43KDlOKlcf_hkA";

// Base URL the @google/genai SDK prepends to `/v1beta/models/...` paths.
export const GEMINI_PROXY_BASE = `${SUPABASE_URL}/functions/v1/gemini`;

// Headers the proxy uses to gate access (public anon key — safe to ship).
export const GEMINI_PROXY_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

// Placeholder — the real Gemini key lives only in the Edge Function secret.
const PLACEHOLDER_KEY = "proxied-no-client-key";

export const createGeminiClient = () =>
  new GoogleGenAI({
    apiKey: PLACEHOLDER_KEY,
    httpOptions: {
      baseUrl: GEMINI_PROXY_BASE,
      headers: GEMINI_PROXY_HEADERS,
    },
  });
