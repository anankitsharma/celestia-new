# Supabase Setup — Gemini API Key Proxy

Follow these steps **in order**. They move your Google Gemini API key off the
app (where anyone can extract it) and into a Supabase Edge Function that injects
it server-side. The code changes are already done — these are the remaining
manual steps that only you can do (they need your Google + Supabase logins).

**Project ref:** `fztexdkhuozufffgxstc`
**Function name:** `gemini`  (code: `supabase/functions/gemini/index.ts`)

---

## Step 0 — Install & log in to the Supabase CLI (one time)

If you already have the CLI linked, skip to Step 1.

```bash
# Install (macOS)
brew install supabase/tap/supabase

# Log in (opens a browser)
supabase login

# Link this repo to your project (run from the project root)
cd "/Users/apple/Documents/Expo apps/Celestia-new"
supabase link --project-ref fztexdkhuozufffgxstc
```

> No Homebrew? See https://supabase.com/docs/guides/cli for other installers.

---

## Step 1 — Create a NEW Gemini API key (rotate)

The old key (`AIzaSy...rfhNo`) is **burned** — it already shipped inside built
apps and is in git history. You must replace it, not reuse it.

1. Go to **Google AI Studio → API keys**: https://aistudio.google.com/apikey
2. Click **Create API key**. Copy the new key somewhere temporary.
3. **Do not** put it in any file or `.env`. It only goes into Supabase (Step 2).

---

## Step 2 — Store the new key as a Supabase secret

This is the whole point: the key lives only on the server.

```bash
supabase secrets set GEMINI_API_KEY=PASTE_YOUR_NEW_KEY_HERE --project-ref fztexdkhuozufffgxstc
```

Verify it's set (shows names only, not values):

```bash
supabase secrets list --project-ref fztexdkhuozufffgxstc
```

You should see `GEMINI_API_KEY` in the list.

> **Dashboard alternative:** Project → **Edge Functions** → **Manage secrets** →
> add `GEMINI_API_KEY`.

---

## Step 3 — Deploy the Edge Function

```bash
cd "/Users/apple/Documents/Expo apps/Celestia-new"
supabase functions deploy gemini --project-ref fztexdkhuozufffgxstc
```

When it finishes, the function is live at:

```
https://fztexdkhuozufffgxstc.supabase.co/functions/v1/gemini
```

This is the URL the app already points to (`src/services/gemini/proxyClient.js`
and `ios-pwa/lib/gemini/proxyClient.js`). Nothing to change in the app.

---

## Step 4 — Smoke-test the proxy

Run this from your terminal. It calls the proxy exactly like the app does
(using the **public anon key** for the gate, NOT the Gemini key):

```bash
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dGV4ZGtodW96dWZmZmd4c3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NDAwOTAsImV4cCI6MjA4ODUxNjA5MH0.z6qA3FqIjNaaqTXPKkbiCI1xEk_9f43KDlOKlcf_hkA"

curl -s -X POST \
  "https://fztexdkhuozufffgxstc.supabase.co/functions/v1/gemini/v1beta/models/gemini-2.5-flash-lite:generateContent" \
  -H "apikey: $ANON" \
  -H "Authorization: Bearer $ANON" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Say hello in 3 words."}]}]}'
```

- ✅ **Success:** JSON containing `"candidates"` with a short text reply.
- ❌ `{"error":"GEMINI_API_KEY secret is not set"}` → redo Step 2, then redeploy (Step 3).
- ❌ `{"error":"Unauthorized"}` → the `apikey` header didn't match; re-copy the anon key.
- ❌ A Google quota / 400 error in the body → the proxy works; the issue is the key/model.

Optional negative test — this should return **401 Unauthorized** (proves the gate works):

```bash
curl -s -X POST \
  "https://fztexdkhuozufffgxstc.supabase.co/functions/v1/gemini/v1beta/models/gemini-2.5-flash-lite:generateContent" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"hi"}]}]}'
```

---

## Step 5 — Revoke the OLD key

Only after Step 4 passes:

1. Back in **Google AI Studio → API keys**.
2. Find the old key `AIzaSy…OLD-KEY-REDACTED` and **Delete** it.

From this point, the leaked key is dead and the app works through the proxy.

---

## Step 6 — Verify in the real apps

- **Expo app:** `npx expo start` → open a screen that generates AI content
  (Today briefing, Ask AI chat). It should load normally.
- **PWA:** `cd ios-pwa && npm run build && npm start` → same check.

If both work, **you're done.** ✅

---

## Done checklist

- [ ] Step 1 — New Gemini key created
- [ ] Step 2 — `GEMINI_API_KEY` secret set (shows in `secrets list`)
- [ ] Step 3 — Function deployed
- [ ] Step 4 — `curl` smoke test returns a reply
- [ ] Step 5 — Old key deleted in Google AI Studio
- [ ] Step 6 — Expo app + PWA both generate AI content

---

## Notes & later hardening (optional)

- **The anon key is public on purpose.** It ships in the app and is protected by
  Row Level Security. The Gemini key is the only real secret, and it now never
  leaves Supabase.
- **The proxy gate isn't bulletproof.** Anyone who decompiles the app has the
  anon key + URL and could call the proxy. That's fine for now — unlike a leaked
  Gemini key, you can rate-limit, log, or disable the proxy instantly.
- **Per-user rate limiting (later):** enable Supabase **Anonymous sign-in**
  (Auth → Providers), then set `verify_jwt = true` under `[functions.gemini]` in
  `supabase/config.toml` and redeploy. Every install then gets a real JWT you can
  throttle. Not required for the key-leak fix.
- **Cost monitoring:** check Google AI Studio usage and your Supabase Edge
  Function invocation count in the dashboard after launch.

---

## If something breaks (rollback)

The app code is the only thing that changed in the repo. To temporarily revert
to direct Gemini calls, `git checkout` these files — but note this re-exposes the
key, so only do it as a short-term emergency measure:

```
src/services/gemini/proxyClient.js
src/services/geminiService.js
src/services/chat/intentClassifier.js
src/services/chat/stateUpdater.js
src/services/supabase/client.js
ios-pwa/lib/gemini/proxyClient.js
ios-pwa/lib/geminiService.js
ios-pwa/lib/chat/intentClassifier.js
ios-pwa/lib/chat/stateUpdater.js
```
