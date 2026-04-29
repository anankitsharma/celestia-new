# Celestia v1.1.0 — App Store Resubmission Runbook

**Status:** Sequential checklist. Do steps in order. Don't skip steps. Don't batch step 5 (EAS build) before steps 1–4 are complete — a 25-minute build that uploads to the wrong ASC record is a wasted day.

**Context:** Resubmitting after the 2026-01-23 rejection under Apple Guideline 4.3.0 / 4.3(b) — saturated category (astrology / horoscope / zodiac duplicates). The v1.1.0 codebase + ASO has been rebuilt to escape that pool.

**Apple identifiers (locked):**
- Apple App ID: `6757995238`
- Bundle ID: `com.ask.celestia`
- ASC owner: nandinipalakodeti0@gmail.com (Palakodeti Nandini)
- SKU: `EX1768794827560`

**Local config sources of truth:**
- `iOS-version/app.json` — version `1.1.0`, bundle id `com.ask.celestia`
- `iOS-version/eas.json` — submit profile pre-filled with ASC identifiers
- `iOS-version/plan/ASO/metadata.md` — paste-ready blocks
- `iOS-version/plan/ASO/whats-new.md` — paste-ready release notes
- `iOS-version/plan/screenshots/generator/` — Next.js screenshot generator (run `npm run dev`)
- `iOS-version/plan/privacy/` — legal page sources (must be hosted publicly before submit)

---

## PHASE 0 — Pre-flight blockers (resolve before doing anything else)

These are the four things that, if not resolved, will cause failures downstream regardless of how clean your code is.

### 0.1 — EAS account access
- [ ] Run `eas whoami` in `iOS-version/`. If it returns `anankit`, you are NOT authorized for project `6f7ddec7-387e-4481-8f11-2f66971afad6`.
- [ ] Choose one path:
  - **Path A (recommended — preserves build history):** `eas logout` then `eas login` with `nandinipalakodeti0@gmail.com`. Confirm with `eas whoami` and `eas build:list --platform ios --limit 1`.
  - **Path B (collaborator invite):** Owner logs into `expo.dev` → project → Members → invite `anankit` with build/submit permissions, then accept invite.
- [ ] Run `eas build:list --platform ios --limit 3 --non-interactive` and verify it returns 3 rows without an `Entity not authorized` error.

### 0.2 — Apple App Store Connect credentials
You need ONE of these for `eas submit` to upload the IPA:
- [ ] **Recommended — App Store Connect API key:**
  1. App Store Connect → Users and Access → Integrations → App Store Connect API → Generate API Key.
  2. Role: `Admin` (or `App Manager` minimum).
  3. Download the `.p8` file (one-time download, save it somewhere permanent).
  4. Note the Issuer ID (top of page) and Key ID (the row).
  5. Keep these handy — `eas submit` will prompt for them on first run, then store them in EAS Secrets.
- [ ] **Fallback — App-specific password:**
  1. appleid.apple.com → Sign In and Security → App-Specific Passwords → Generate.
  2. Label: `EAS Submit`.
  3. Save the password (one-time view).

