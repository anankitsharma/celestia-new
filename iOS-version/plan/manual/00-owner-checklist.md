# Owner Checklist — Final Submission

**Last updated:** 2026-04-27 · this round
**Status:** Code is complete. The 9 items below are manual/external tasks only the owner can do.

> When every box on this page is checked, the app is in Apple's review queue.

---

## 0. Where things stand (read first)

The codebase is fully ready. Everything I've shipped this session is in the `iOS-version/` tree:

| Layer | Status |
|---|---|
| Default-flow surface (Apple reviewer's view) | ✅ Zero astrology vocabulary; psychology-led end-to-end |
| Onboarding (12 screens) | ✅ Audited line-by-line; framework citation locked; stat strip gated |
| Connections + Compatibility | ✅ Light Liquid Glass; honest math (total = avg of dimensions); back button |
| Today tab | ✅ TODAY card + TODAY'S READ + DAILY REFLECTION + QUICK-ADD |
| Ask (chat) | ✅ Consent modal, crisis intercept, AI tags, plain-text replies, "Send to team" |
| Profile | ✅ Find support, Send to team, no streak/XP/badges in default flow |
| Journal | ✅ AI gentle reflection loop, partner picker, light hero |
| AI prompts | ✅ Every Match/Reflection/Today/Chat function rewritten psychology-led |
| Compliance | ✅ Apple 1.2 / 1.4.1 / 2.5.7 / 5.1.2(i) all addressed |
| Listing assets | ✅ `Storefront.md`, `Reviewer-Message.md`, `Narrative.md`, `90-Second-Walkthrough.md` |

**What's NOT in code that you must handle below:** version bump, `npm install`, native rebuild, hosted URLs, ASC fields, screenshots, TestFlight test, Submit tap.

---

## 1. Bump version + buildNumber

`package.json` is still on `"version": "1.0.6"` (the rejected version). `app.json` `buildNumber` is `"1"`. Apple won't accept the same version+build.

### Edit two files

**`/Users/apple/Documents/Expo apps/Celestia-new/iOS-version/package.json`** — change:
```json
"version": "1.0.6",
```
to:
```json
"version": "1.1.0",
```

**`/Users/apple/Documents/Expo apps/Celestia-new/iOS-version/app.json`** — change:
```json
"buildNumber": "1",
```
to:
```json
"buildNumber": "2",
```

(If you've ever uploaded a build before with buildNumber 2, increment to 3, etc. Build numbers must monotonically increase per version.)

**Status:** ☐

---

## 2. Refresh dependencies

We removed three packages this session: `posthog-react-native`, `react-native-purchases`, `@react-native-google-signin/google-signin`. The lockfile is stale until you reinstall.

```bash
cd /Users/apple/Documents/Expo\ apps/Celestia-new/iOS-version
npm install
```

This refreshes `package-lock.json` and removes the three packages from `node_modules`. Should complete in ~30 seconds.

**Status:** ☐

---

## 3. Regenerate native iOS build (Pods)

The native iOS folder has stale Pod references for the removed packages. Clean prebuild forces regeneration.

```bash
cd /Users/apple/Documents/Expo\ apps/Celestia-new/iOS-version
npx expo prebuild --clean
```

This deletes and regenerates `ios/` based on the current `app.json`. Takes ~2-3 minutes.

**Then:**

```bash
npx expo run:ios
```

This builds and launches on the iOS Simulator. Should compile cleanly on the first try; if it fails, the most likely cause is a leftover Pod reference — re-run `npx expo prebuild --clean` and retry.

**Status:** ☐

---

## 4. Walk the 90-second reviewer flow on a device

This is the safety net that catches anything `node -c` can't. The walkthrough script is in `plan/Narrative-ASO/90-Second-Walkthrough.md` — open it and follow every timestamp.

### What to verify in the walkthrough

- [ ] Splash → light cream gradient, serif "CELESTIA", "Begin"
- [ ] Onboarding step 1 → "Understand the patterns in your relationships."
- [ ] Onboarding step 2-4 → quiz questions; **Skip** link visible top-right
- [ ] Onboarding step 5 → 3 framework cards with numbered badges; "astronomical positioning at your time of birth" is the third card
- [ ] Onboarding step 6 → tap **Birth Date** → spinner expands inline → tap **Done** → field updates
- [ ] Onboarding step 7 → tap **Birth Time** → spinner inline + Done; OR tap "Skip — I'd rather not"
- [ ] Onboarding step 8 → tap **Birth City** → keyboard appears → form scrolls so input + suggestions visible above keyboard; OR tap "Skip for now"
- [ ] Onboarding loading → "Building your personality blueprint" + 4 phases
- [ ] First Hit reveal → leads with attachment label ("Anxious-Preoccupied")
- [ ] Big Reveal → 3 relational tiles (HOW YOU ACT / WHAT YOU NEED / HOW OTHERS SEE YOU); **no chart wheel, no stat strip, no sign labels** in default state
- [ ] Tap "✦ See the framework details" → chart wheel + sign labels + stat strip appear
- [ ] Connections invite → Add Someone OR Skip
- [ ] **Today tab** lands first — Hero + TODAY card + TODAY'S READ + DAILY REFLECTION + QUICK-ADD
- [ ] **Tap Ask** → consent modal blocks first chat → "I'm ready — Continue"
- [ ] Type a message → reply is plain text (no asterisks rendering literally), has ✦ AI tag, has "Send to team" link
- [ ] Type a crisis test phrase ("I want to die") → intercepted locally with hotline message, never sent to AI
- [ ] **Tap Connections** → "+ Add Someone" → fill name + DOB only (skip city) → tap **Calculate Compatibility** → detail view loads with light cream hero
- [ ] Detail view → "‹ Connections" back pill is visible top-left, taps return to list
- [ ] Score circle + dimension chips: total ≈ average of chips (within ±1)
- [ ] **Tap Profile** → light hero, settings rows, Find support, Send something to the team

If any item fails, send me the symptom and I'll patch in minutes.

**Status:** ☐

---

## 5. Host Privacy Policy + Terms (and the supporting legal pages) publicly

`src/screens/ProfileScreen.js` references `https://celestia.app/privacy` and `/terms`. Both URLs must return a real page in incognito before submission. Apple **hard-rejects** apps where the Privacy URL 404s.

The legal pages were rewritten this round to reflect the current v1 build (no PostHog, no IAP, no auth) and live in `iOS-version/plan/privacy/`:

| File | Suggested URL | Required by |
|---|---|---|
| `privacy-policy.md` | `/privacy` | Apple 5.1.1 — **mandatory** |
| `terms-of-service.md` | `/terms` | App self-protection — **strongly recommended** |
| `data-deletion.md` | `/delete-data` | Apple 5.1.1(v) — **mandatory** |
| `ai-disclaimer.md` | `/ai-disclaimer` | 4.3 / 5.5 defense — recommended |
| `eula.md` | `/eula` | Only needed if you upload a Custom EULA in ASC; for v1, **keep Apple's Standard EULA** and skip this |
| `index.md` | `/legal` | Optional landing page |

### Steps

1. Open the files in `iOS-version/plan/privacy/`. Read `README.md` first — it lists every substitution.
2. Substitute placeholders across the 5 files (find-and-replace is fastest):
   - `[YOUR LEGAL ENTITY / YOUR NAME]` → your actual entity
   - `[YOUR COUNTRY]` / `[YOUR COUNTRY / STATE]` → jurisdiction
   - `[INSERT DATE BEFORE PUBLISHING]` → today's ISO date (`2026-MM-DD`)
   - `support@celestia.app` → your real support email (or keep this if it's monitored)
   - `https://celestia.app/...` → wherever you host
3. **Delete each file's "Editor's notes" block** before publishing (the section starts with `## Editor's notes (delete this entire block before publishing)`).
4. Pick a host (free options):
   - **GitHub Pages** (free, custom domain optional)
   - **Notion publish-to-web** (free, ugly URL but works)
   - **Vercel / Cloudflare Pages** static site (free, custom domain free)
5. Verify both `/privacy` and `/terms` return 200 OK in incognito. Verify `/delete-data` is reachable too — you'll paste its URL into ASC's Account Deletion field in step 7.
6. If hosting at a different domain, update the constants in `src/screens/ProfileScreen.js`:
   ```js
   const PRIVACY_URL = 'https://your-actual-host/privacy';
   const TERMS_URL  = 'https://your-actual-host/terms';
   ```

**Status:** ☐

---

## 6. Produce 6 App Store screenshots (1290 × 2796 PNG)

Per `iOS-version/plan/03-screenshot-spec.md`. Sequenced for the 4.3(b) defense:

1. **Hero hook** — "Why do you keep falling for the same type?" / "Find out what your patterns are telling you"
2. **AI chat** about a relationship anxiety with a psychology-led response
3. **Compatibility analysis** between two named people
4. **"Your relationship patterns"** — pattern card showing attachment style
5. **Daily reflection prompt** ("What did you avoid saying this week?") — the Mindfulness category signal
6. **Personality blueprint** — Profile tile labeled "personality blueprint" (not horoscope)

### What every screenshot must NOT show

- Daily horoscope card
- Zodiac wheel
- Planet glyphs (☉ ☽ ☿ ♀ ♂ ♃ ♄)
- Zodiac sign glyphs (♈♉♊♋♌♍♎♏♐♑♒♓)
- Mystical emojis (🔮 ✨ 🌙) in the overlay text
- The word "horoscope" anywhere
- Celebrity charts (Zendaya / Harry Styles / Taylor Swift)

### Process

1. Run the app on iPhone 15 Pro Max simulator (or a real device with the right resolution)
2. Capture raw screenshots
3. Composite the marketing overlays in Figma (top 25% hero text, middle 60% UI, bottom 15% empty or tab bar)
4. Export as PNG, sRGB, no alpha, < 8MB each, exact 1290 × 2796 dimensions

**iPad screenshots: NOT required.** `app.json` has `supportsTablet: false`.

**Status:** ☐

---

## 7. Update App Privacy (Privacy Nutrition Label) in ASC

**Important change since the original spec:** PostHog is gone, so the Diagnostics rows are no longer needed. Use this revised label:

| Data Type | Collected | Linked to user | Used for tracking |
|---|---|---|---|
| Location → Coarse Location | YES (birth city via Nominatim, onboarding only) | NO | NO |
| User Content → Other User Content | YES (journal, partner profiles — local SQLite) | NO | NO |
| Identifiers → User ID | YES (random UUID generated locally) | NO | NO |
| Other Data → Other Data Types | YES (birth data of people the user adds) | NO | NO |

**Do NOT add:**
- Diagnostics → Crash Data (PostHog removed)
- Diagnostics → Performance Data (PostHog removed)

In ASC: App Privacy → Get Started → answer the questionnaire to produce these four rows.

**Status:** ☐

---

## 8. Fill App Store Connect fields

Open `iOS-version/plan/Narrative-ASO/Storefront.md` — every field is paste-ready there. Cross-check with `iOS-version/plan/06-app-store-connect-fields.md` for ASC-form-by-form values.

### Field-by-field

| ASC field | Source |
|---|---|
| App name | "Celestia: Relationship Pattern" — `Storefront.md` line 11 |
| Subtitle | "Understand love & connection" — `Storefront.md` line 17 |
| Promotional text (170 chars) | block in `Storefront.md` §3 |
| Description (full) | fenced block in `Storefront.md` §4 |
| Keywords (96 chars, comma-separated, no spaces) | "relationships,attachment,compatibility,self-discovery,patterns,dynamics,love language,partner" |
| Primary category | Health & Fitness > Mindfulness |
| Secondary category | Lifestyle |
| Age rating | 17+ (run questionnaire to produce) |
| Pricing | Free · all territories |
| What's New | block in `Storefront.md` §6 |
| Privacy Policy URL | `https://celestia.app/privacy` (whatever you host at — see Step 5) |
| Account Deletion URL | `https://celestia.app/delete-data` (from Step 5) — fills Apple 5.1.1(v) |
| Support URL | `https://celestia.app/support` or `mailto:support@celestia.app` |
| Marketing URL (optional) | `https://celestia.app` |
| License Agreement | Keep at **Standard EULA** for v1 (only switch to custom if you upload `eula.md` in Step 5) |

### App Review Information (the message to the reviewer)

Open `iOS-version/plan/Narrative-ASO/Reviewer-Message.md` — copy the fenced block verbatim into ASC → App Review Information → Notes.

**Encryption** (Export Compliance): Answer **No** — `ITSAppUsesNonExemptEncryption: false` is already set in `app.json`.

**Status:** ☐

---

## 9. EAS build + TestFlight smoke test

```bash
cd /Users/apple/Documents/Expo\ apps/Celestia-new/iOS-version
eas build --profile production --platform ios
```

Wait ~15-20 minutes. EAS uploads to App Store Connect automatically if your credentials are wired (otherwise download `.ipa` and upload via Apple's Transporter app).

### TestFlight smoke test on a real iPhone

Install the build on a physical device via TestFlight, then walk through the same checklist as Item 4 (the 90-second walkthrough). If it passed on simulator but fails on TestFlight, the most likely cause is a permission prompt the simulator skipped (notifications, location).

Bonus checks specific to a real device:
- [ ] App icon renders on home screen as cream/clay (not the old dark navy splash bg)
- [ ] Splash screen flashes cream `#FAF8F2` (not dark `#3A1A28`) — this is set in `app.json`
- [ ] iPad: install on an iPad and confirm the app launches in iPhone-compatible mode (no native iPad layout, since `supportsTablet: false`)
- [ ] No console crashes during a 5-minute hands-on session

**Status:** ☐

---

## 10. Submit for review

After every box above is ticked:

1. App Store Connect → version 1.1.0 → **Add for Review** → **Submit for Review**
2. Set release behavior to **"Manually release this version"** (so you can review the live page before public launch)
3. Wait 24–48h

If approved → ship it.

If rejected → check `iOS-version/plan/09-risk-register-and-roadmap.md` for the response playbook. The most likely re-rejection vector at this point would be either (a) a screenshot leak, (b) a Privacy URL 404, or (c) a reviewer-specific edge case in the chat AI's output. Each has a documented response.

**Status:** ☐

---

# Final summary checklist

Print this section, tick boxes as you go:

- [ ] **1.** `package.json` version → `"1.1.0"`, `app.json` buildNumber → `"2"`
- [ ] **2.** `npm install` ran without errors
- [ ] **3.** `npx expo prebuild --clean && npx expo run:ios` built successfully
- [ ] **4.** 90-second walkthrough passed on simulator (every checkbox ticked)
- [ ] **5.** Privacy Policy + Terms URLs live, both return 200 in incognito
- [ ] **6.** 6 screenshots produced at 1290×2796, none show astrology iconography
- [ ] **7.** App Privacy (Nutrition Label) filled with the 4 rows above (no PostHog)
- [ ] **8.** ASC fields populated from `Storefront.md` + Reviewer Notes from `Reviewer-Message.md`
- [ ] **9.** EAS build uploaded; TestFlight smoke test passed on real device
- [ ] **10.** "Submit for Review" tapped

When all 10 are done, the app is in Apple's queue. Expect a verdict in 24–48 hours.

---

# Appendix: items that were on previous checklists but are now N/A

These were live decisions earlier in the project — no longer applicable. Listed here so future contributors don't waste time on them.

| Old item | Status now | Why N/A |
|---|---|---|
| PostHog: keep or remove? | Already removed | Stripped during the V1.2 trim pass; dependency uninstalled, App.js wrapper deleted |
| RevenueCat: enable or stub? | Already stubbed | Provider returns `isPro: true`, no SDK in build |
| Auth (Sign in with Apple)? | Already stubbed | AuthContext returns anonymous; v1 is no-account |
| Confirm app name | Already locked | "Celestia: Relationship Pattern" — see `Storefront.md` |
| Partner-data consent modal | Already removed | The pre-pageSheet modal-on-modal blocked Calculate Compatibility; replaced with inline 🔒 disclosure at top of Add Person modal |
| iPad screenshots | Not required | `supportsTablet: false` |
| Daily quests / streak / badge cards | Already stripped from Today | Per the "calm, not addictive" PDF principle |
| Tab bar = 4 tabs | Already locked | Today / Connections / Ask / Profile |
| Reviewer Notes paste | Already drafted | `plan/Narrative-ASO/Reviewer-Message.md` |
