# 08 — Pre-Submission Checklist

Walk through this **as the reviewer** before clicking Submit. Anything that fails → fix it, don't submit.

This checklist combines: cold-launch flow, every tab walkthrough, listing field check, build sanity, reviewer-note draft, final ASC settings.

---

## A — Cold-launch flow (the reviewer's first 90 seconds)

Open the app fresh (Reset App Data first if testing on an already-onboarded device).

### A.1 Splash screen
- [ ] Animated orb visible
- [ ] Wordmark says **CELESTIA**
- [ ] Tagline says **UNDERSTAND THE PEOPLE YOU LOVE** (not "NAVIGATE YOUR COSMOS")
- [ ] CTA says **Map My People** (not "Begin Your Journey ✦")
- [ ] **NO** "Already exploring? Sign in" link present
- [ ] No console errors or red warnings

### A.2 Onboarding step 1 (Hook)
- [ ] Heading reads relationship-led, not "stars remember"
- [ ] CTA text appropriate
- [ ] Tap progresses to step 2

### A.3 Onboarding steps 2–4 (Motivation / Pain / Depth)
- [ ] All four motivation options work
- [ ] Auto-advance to next step on tap
- [ ] Back button works

### A.4 Onboarding steps 5–7 (Birth date, time, place)
- [ ] Date picker works
- [ ] Time picker works
- [ ] City lookup returns suggestions (Nominatim is responsive)
- [ ] "Time unknown" toggle works
- [ ] First name field accepts input

### A.5 Onboarding step 8 (Calculating)
- [ ] Loading sequence plays through
- [ ] Auto-advances to step 9

### A.6 Onboarding steps 9–10 (Reveal + Big Reveal)
- [ ] First-hit screen shows the user's sun sign and tagline
- [ ] Big reveal shows wheel + Big Three + stats

### A.7 Onboarding step 11 (Daily Hook → Finish)
- [ ] Continue button visible
- [ ] Tapping Continue takes you straight to **Main** (Circle tab)
- [ ] **NO step 12 (Soft Paywall)** appears
- [ ] **NO step 13 (Reassurance)** appears
- [ ] **NO step 14 (Hard Close)** appears
- [ ] **NO** "Sign in" prompt appears anywhere

### A.8 First tab on app open
- [ ] Default tab is **Circle** (NOT Today)
- [ ] Circle tab is visually first in the tab bar
- [ ] Tab order: Circle / Today / Chart / Ask / Reports
- [ ] No tab labeled "Match" or "AskAI" (rename hygiene)

---

## B — Tab-by-tab walkthrough

### B.1 Circle (default tab)
- [ ] Empty state visible if no partners added
- [ ] "Add a person" CTA prominent
- [ ] Tap "Add" → modal with:
  - [ ] Name field
  - [ ] Relationship type pills (8 options: Partner, Friend, Parent, Sibling, Boss, Colleague, Child, Other)
  - [ ] Zodiac-only toggle
  - [ ] DOB / time / city fields
- [ ] First time saving a non-self profile → **partner consent modal appears**
  - [ ] Modal text mentions "they have shared their birth details with you for this purpose"
  - [ ] "Cancel" and "I confirm" buttons both work
  - [ ] After confirming once, modal does NOT reappear on next add
- [ ] Saved partner appears in list
- [ ] Tapping a partner → detail view loads
- [ ] No "Premium" / "Upgrade" / "Locked" UI anywhere
- [ ] No Paywall navigation when adding 4th, 5th, 10th partner

### B.2 Today
- [ ] Hero greeting shows time-of-day
- [ ] Daily insight card present
- [ ] **AI disclaimer line** visible ("AI-generated for reflection · not predictive" or similar)
- [ ] Five life-area cards work
- [ ] "Sky" / transit section works
- [ ] No "Lucky element" copy (or rename if kept)
- [ ] Streak counter / XP visible (engagement loop)
- [ ] No "Premium" overlays
- [ ] Notifications permission modal handled cleanly (allow + deny both work)

### B.3 Chart
- [ ] Birth chart wheel renders
- [ ] Tapping a planet opens placement detail
- [ ] CosmicTooltip "?" buttons work
- [ ] AstroText highlights are tappable
- [ ] No "Premium" gates
- [ ] No paywall nav when generating placement deep dives