### 0.3 — Verify bundle ID match in ASC
- [ ] In App Store Connect → My Apps → Celestia → App Information → General Information → Bundle ID. Confirm it reads `com.ask.celestia` (may show with a team prefix like `XXXXXXX.com.ask.celestia` — that's normal).
- [ ] If it shows anything else, **stop**. Bundle ID is immutable post-first-submission. Report back what it actually says.

### 0.4 — Change ASC categories away from Entertainment
This is the single most important Phase-0 item for 4.3(b) defense.

- [ ] App Store Connect → Celestia → App Information → Category:
  - **Primary:** change from `Lifestyle` → **`Health & Fitness`**, then sub-category **`Mindfulness`**.
  - **Secondary:** change from `Entertainment` → **`Lifestyle`**.
- [ ] Save. Re-open the page to confirm.

Why: `Entertainment` is the category Co-Star, Sanctuary, Astrology Zone, etc. live in — the literal "saturated category" Apple flagged. Even perfect metadata copy can't override a category-level signal.

---

## PHASE 1 — Local code readiness

Verify the binary is clean before kicking off a 25-minute EAS build.

### 1.1 — Verify app.json
- [ ] Open `iOS-version/app.json` and confirm:
  - `expo.name` = `"Celestia: Relationship Pattern"`
  - `expo.version` = `"1.1.0"`
  - `expo.ios.bundleIdentifier` = `"com.ask.celestia"`
  - `expo.ios.infoPlist.CFBundleDisplayName` = `"Celestia"`
  - `expo.extra.eas.projectId` matches your authorized EAS project

### 1.2 — Verify eas.json submit profile
- [ ] `iOS-version/eas.json` → `submit.production.ios` should have:
  ```json
  {
    "appleId": "nandinipalakodeti0@gmail.com",
    "ascAppId": "6757995238",
    "bundleIdentifier": "com.ask.celestia"
  }
  ```

### 1.3 — Run a final banned-word audit on visible UI strings
- [ ] In `iOS-version/`, run:
  ```bash
  grep -rin --include="*.js" -E 'horoscope|zodiac|tarot|fortune|destiny|cosmic|mercury retrograde|crystal|numerology|soulmate|karmic' src/screens src/components 2>&1 | grep -v "// V1" | grep -v "// banned"
  ```
- [ ] Manually review any hits. False positives in V1_DISABLED_TEMPLATES or in negation contexts (`'Mercury retrograde' is OK in a glossary modal not shown by default`) are acceptable. Anything visible by default in the UI must be removed.

### 1.4 — Confirm RevenueCat is stubbed
- [ ] Open `src/contexts/RevenueCatContext.js` and verify it exports the `STUB_VALUE` with `isPro: true` (no real purchase paths). This matches the `Free · No IAP` claim in metadata.

### 1.5 — Syntax-check critical files
- [ ] In `iOS-version/`:
  ```bash
  node -c src/screens/HomeScreen.js
  node -c src/screens/CompatibilityScreen.js
  node -c src/screens/ChatScreen.js
  node -c src/screens/ProfileScreen.js
  node -c src/screens/OnboardingFlowScreen.js
  node -c src/services/database/demoData.js
  ```
- [ ] All commands should exit silently (status 0). Any syntax error = stop and fix before building.

### 1.6 — Local smoke test in Expo Go
- [ ] `npx expo start --clear` then scan QR or use simulator.
- [ ] Walk the 90-second golden path:
  1. Splash → Onboarding (do not skip; fill name/DOB/time/city).
  2. Welcome → Today tab loads with at least one card.
  3. Tap Ask AI → send a real message, verify AI reply contains psychology-led copy (no "stars", "horoscope", "destiny").
  4. Tap Circle → see empty state OR demo data (if Profile → Fill Demo Data was tapped).
  5. Tap Reports → empty state acceptable; do not generate a real report (saves Gemini quota).
  6. Tap Profile → confirm "Show astrology details" toggle is visible and OFF by default.
  7. Toggle astrology ON → confirm Chart link, planet placements appear.
  8. Toggle OFF → confirm those disappear cleanly.
- [ ] If anything feels broken, fix in code and re-run before EAS build.

---

## PHASE 2 — Legal page hosting

Apple's reviewers click these URLs from the listing. A 404 = hard reject. Test in incognito (your logged-in cookies hide auth-required failures).

### 2.1 — Confirm legal page content is final
- [ ] Open `iOS-version/plan/privacy/` and verify these files have current copy:
  - `privacy-policy.md`
  - `terms-of-service.md`
  - `eula.md`
  - `ai-disclaimer.md`
  - `data-deletion.md`
  - `support.md`
  - `about.md`

### 2.2 — Host the pages publicly
Pick one path (cheapest first):
- [ ] **Option A — GitHub Pages (free, fast):** push `plan/privacy/*.md` to a public repo, enable Pages, use the resulting URL pattern `https://<user>.github.io/<repo>/privacy-policy`.
- [ ] **Option B — Netlify drop:** drag the `plan/privacy/` folder onto netlify.com/drop, get instant URL.
- [ ] **Option C — Custom domain:** if you own `celestia.app`, point it at any of the above.

### 2.3 — Test every URL in incognito
- [ ] Privacy Policy URL → returns 200, content is the privacy policy.
- [ ] Support URL → returns 200, content is the support page with email contact.
- [ ] Account Deletion URL (data-deletion.md) → returns 200, content explains how to delete user data.
- [ ] Marketing / Home URL (optional) → if used, returns 200.
- [ ] If any returns 404, redirect, or login wall → fix before submission.

### 2.4 — Note the final URLs for ASC
- [ ] Privacy Policy URL: ___________________
- [ ] Support URL: ___________________
- [ ] Account Deletion URL: ___________________
- [ ] Marketing URL (optional): ___________________

---

## PHASE 3 — Screenshot export

### 3.1 — Start the screenshot generator
- [ ] In a separate terminal:
  ```bash
  cd "iOS-version/plan/screenshots/generator"
  npm run dev
  ```
- [ ] Open `http://localhost:3001` (or whatever port Next picks).
- [ ] Hard-refresh once after first load (Cmd+Shift+R) so all 7 frames render with the trimmed source PNGs.

### 3.2 — Verify all 7 frames render correctly in the preview grid
- [ ] Frame 1 — onboarding hero with "Understand the patterns…"
- [ ] Frame 2 — Compatibility list (Maya / Daniel / Priya)
- [ ] Frame 3 — Ask AI chat with psychology-led reply
- [ ] Frame 4 — Compatibility detail with 4 dimension chips
- [ ] Frame 5 — Today tab with DRIFT alert
- [ ] Frame 6 — Personality blueprint
- [ ] Frame 7 — Privacy graphic (CSS-drawn, no source PNG)

### 3.3 — Export at 6.9" (Apple's primary required size)
- [ ] Confirm the size dropdown shows `6.9" iPhone 16 Pro Max (1320×2868)`.
- [ ] Click **Export all (7)**. Files land in `~/Downloads/`.
- [ ] Verify dimensions:
  ```bash
  for f in ~/Downloads/0?_*1320x2868.png; do sips -g pixelWidth -g pixelHeight "$f"; done
  ```
- [ ] Every file should report `pixelWidth: 1320` and `pixelHeight: 2868`. Any deviation = stop and re-export.

### 3.4 — Spot-check one downloaded PNG
- [ ] Open `~/Downloads/02_connections_1320x2868.png` in macOS Preview. Zoom to fit. Confirm:
  - Caption text renders crisp (no fallback fonts)
  - Phone mockup is visible at bottom-right
  - 3 connection cards inside the phone are legible
  - Cream/rose gradient background is present
  - No cropped or missing content

### 3.5 — Move PNGs into `plan/screenshots/selected/final/`
- [ ] Create the folder:
  ```bash
  mkdir -p "iOS-version/plan/screenshots/selected/final"
  mv ~/Downloads/0?_*1320x2868.png "iOS-version/plan/screenshots/selected/final/"
  ```
- [ ] Verify exactly 7 files.

---

## PHASE 4 — App Store Connect metadata updates (BEFORE EAS build)

This is what the reviewer actually reads. All 4.3(b) defense lives here.

### 4.1 — Rename the app
- [ ] App Store Connect → My Apps → Celestia → **App Information** → top of page → click the app name → change to:
  ```
  Celestia: Relationship Pattern
  ```
- [ ] Save. Confirm the new name appears in the breadcrumb.

### 4.2 — Set Subtitle (App Information)
- [ ] In the same App Information page, **Subtitle** field. Paste from `iOS-version/plan/ASO/metadata.md`:
  ```
  Attachment & compatibility
  ```

### 4.3 — Confirm Primary Language is English (U.S.)
- [ ] App Information → Primary Language → `English (U.S.)`. If anything else, fix.

### 4.4 — Create version 1.1.0
- [ ] Left sidebar → iOS App → click **(+)** to add a new version → enter `1.1.0`.
- [ ] If 1.0.6 is still showing as Rejected, you can leave it; the new 1.1.0 will be the active version going forward.

### 4.5 — Paste version-1.1.0 metadata
On the new 1.1.0 version page:
- [ ] **Promotional Text:**
  ```
  Understand the patterns in your relationships — calmly, privately, in plain English.
  ```
- [ ] **Description:** paste the full fenced block from `metadata.md` "Full description" section.
- [ ] **Keywords:**
  ```
  self-discovery,dynamics,love,language,partner,communication,psychology,family,couples,therapy,friend
  ```
  (No spaces between commas — paste exactly.)

### 4.6 — Upload the 7 screenshots
- [ ] Scroll to the **iPhone 6.9" Display** section.
- [ ] Drag all 7 PNGs from `plan/screenshots/selected/final/` in the order:
  1. `01_hero_1320x2868.png`
  2. `02_connections_1320x2868.png`
  3. `03_ask-ai_1320x2868.png`
  4. `04_compat_1320x2868.png`
  5. `05_today_1320x2868.png`
  6. `06_blueprint_1320x2868.png`
  7. `07_privacy_1320x2868.png`
- [ ] Confirm thumbnail order in ASC matches. ASC sometimes reorders on upload — drag to fix.
- [ ] You do NOT need to upload other sizes; Apple auto-scales.

### 4.7 — Paste What's New
- [ ] Scroll to **What's New in This Version** field.
- [ ] Paste the fenced block from `iOS-version/plan/ASO/whats-new.md`.

### 4.8 — Set / verify URLs
- [ ] **Privacy Policy URL** → paste the live URL from Phase 2.4.
- [ ] **Support URL** → paste from Phase 2.4.
- [ ] **Marketing URL** (optional) → paste if you have one.

### 4.9 — Verify Account Deletion URL
- [ ] App Information → **App Privacy** → Account Deletion URL → paste from Phase 2.4.

### 4.10 — Verify App Privacy / Privacy Nutrition Label
- [ ] App Privacy → Get Started (or Edit if already filled).
- [ ] Match the table in `metadata.md` § "App Privacy":
  - Location → Coarse Location: collected, not linked, not for tracking.
  - User Content → Other User Content: collected, not linked, not for tracking.
  - Identifiers → User ID: collected, not linked, not for tracking.
  - Other Data → Other Data Types: collected, not linked, not for tracking.
- [ ] Confirm there are NO `Diagnostics` rows (PostHog was removed in v1).

### 4.11 — Set Pricing & Availability
- [ ] Pricing and Availability → Price → `USD 0`. Availability → All Territories.
- [ ] Confirm no in-app purchases exist (the binary has none — RevenueCat is stubbed).

### 4.12 — Set Age Rating
- [ ] App Information → Age Rating → answer questionnaire to produce **17+**.
- [ ] Per `metadata.md`: Sexual Content `Infrequent / Mild`, Mature/Suggestive Themes `Frequent / Intense`, all others `None`. Result must show `17+`.

### 4.13 — App Review Information (the Reviewer Notes)
This is private to Apple — the public listing never shows it. Your single best chance to short-circuit the 4.3(b) re-rejection.

- [ ] **Sign-In Required**: No (the app has no login).
- [ ] **Demo Account**: leave blank.
- [ ] **Notes** field — paste from `iOS-version/plan/Narrative-ASO/Reviewer-Message.md` if it exists. If not, paste this draft:

```
Hello App Review Team,

This is the v1.1.0 resubmission of Celestia following the rejection on
2026-01-23 under Guideline 4.3(b) (saturated category — astrology /
horoscope / zodiac).

We have rebuilt the app to escape the saturated category. Specifically:

1. POSITIONING. The app is now positioned as a relationship-pattern
   recognition tool, built on attachment theory, communication styles,
   and personality science. The default user surface is psychology-led;
   astrology details are hidden behind an opt-in toggle that is OFF by
   default for new users.

2. CATEGORIES. We have moved the app into Health & Fitness (Mindfulness)
   primary, Lifestyle secondary — placing it in the Calm / Headspace /
   Stoic reviewer pool rather than the Co-Star / Sanctuary pool that
   Guideline 4.3(b) targets.

3. FEATURE SHAPE. The app's primary feature is a multi-relationship
   tracker (partner, friend, family, colleague — eight relationship
   types) plus a daily reflection prompt and an AI advisor. None of
   these duplicate the daily-card / horoscope / zodiac-quiz pattern
   common to the saturated category.

4. AI DISCLOSURE. AI responses are clearly labeled in the chat UI
   ("Written with AI · here for reflection"). No AI message is presented
   as fact or prediction.

5. PRIVACY. All user data is stored locally in SQLite. AI requests are
   sent to Google's Gemini service without the user's name or any
   account ID. We do not sell or share user data.

For verification: open the app fresh, complete the 60-second onboarding,
and reach the Today tab — you will see the psychology-led surface. The
optional "Show astrology details" toggle in Profile is OFF by default;
enabling it surfaces additional personality-framework dimensions.

Thank you for your review.

Contact: nandinipalakodeti0@gmail.com
```

- [ ] **Attachment**: optional — you can attach a 30-second screen recording of the onboarding flow if it would help. Not required.

### 4.14 — Final pre-build check on ASC
- [ ] All fields green / saved.
- [ ] No yellow "incomplete" markers in the version 1.1.0 sidebar.
- [ ] Subtitle/Promo/Description char counts match the validation in `metadata.md` (ASC will show live counts; verify they read `26/30`, `84/170`, `1731/4000`).

---

## PHASE 5 — EAS production build

Now we build the binary. This is the long step (15–25 min).

### 5.1 — Confirm correct EAS account is logged in
- [ ] `eas whoami` returns the account that owns project `6f7ddec7-387e-4481-8f11-2f66971afad6`.
- [ ] `eas build:list --platform ios --limit 1 --non-interactive` returns a build (proves access).

### 5.2 — Optional but recommended: clean prebuild
If you've done iOS prebuilds before, the cached `ios/` folder may have stale settings.
- [ ] In `iOS-version/`:
  ```bash
  npx expo prebuild --platform ios --clean
  ```
- [ ] If prompted to commit changes, `git add .` and commit (or stash if you want to keep the prebuild ephemeral).

### 5.3 — Trigger the production build
- [ ] In `iOS-version/`:
  ```bash
  eas build --platform ios --profile production
  ```
- [ ] EAS will:
  1. Upload the source archive (~2 min).
  2. Auto-increment `buildNumber` remotely (likely 5 → 6).
  3. Run on EAS infrastructure (~15–25 min).
  4. Print a URL where you can watch progress live.
- [ ] If credentials prompts appear:
  - "Do you want to use generated credentials" → yes.
  - "Apple ID" → `nandinipalakodeti0@gmail.com`.
  - Enter Apple ID password (or 2FA code) when asked.

### 5.4 — Wait for build success
- [ ] Browser tab on the EAS build URL shows status `finished`.
- [ ] Download URL of the IPA appears.
- [ ] If status is `errored`:
  - Click into logs.
  - Common causes: provisioning profile mismatch (run `eas credentials` to inspect), bundle ID mismatch (re-check Phase 0.3), missing native dependency (look for `Cannot find module` or `linker error`).
  - Fix and re-run step 5.3.

### 5.5 — Optional: download the IPA and test on a real device
- [ ] Drag the IPA onto Xcode → Devices and Simulators → install on a physical iPhone connected via USB. (Skip if you trust the build — but a manual test on a real device is the cheapest insurance against an "app crashes on launch" rejection.)

---

## PHASE 6 — EAS submit to App Store Connect

### 6.1 — Run the submit
- [ ] In `iOS-version/`:
  ```bash
  eas submit --platform ios --profile production --latest
  ```
- [ ] Flag `--latest` picks the most recent build automatically. If multiple builds exist, omit and pick from the menu.
- [ ] When prompted for App Store Connect API key:
  - Provide the `.p8` path, Issuer ID, Key ID from Phase 0.2.
  - EAS offers to save these to EAS Secrets — say yes.

### 6.2 — Wait for upload
- [ ] EAS uploads the IPA to ASC (~2–5 min).
- [ ] Apple processes it (~10–30 min — sometimes longer).
- [ ] You'll get an email from Apple confirming the build is processed.

### 6.3 — Verify the build appeared in ASC
- [ ] App Store Connect → Celestia → **TestFlight** tab → iOS Builds → confirm the new build (likely `1.1.0 (6)`) is listed.
- [ ] Status starts as "Processing" → after 10–30 min becomes "Ready to Submit" or similar.
- [ ] Export Compliance: if asked "Does your app use encryption?", click **No** (we set `ITSAppUsesNonExemptEncryption: false` in app.json — this should auto-resolve, but if ASC still asks, click No).

---

## PHASE 7 — Attach build to v1.1.0 and submit

### 7.1 — Go to the v1.1.0 version page
- [ ] App Store Connect → Celestia → Distribution → iOS App 1.1.0.

### 7.2 — Add the build
- [ ] Scroll to **Build** section → click **(+)** → select the build that just landed in TestFlight (the one from Phase 6.3).
- [ ] Save.

### 7.3 — Final pre-flight on the version
- [ ] All sections show green checkmarks (no "incomplete" markers in left sidebar).
- [ ] Screenshots attached (7 frames, 1320×2868).
- [ ] Description, Promo, Keywords, What's New all populated.
- [ ] Reviewer Notes populated (Phase 4.13).
- [ ] URLs all set (Privacy, Support, Account Deletion).

### 7.4 — Submit for review
- [ ] Top right of v1.1.0 page → **Add for Review** → opens the submission dialog.
- [ ] Answer Apple's auto-renewing-subscription / IDFA / encryption questions (all No / Not used for our app).
- [ ] Click **Submit to App Review**.
- [ ] Status changes from `Prepare for Submission` → `Waiting for Review`.

### 7.5 — Mark this runbook as committed-to-Apple
- [ ] Note the submission timestamp here: ___________________
- [ ] Note the submission ID (visible in the URL after submitting): ___________________

---

## PHASE 8 — Post-submission monitoring

### 8.1 — Expected timeline
- [ ] **Waiting for Review** → typically 24–72 hours (faster on weekdays).
- [ ] **In Review** → typically 1–24 hours.
- [ ] **Approved** OR **Rejected** → email notification + ASC status update.

### 8.2 — While waiting
- [ ] Do NOT click "Cancel Review" unless you discover a critical bug. Cancellation = restart-the-clock.
- [ ] Do NOT push a new build via EAS — would invalidate the in-flight review.
- [ ] You CAN edit Promotional Text after approval (it's the only metadata field that updates without a re-review).

### 8.3 — If approved
- [ ] App goes live (or releases on your scheduled date if you set one).
- [ ] Update memory: mark `submission` task as complete.
- [ ] Plan v1.1.1 minor updates (which CAN reintroduce some opt-in astrology language in opt-in surfaces, since the 4.3(b) defense is now established).

### 8.4 — If rejected again
- [ ] Read the rejection message carefully. The reason may differ from 4.3(b) this time (could be 2.3.1 metadata accuracy, 5.1.1 privacy, etc.).
- [ ] Open `iOS-version/plan/submission/` and create `01-rejection-response-<date>.md` documenting:
  - Exact rejection reason and citation.
  - Reviewer's words verbatim.
  - Planned response (metadata edit / code fix / Reviewer Notes update).
- [ ] Apply fixes. Resubmit (most cycles allow inline `Reply` to the rejection without a new build, if the fix is metadata-only).

---

## Rollback / abort criteria

Stop the submission flow and report back if any of these are true:

- [ ] Phase 0.3 reveals bundle ID mismatch — Apple's record uses a different bundle ID than `com.ask.celestia`.
- [ ] Phase 0.4 categories cannot be changed (ASC restriction).
- [ ] Phase 1 banned-word audit finds visible mystical strings in default UI.
- [ ] Phase 2 legal pages fail to load in incognito.
- [ ] Phase 5 EAS build errors three times with the same error.
- [ ] Phase 6 ASC processing takes more than 4 hours (Apple-side issue — file a bug report).

---

## Quick reference — the four files to paste from

| Where in ASC | Paste from |
|---|---|
| App Information → Subtitle | `metadata.md` § Subtitle |
| Version 1.1.0 → Promotional Text | `metadata.md` § Promotional Text |
| Version 1.1.0 → Description | `metadata.md` § Full description (the fenced block) |
| Version 1.1.0 → Keywords | `metadata.md` § Keywords |
| Version 1.1.0 → What's New | `whats-new.md` § Recommended block |
| Version 1.1.0 → App Review Notes | Phase 4.13 of this runbook |

That's it. End of runbook.
