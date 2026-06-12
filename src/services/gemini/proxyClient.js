// ─────────────────────────────────────────────────────────────────────────────
// CELESTIA — GEMINI PROXY CLIENT (shared)
//
// Single source of truth for talking to Gemini WITHOUT shipping the real API key.
// All AI services build their @google/genai client from here. The client is
// pointed at the Supabase `gemini` Edge Function, which injects the real key
// server-side. The "apiKey" below is a placeholder the proxy ignores.
//
// See: supabase/functions/gemini/index.ts
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenAI } from "@google/genai";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../supabase/client";

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