### B.4 Ask (Chat)
- [ ] Chat input field works
- [ ] Suggested-question chips appear
- [ ] **AI disclaimer line** visible ("AI-generated · for reflection, not advice")
- [ ] Send a question → response arrives in <30s
- [ ] No "10 messages free" gate hits
- [ ] No paywall navigation after multiple messages
- [ ] Suggested questions are relationship-themed, not horoscope-themed
- [ ] No question contains "Mercury retrograde" / "what signs to avoid"

### B.5 Reports
- [ ] Report cards visible
- [ ] Tapping a report → directly opens (not paywall)
- [ ] Report names: Love Compass / Family Patterns / Friendship Dynamics / Career & Colleagues / Year of Patterns
- [ ] No "Buy Report" button
- [ ] No price labels
- [ ] Generate a report → it generates and saves
- [ ] PDF export works (if exposed)
- [ ] No "Premium" overlays

---

## C — Profile screen

- [ ] Stack-pushed Profile screen accessible from Today / hero
- [ ] User profile (name, sun, moon, rising) displayed
- [ ] Cosmic ID card / Rarity card render
- [ ] Streak / XP / badges visible
- [ ] Voice and Depth pickers work
- [ ] Theme picker works
- [ ] **NO** "Manage Subscription" row
- [ ] **NO** "Restore Purchases" button
- [ ] **NO** "Upgrade to Pro" CTA
- [ ] **YES** "Privacy Policy" row → opens public URL
- [ ] **YES** "Terms of Service" row → opens public URL
- [ ] **YES** "Support" row → opens mailto: link
- [ ] **YES** "Reset App Data" row (renamed from "Delete Account")
  - [ ] Tapping shows confirm alert
  - [ ] Title: "Reset App Data"
  - [ ] Body: "This will erase your profile, partners, journal, and all local data..."
  - [ ] After confirm: app returns to Splash → Onboarding fresh

---

## D — Listing fields (App Store Connect)

Open ASC, navigate to the version 1.1.0 details. Verify:

### D.1 App Information
- [ ] Name: `Celestia: Relationship Compass`
- [ ] Subtitle: `Understand the people you love`
- [ ] Bundle ID: `com.celestia.app`
- [ ] Privacy Policy URL: live (returns 200, contains text)
- [ ] Category: Lifestyle / Reference

### D.2 Pricing
- [ ] Price: Free (Tier 0)
- [ ] Availability: All Territories

### D.3 Version 1.1.0
- [ ] Version Number: `1.1.0`
- [ ] Description: 0 instances of `horoscope`, `fortune`, `tarot`, `zodiac`, `palm`
- [ ] Description: starts with relationship hook
- [ ] Promotional Text: present
- [ ] Keywords: `relationship,compatibility,couples,family,friendship,communication,connection,synastry,attachment,empathy`
- [ ] Support URL: live
- [ ] What's New: present

### D.4 Screenshots
- [ ] 6 screenshots uploaded for 6.7" iPhone
- [ ] All at 1290 × 2796 px
- [ ] Screenshot 1 leads with **Circle** (people grid)
- [ ] Screenshot 1 hero text: "Every relationship has a pattern."
- [ ] No screenshot contains "horoscope" / zodiac glyphs / "Free" / "Best #1"
- [ ] Order matches `03-screenshot-spec.md`
- [ ] iPad slot: empty (because `supportsTablet: false`)

### D.5 Age Rating
- [ ] Rating: 17+
- [ ] Sexual Content: Infrequent / Mild
- [ ] Mature Themes: Frequent / Intense
- [ ] Other questions: None / appropriate

### D.6 App Privacy (Nutrition Label)
- [ ] Contact Info → Name: YES, not linked, not for tracking
- [ ] Location → Coarse: YES, not linked, not for tracking
- [ ] User Content → Other: YES, not linked, not for tracking
- [ ] Identifiers → User ID: YES (random UUID), not linked, not for tracking
- [ ] Other Data → Other Data Types: YES (partner birth data), not linked, not for tracking
- [ ] If PostHog kept: Diagnostics → Crash + Performance: YES, not linked, not for tracking
- [ ] All other categories: NO

### D.7 App Review Information
- [ ] Sign-in Required: No
- [ ] Demo Account: blank
- [ ] Notes: reviewer note from `02-listing-copy.md` §13 pasted in
- [ ] Contact info: monitored email + working phone

### D.8 Build
- [ ] EAS production build attached to version 1.1.0
- [ ] Build number: 1 (or higher)
- [ ] Encryption export: No

---

## E — Code / build sanity

### E.1 Static checks (run from `iOS-version/`)
```bash
# All screens parse cleanly
for f in src/screens/*.js src/contexts/*.js src/navigation/*.js App.js; do
  node -c "$f" || echo "SYNTAX ERROR: $f"
done

# No orphan imports
grep -rn "from '../screens/AuthScreen'" src/ App.js
grep -rn "from '../screens/PaywallScreen'" src/ App.js
grep -rn "navigation.navigate('Auth')" src/
grep -rn "navigation.navigate('Paywall')" src/

# No "Sign in with Google" button
grep -rn "signInWithGoogle\|Continue with Google" src/

# Verify hardcoded prices stripped
grep -rn "\$49.99\|\$83.88\|\$6.99" src/

# Verify forbidden words in user-visible copy
grep -rn "horoscope" src/screens/ | grep -v "// "
grep -rn "fortune" src/screens/
grep -rn "destiny" src/screens/
```
All grep commands above should return ZERO matches in user-visible code.

### E.2 EAS production build
```bash
eas build --profile production --platform ios
```
- [ ] Build succeeds without warnings
- [ ] Build log mentions privacy manifest (`PrivacyInfo.xcprivacy`)
- [ ] No deprecated-API warnings about IDFA / IDFV

### E.3 TestFlight smoke
- [ ] Install build on real iPhone
- [ ] Walk every section of this checklist on real device
- [ ] Crash-free for full 5-minute walkthrough
- [ ] AI requests succeed (Gemini reachable)
- [ ] City lookup succeeds (Nominatim reachable)
- [ ] Push notifications can be enabled (or denied without crash)

### E.4 Network behavior in airplane mode
- [ ] App opens in airplane mode (because local-first)
- [ ] Onboarding can be completed up to step 7 (city lookup will fail gracefully — show "no internet" state)
- [ ] Already-cached chart still loads
- [ ] AI requests fail gracefully with a "no internet" message rather than crashing

---

## F — Reviewer note (paste this verbatim into App Review Information)

```
Hi reviewer,

This is a substantial repositioning of our previously rejected submission (1.0.6, rejected under 4.3(b) on 2026-01-23).

KEY CHANGES IN THIS VERSION
1. The app is now a relationship-mapping tool. The default tab is "Circle" — a list of the people in the user's life with relationship-specific insight.
2. Daily-horoscope content is demoted to a secondary tab ("Today") and reframed as a weekly context briefing.
3. Sign-in is removed entirely. The app is fully usable without an account.
4. In-app purchases and subscriptions are removed. Reports are free.
5. The app does not contain "Sign in with Apple" because no third-party login is offered.
6. AI-generated content is clearly labeled.
7. iPad support is disabled for this initial version.

DEMO ACCOUNT
Not required — the app is local-first and works without sign-in. Onboarding takes ~2 minutes (enter name, birth date, time, city).

PRIVACY
All user data and all data about people the user adds is stored locally in SQLite on the device. AI requests are sent to Google's Gemini API without account identifiers. The full privacy policy is at https://celestia.app/privacy.

CONTACT
support@celestia.app — we'll respond within 24 hours to any review questions.

Thank you for your time.
```

---

## G — Final go/no-go

Before clicking **Submit for Review**:

| Question | Required answer |
|---|---|
| Has every section A–F passed? | YES |
| Does the live Privacy Policy URL return text? | YES |
| Does the live Terms URL return text? | YES |
| Has the build been TestFlight-tested on a real iPhone? | YES |
| Is the encryption question answered No? | YES |
| Is the version number > 1.0.6? | YES (1.1.0) |
| Has the reviewer note been pasted? | YES |
| Is iPad slot empty? | YES |
| Is screenshot 1 the Circle people grid? | YES |
| Is the app free with no IAP? | YES |
| Does the description have 0 mentions of "horoscope"? | YES |

If every answer is YES → **Submit**.

If any is NO → fix and re-walk the relevant section.
