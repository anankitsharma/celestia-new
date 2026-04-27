# Celestia iOS — Resubmission Plan
## Master overview

**Rejection date:** 2026-01-23
**Submission ID:** 5e010580-14b8-4eed-9b57-49185cbd8834
**Version reviewed:** 1.0.6 (build 5) submitted as `Celestia Astrology & Horoscope`
**Review device:** iPad Air (5th gen)
**Cited guideline:** 4.3(b) Design — Spam (saturated category)

---

## How this plan is organized

This is the master overview. The 9 companion documents go deep on each area:

| File | Purpose |
|---|---|
| `00-resubmission-plan.md` (this file) | Strategy, positioning, execution timeline, summary |
| `01-code-changes.md` | File-by-file code instructions with snippets — the runbook |
| `02-listing-copy.md` | Every App Store Connect field, copy/paste-ready |
| `03-screenshot-spec.md` | The 6 screenshots, frame-by-frame |
| `04-privacy-policy.md` | Hostable Privacy Policy text |
| `05-terms-of-service.md` | Hostable Terms of Service text |
| `06-app-store-connect-fields.md` | Field-by-field ASC setup |
| `07-compliance-matrix.md` | Every Apple guideline this app touches |
| `08-pre-submission-checklist.md` | Final reviewer-eye walkthrough before Submit |
| `09-risk-register-and-roadmap.md` | What could still get rejected + post-approval roadmap |

**Read order for a fresh contributor:**
1. This file (strategic context, ~10 min read)
2. `07-compliance-matrix.md` (high-level audit, ~5 min)
3. `01-code-changes.md` (detailed runbook, ~20 min)
4. `02-listing-copy.md` + `03-screenshot-spec.md` (when ready to fill ASC)
5. `04-privacy-policy.md` + `05-terms-of-service.md` (when ready to host legal docs)
6. `06-app-store-connect-fields.md` (during ASC setup)
7. `08-pre-submission-checklist.md` (right before clicking Submit)
8. `09-risk-register-and-roadmap.md` (if rejection happens / for v1.1+ planning)

---

# 1. WHAT APPLE ACTUALLY SAID — and what it means

Apple's exact words:
> "Your app primarily features astrology, horoscopes, palm reading, fortune telling or zodiac reports that duplicate the content and functionality of similar apps in a saturated category."

> "These app features may be useful, informative or entertaining, and your app may include features or characteristics that distinguish it. However, there are already enough of these apps on the App Store."

> "We encourage you to reconsider your app concept and submit a new app that provides a unique experience not already found on the App Store."

## What this rejection is *not* saying
- Not that the code is broken
- Not that the design is poor
- Not that AI features are disallowed
- Not that astrology apps are banned in general

## What it *is* saying
- The reviewer pattern-matched the app to the saturated category in **under 90 seconds**, almost certainly from: app title (`Astrology & Horoscope`), screenshots, and the first screen they saw on the iPad.
- Apple's category-defining list is explicit: **astrology, horoscopes, palm reading, fortune telling, zodiac reports**. Your title used two of those five words.
- Apple offered the **PWA path** as the "polite escape valve." That's the tell that they don't want another native astrology app on the store.
- A reviewer rejecting under 4.3(b) is **not arguing originality** — they are enforcing a category quota. You don't change their mind by pointing out features they missed; you change it by **changing what the app is**.

## The single sentence summary

> The app's title declared category membership; the screenshots/listing reinforced it; the reviewer applied the category-saturation default and rejected. **Same outcome will recur on resubmission unless the app's *primary feature* changes — not just the marketing.**

---

# 2. THE STRATEGIC RESPONSE

We resolved this in earlier discussion. Recapping for permanence:

## The decision: ship Shape A as v1

- **Free, no auth, no IAP** at first launch
- **Reposition** as a **Relationship Compass** that uses astrology as one input
- Strip every surface that pattern-matches to the saturated category
- Earn approval, then build back features in v1.1+

## Why Shape A
1. **Subscription paywall on first launch** is one of the strongest 4.3(b) reinforcement signals reviewers see in astrology apps. Removing it removes a flag.
2. **Sign in with Apple gap** (4.8 hard reject) goes away if there's no third-party login at all.
3. **Compliance attack surface shrinks** by ~70%. Fewer flags = clearer reviewer head-space to evaluate the *positioning* change.
4. **No iOS revenue exists today.** The opportunity cost of v1 being free is zero.
5. Adding subscription/auth in v1.1 to an *already-approved* app is routine. First approval is the gate.

## The positioning angle: **Relationship Compass**

The app is a **relationship-mapping tool**. Astrology is the engine. The user's job is: *understand the people in my life better.*

- Default tab: **Circle** (8 relationship types)
- Today / Chart / Ask AI / Reports become *supporting* surfaces — they reinforce the relationship lens
- App store listing leads with relationships, not astrology
- Screenshots open with Circle, not Today
- Title: **does not contain** "astrology," "horoscope," "zodiac," "fortune," or "tarot"

## What the reviewer should think in 90 seconds
> "This is a relationship app that uses astrology data to surface insights about people. Different from horoscope apps. Approved."

That sentence is the entire goal of the resubmission.

---

# 3. THE NEW LISTING (App Store Connect)

## 3.1 App Name

**Old:** `Celestia Astrology & Horoscope` ← contained two banned-category words
**New (pick one before submission):**

| Candidate | Subtitle pairing | Risk |
|---|---|---|
| **Circle: Relationship Compass** | "Understand the people in your life" | 🟢 Best — relationship-led, no category words |
| **Celestia: Relationship Compass** | "Understand the people in your life" | 🟢 Keeps brand, drops category words |
| **Bond: Map Your People** | "A new way to understand connection" | 🟢 Cleanest break, weakest brand carry |
| **Celestia: People & Patterns** | "Understand the people who matter" | 🟡 Vaguer |

**Recommended:** `Celestia: Relationship Compass`. Keeps brand equity from existing Android Play Store users. Drops "Astrology & Horoscope" — the words the reviewer literally quoted.

## 3.2 Subtitle (30 chars)

| Candidate | Length |
|---|---|
| `Understand the people you love` | 30 ✅ |
| `Map every relationship` | 22 ✅ |
| `Decode the people in your life` | 30 ✅ |

**Recommended:** `Understand the people you love`

## 3.3 Promotional Text (170 chars)
> Celestia turns birth-chart data into a clear map of how you and the people you love actually connect. Eight relationship types, real synastry, AI-assisted insight.

## 3.4 Description (first 3 lines matter most — that's what's visible without "more")

**Old (4.3(b)-triggering) opening:**
> ✨ Celestia — the astrology app that actually gets you...

**New opening (lead with the relationship frame):**
```
Why do you click with some people instantly and clash with others?

Celestia is a relationship compass. Add the people who matter — partner, friend, parent, sibling, colleague — and see how each connection actually works.

Built on real birth-chart data, Celestia turns astrology from a daily horoscope into a tool for understanding the people in your life.
```

Then the rest of the description leads with **Circle**, demotes daily horoscope to halfway down, and closes with the educational layer + privacy story.

See `01-listing-copy.md` (companion file) for full description copy when ready.

## 3.5 Keywords (100 char limit)
**Old:** astrology, horoscope, birth chart, compatibility, AI, zodiac, daily, transit
**New:** relationship, compatibility, friendship, family, couples, communication, connection, synastry

Drop: horoscope, astrology, zodiac, fortune, tarot, daily, transit
Keep: compatibility, synastry (these read as relationship terms even if they're astro-derived)

## 3.6 Category

**Old:** Lifestyle (likely)
**New:** **Lifestyle** still — but consider **Reference** as alternative.
- *Do not* select **Entertainment** if "horoscope" appears anywhere — that's the saturated bucket.
- Avoid **Health & Fitness** — would re-trigger 5.5 / wellness scrutiny.

## 3.7 Age Rating

- Set to **17+** for AI-generated content (Apple's 2024 generative-AI rating policy).
- This also signals seriousness; reviewers don't worry about minors making relationship judgments based on the app.

## 3.8 What's New (release notes)

For a *new* app submission this isn't shown, but for the resubmission flow Apple may show "Version 1.0":
> A clear, calm map of the people in your life — partner, family, friends, colleagues. Add anyone, see how you actually connect.

---

# 4. SCREENSHOTS (the reviewer's 90-second decision)

The screenshots determine 4.3(b) outcome more than the description does. Reviewer scrolls, never reads the long description.

**Required:** 6.7" iPhone (mandatory) + iPad Pro 12.9" (mandatory if iPad supported — for now we should *disable iPad* to remove that surface area; see Section 7).

## 4.1 Screenshot 1 — the make-or-break frame

**Goal:** in one glance, communicate "this is a relationship app."

- Hero: a **Circle constellation view** showing 4-6 people-cards (Partner, Best Friend, Mom, Boss, etc.)
- Each card shows a name, a relationship-type badge, and a connection score
- Top text overlay: **"All the people who matter — in one place"**
- Background: app's actual UI, not a marketing illustration

**What it must NOT show:** daily horoscope card, zodiac wheel, "your sun sign is...", AI chat bubble.

## 4.2 Screenshot 2 — relationship deep dive

A single relationship's detail view: "How you and Sarah actually click."
- Connection score
- 3 strengths, 3 friction points
- A specific, situational insight (no zodiac glyphs visible in this frame)

## 4.3 Screenshot 3 — Ask AI but framed as relationship advisor

The chat screen with a question like:
> "Why does my mom always feel hurt when I set boundaries?"

Response excerpt visible. **Do not show questions like "what does my Mercury retrograde mean."**

## 4.4 Screenshot 4 — Today, but as a relationship-context briefing

The Today screen reframed as "how today affects the people in your life":
- Hero text: "This week's conversations to have"
- Underneath: 2-3 relationship-targeted prompts (not horoscope items)

## 4.5 Screenshot 5 — Chart but as "how *you* show up to others"

Birth chart wheel + caption:
> "How you come across to people — your communication style, what you need to feel safe, what overwhelms you."

(Caption framing matters — the same chart that read as "natal chart" before now reads as "self-other lens.")

## 4.6 Screenshot 6 — Reports, framed as relationship reports

Report cards: **"Love Compass"**, **"Family Patterns"**, **"Career & Colleagues"**, **"Friendship Dynamics"** — *not* "Lunar Cycle Report" or "Year Ahead." (Even if the underlying content is astrology, the framing is relational.)

## 4.7 Optional Screenshot 7 — privacy & trust

Tile: "Your data stays on your device. Always."

## What screenshots must NOT contain
- The word "horoscope"
- The word "fortune"
- The word "tarot"
- A daily horoscope card as the visual hero of any screenshot
- A zodiac sign emoji in the screenshot caption (♈♉♊ etc.) — these are saturated-category visual signals
- Mystical decorative emojis (🔮✨🌙) on captions — keep captions plain

## Required asset format
- 6.7" iPhone: 1290 × 2796 px (or 1284 × 2778) — at least 3 screenshots, max 10
- iPad Pro 12.9": **only if iPad support is on** — see Section 7 — would require 2048 × 2732
- All screenshots in **portrait**

---

# 5. CODE CHANGES

Working directory: `/Users/apple/Documents/Expo apps/Celestia-new/iOS-version/`
Branch (parent repo): `ios-v1-resubmission` (already created on 2026-04-25)

## 5.1 Block — strip the onboarding paywall

**File:** `src/screens/OnboardingFlowScreen.js`

| Action | Detail |
|---|---|
| Remove `renderSoftPaywall` | Function lives ~line 614 |
| Remove `renderReassurance` | Function lives ~line 647 |
| Remove `renderHardClose` | Function lives ~line 679 |
| `TOTAL_STEPS` | Change `14` → `11` |
| Step router | In `renderStep` switch, drop cases 12, 13, 14 |
| `selectedPlan` state | Remove |
| End-of-flow CTA | Step 11 ("Daily Hook") `Continue` button now calls `finishOnboarding()` |
| `finishOnboarding` | Always `navigation.replace('Main')`. Drop the `if (user)` branch and the Auth navigation |

**Compliance wins:** kills 3.1.1 (hardcoded prices), 3.1.2 (auto-renew disclosure), 2.3.1 (testimonials), 2.3.7 (strikethrough pricing).

## 5.2 Block — strip the auth surface

**Files:**

| File | Change |
|---|---|
| `src/screens/SplashScreen.js` | Remove "Already exploring? Sign in" link (lines ~91–95) |
| `src/navigation/AppNavigator.js` | Remove `AuthScreen` import + stack registration |
| `App.js` | Remove `AuthProvider` wrapper + `useAuth` import |
| `src/contexts/AuthContext.js` | Leave file in place (do not delete — needed for v1.1) |

**Compliance wins:** kills 4.8 (Sign in with Apple requirement), reduces 5.1.1 nutrition-label scope.

## 5.3 Block — strip RevenueCat / IAP gates (already partially patched for Expo Go)

**Files:**

| File | Change |
|---|---|
| `App.js` | Remove `RevenueCatProvider` wrapper |
| `src/screens/HomeScreen.js` | Remove `useRevenueCat` import + any premium gates |
| `src/screens/ChatScreen.js` | Remove the 10-message free quota; chat is unlimited in v1 |
| `src/screens/CompatibilityScreen.js` | Remove premium gates on adding people |
| `src/screens/ReportsScreen.js` | Make all reports free; remove purchase flow |
| `src/screens/ProfileScreen.js` | Remove "Upgrade" / "Manage Subscription" rows |
| `src/screens/OnboardingFlowScreen.js` | Already covered in 5.1 |
| `src/navigation/AppNavigator.js` | Remove `PaywallScreen` import + stack registration |

Files to leave in place untouched (v1.1 reactivates):
- `src/contexts/RevenueCatContext.js`
- `src/services/revenueCatService.js`
- `src/screens/PaywallScreen.js`

**Compliance wins:** kills 3.1.1 / 3.1.2 entirely.

## 5.4 Block — repositioning (the 4.3(b) fix)

**File:** `src/navigation/AppNavigator.js`

Change tab order:

```js
// Old
<Tab.Screen name="Today" component={HomeScreen} />
<Tab.Screen name="AskAI" component={ChatScreen} />
<Tab.Screen name="Chart" component={ChartScreen} />
<Tab.Screen name="Circle" component={CompatibilityScreen} />
<Tab.Screen name="Reports" component={ReportsScreen} />

// New — Circle is default + first tab
<Tab.Screen name="Circle" component={CompatibilityScreen} />
<Tab.Screen name="Today" component={HomeScreen} />
<Tab.Screen name="Chart" component={ChartScreen} />
<Tab.Screen name="AskAI" component={ChatScreen} options={{ tabBarLabel: 'Ask' }} />
<Tab.Screen name="Reports" component={ReportsScreen} />
```

**File:** `src/components/TabBar.js`

Update tab labels and icons so **Circle** has the most prominent position.

**File:** `app.json`

```json
{
  "expo": {
    "name": "Celestia",
    ...
    "ios": {
      "supportsTablet": false,   // <-- iPad disabled, see Section 7
      ...
    }
  }
}
```

App display name in `infoPlist` stays "Celestia" — the App Store listing carries the new name, no need to change the home-screen icon label.

## 5.5 Block — language sweep

**Goal:** strip "horoscope" / "fortune" / "destiny" / "predict" / "manifest" from anything a reviewer can see in 60 seconds.

Files to sweep with caution (don't remove astrology terminology — only replace category-trigger words):

| File | Replacements |
|---|---|
| `src/screens/HomeScreen.js` | "horoscope" → "briefing"; remove "predict" / "destiny" |
| `src/screens/OnboardingFlowScreen.js` | "Not sun-sign garbage" → "Real, personal" |
| `src/screens/ReportsScreen.js` | Report names: "Lunar Cycle" → "Cycles & Energy"; "Year Ahead" → "Year of Patterns" |
| `src/screens/ChatScreen.js` | Suggested-question rotation: remove "Will this situationship go anywhere?", "What signs should I avoid dating?", "Is Mercury retrograde messing with me?" |
| `src/screens/PaywallScreen.js` | Variant titles "Whispers from the Stars" / "Align with the Divine" / "Sacred Moon Rituals" — drop entire screen anyway (5.3) |

## 5.6 Block — the compliance fixes that survive v1

Even with Shape A, these still need landing:

### 5.6.1 Functional Privacy Policy + Terms links

**Prereq:** host both at public URLs (GitHub Pages / Notion page). Owner: product. Estimated 30 min.

**File:** `src/screens/ProfileScreen.js`

Add a "Legal" section near the bottom:

```jsx
<TouchableOpacity onPress={() => Linking.openURL('https://celestia.app/privacy')}>
  <Text>Privacy Policy</Text>
</TouchableOpacity>
<TouchableOpacity onPress={() => Linking.openURL('https://celestia.app/terms')}>
  <Text>Terms of Service</Text>
</TouchableOpacity>
```

App Store Connect → Privacy Policy URL field must also be filled.

### 5.6.2 AI disclaimer

**Files:**

| File | Disclaimer location |
|---|---|
| `ChatScreen.js` | Small footer line above input: `AI-generated · for reflection, not advice` |
| `HomeScreen.js` | Tiny line under daily insight card: `AI-generated · for reflection only` |

### 5.6.3 Partner-data consent modal

**File:** `src/screens/CompatibilityScreen.js`

Before saving a non-self profile (`type: 'partner' / 'friend' / etc.`), show a one-time modal:

> Adding someone else
>
> By adding this person, you confirm they've shared their birth details with you. Their data stays on your device.
>
> [Cancel] [I confirm]

Persist a flag (`AsyncStorage` key `celestia_partner_consent_v1: true`) so the modal shows once per fresh install.

### 5.6.4 Account deletion → "Reset App Data"

**File:** `src/screens/ProfileScreen.js`

Without auth, "Delete Account" reads strangely. Rename to **"Reset App Data"**:

- Wipes SQLite tables
- Wipes AsyncStorage
- Returns to Splash → Onboarding

This satisfies 5.1.1(v) for non-authed apps.

### 5.6.5 Remove fabricated testimonials

If any testimonial UI survives the strip in 5.1, remove it. (Step 13 of onboarding had Mia/Jade/Sara — already gone via 5.1.)

### 5.6.6 PostHog analytics

**File:** `App.js`

Verify PostHog config disables IDFA:
```js
options={{
  host: 'https://us.i.posthog.com',
  enableTracking: true,
  disableSessionRecording: true,
}}
```

If unsure, **remove PostHog entirely for v1** — analytics value is low pre-launch and removal eliminates ATT requirement (5.1.2). Reintroduce in v1.1.

---

# 6. ICON, SPLASH, IN-APP VISUAL TWEAKS

These are the visual signals the reviewer sees post-install in 30 seconds.

## 6.1 App icon

**Current:** gold orb on dark gradient — saturated-category visual default.

**Two options:**
- **A.** Keep current icon (acceptable — many non-astrology apps use celestial visuals)
- **B.** Refresh to something more "relationship/people" coded — e.g., overlapping circles, or a constellation forming a knot/pair shape

**Recommendation:** keep current icon for v1. Test theory: the reviewer has already pattern-matched on title before they see the icon at home-screen scale. Icon revamp is a v2 polish.

## 6.2 Splash

**Current tagline:** "NAVIGATE YOUR COSMOS"
**New tagline:** **"UNDERSTAND THE PEOPLE YOU LOVE"**

File: `src/screens/SplashScreen.js` line ~82.

Also update the CTA copy:
- Current: `Begin Your Journey ✦`
- New: `Map My People`

## 6.3 First in-app screen the reviewer sees

After the splash, the reviewer hits Onboarding step 1 ("Hook"). Update copy:

**Current:** "The stars remember when you were born / Your birth chart is a fingerprint."
**New:** "Every relationship in your life has a pattern. We help you see it."

This is the single highest-leverage copy change in the app. It is what the reviewer reads after 8 seconds of app-open.

---

# 7. iPad SUPPORT — turn it OFF for v1

**Why this matters:** the original rejection was reviewed on **iPad Air**. iPad layouts are also where saturated-category apps look most generic (stretched phone UI on a tablet reinforces "another one"). And iPad is rarely the buy-driver for an astrology-adjacent app.

**File:** `app.json`
```json
"ios": {
  "supportsTablet": false,
  ...
}
```

This forces the App Store to serve only the iPhone version. Removes:
- iPad screenshot requirement (saves 2-3 days of design work)
- The "stretched phone app on iPad" reviewer perception
- A whole device class of layout testing

Re-enable in v2 once iPad-specific layouts exist.

---

# 8. PRIVACY NUTRITION LABEL (App Store Connect)

After Shape A strip-down, the label simplifies dramatically. Declare:

| Category | Used | Linked to identity | Tracking |
|---|---|---|---|
| Contact Info | No | – | – |
| Health & Fitness | No | – | – |
| Financial Info | No | – | – |
| Location | **Coarse** (birth city via Nominatim) | No | No |
| Sensitive Info | No | – | – |
| Contacts | No | – | – |
| User Content | **Yes** (chart, journal, partner profiles — local SQLite) | No | No |
| Browsing History | No | – | – |
| Search History | No | – | – |
| Identifiers | **Yes** if PostHog kept (anonymous device ID) | No | No |
| Purchases | No | – | – |
| Usage Data | **Yes** if PostHog kept | No | No |
| Diagnostics | **Yes** if PostHog kept (crash logs) | No | No |
| Other Data | **Yes** — birth data of people the user adds (Other Users' Data) | No | No |

If PostHog is removed (recommended, see 5.6.6), the Identifiers / Usage / Diagnostics rows go away.

---

# 9. EXECUTION ORDER

Estimated total: **2–3 working days** of code + **1–2 working days** of design (screenshots, icon).

| Day | Block | Files | Time |
|---|---|---|---|
| 1 AM | 5.1 strip onboarding paywall | OnboardingFlowScreen.js | 1.5 hr |
| 1 AM | 5.2 strip auth surface | SplashScreen, AppNavigator, App.js | 1.5 hr |
| 1 PM | 5.3 strip RevenueCat | App.js + 6 screens | 3 hr |
| 1 PM | Smoke test in Expo Go | (run) | 30 min |
| 2 AM | 5.4 reposition tabs | AppNavigator, TabBar | 1 hr |
| 2 AM | 6.2 splash + 6.3 onboarding step 1 copy | SplashScreen, OnboardingFlowScreen | 30 min |
| 2 AM | 5.5 language sweep | 5 files | 2 hr |
| 2 PM | 5.6.1 host privacy/terms + wire links | ProfileScreen + external hosting | 2 hr |
| 2 PM | 5.6.3 partner consent modal | CompatibilityScreen | 2 hr |
| 2 PM | 5.6.2 AI disclaimer | ChatScreen, HomeScreen | 30 min |
| 3 AM | 5.6.4 reset-app-data rename | ProfileScreen | 30 min |
| 3 AM | 5.6.6 PostHog decision (keep or remove) | App.js + analytics.js | 1 hr |
| 3 AM | 7. iPad off | app.json | 5 min |
| 3 PM | Verification checklist (Section 11) | — | 2 hr |
| 3 PM | EAS production build | — | 1 hr |
| Parallel (Day 2-4) | Listing rewrite (Section 3) + screenshots (Section 4) | — | 1-2 days |
| Day 5 | TestFlight smoke + submit | — | 1 hr |

---

# 10. PRE-SUBMISSION VERIFICATION CHECKLIST

Run through this *as the reviewer*. Anything that fails = do not submit.

## 10.1 Cold-launch flow (reviewer's first 90 seconds)

- [ ] App opens to Splash
- [ ] Splash tagline says "UNDERSTAND THE PEOPLE YOU LOVE" (or chosen variant)
- [ ] Splash CTA says "Map My People" (no "Begin Your Journey ✦")
- [ ] No "Sign in" / "Already exploring?" link visible anywhere
- [ ] Onboarding step 1 hook text is relationship-led, not "stars remember"
- [ ] Onboarding has 11 steps total — no paywall, no testimonials
- [ ] Onboarding ends on **Circle** tab, not Today
- [ ] Default tab on app open = **Circle**
- [ ] Tab bar order: Circle / Today / Chart / Ask / Reports

## 10.2 Listing/metadata

- [ ] App Store name does **not** contain: astrology, horoscope, zodiac, fortune, tarot, palm
- [ ] Subtitle does **not** contain those words
- [ ] First sentence of description is relationship-led
- [ ] Keywords list excludes: horoscope, astrology, zodiac, fortune, tarot, daily, transit
- [ ] Screenshot 1 shows Circle, not Today
- [ ] No screenshot caption uses zodiac glyphs (♈♉♊…) or 🔮 ✨ 🌙 emoji

## 10.3 Compliance

- [ ] No "Continue with Google" / "Continue with Apple" anywhere
- [ ] No subscription / paywall / "Free Trial" UI anywhere
- [ ] No "Restore Purchases" button (because no IAP exists)
- [ ] Privacy Policy link in Profile opens public URL successfully
- [ ] Terms of Service link in Profile opens public URL successfully
- [ ] Privacy Policy URL field set in App Store Connect
- [ ] AI disclaimer visible on chat screen + daily insight card
- [ ] Partner-add consent modal appears the first time a non-self profile is saved
- [ ] "Reset App Data" works (wipes SQLite + AsyncStorage)
- [ ] App rated **17+** in App Store Connect

## 10.4 Build sanity

- [ ] EAS production build succeeds
- [ ] `app.json` `ios.supportsTablet: false`
- [ ] Bundle ID unchanged (`com.celestia.app`)
- [ ] Version bumped to **1.0.7** or **1.1.0** (don't reuse 1.0.6)
- [ ] Build number incremented
- [ ] No console errors in TestFlight smoke test
- [ ] Crash-free on iPhone 14, 15, 16 (Pro and base) at minimum
- [ ] App functions fully without internet **except** for Gemini calls (which should fail gracefully)

## 10.5 Reviewer notes (App Store Connect → "Notes for Apple")

Write a short note that frames the resubmission honestly:
> Hi reviewer — this is a substantial repositioning of our previous submission. We now lead with relationship mapping (the Circle tab is the default) rather than daily horoscopes. Astrology is the engine but not the primary feature. Sign-in and subscription are removed for this initial version. Our goal is a calm, useful relationship tool. Thank you for your time.

Don't argue 4.3(b). Don't say "we're not in the saturated category." Just describe what's there.

---

# 11. RISK REGISTER — what could still get rejected

Ordered by likelihood.

### Risk 1: 4.3(b) again (likelihood: low-medium if Sections 3, 4, 5.4 land cleanly)

**Mitigation:** If rejected again on 4.3(b), Apple will say something like "the app still primarily features astrology." That signals our screenshots / first screen are still reading as horoscope-app. Recovery:
- Move Today tab off the tab bar entirely → put it under Circle as "today's relationships"
- Strip ChartScreen from main navigation; make it a Profile sub-screen
- Re-screenshot

### Risk 2: Sign-in-with-Apple flag despite no auth (likelihood: very low)

If the AuthContext file remains in the bundle, a careful reviewer might suspect hidden auth. Mitigation: dead-code-strip `AuthContext.js` for v1 build (replace with stub provider). Or fully delete and reintroduce in v1.1.

### Risk 3: AI content concerns (likelihood: low)

Reviewer might flag chat as giving "advice." Mitigation: AI disclaimer (5.6.2) + add a "Report response" affordance in chat for v1.1 if asked.

### Risk 4: Privacy policy doesn't cover partner data (likelihood: medium)

Reviewer scans the privacy policy for what data is collected. If partner-data isn't disclosed, that's a cite-and-reject. Mitigation: privacy policy must include this paragraph:

> "Data about other people. When you add a partner, friend, family member, colleague, or other person to your Circle, you may enter their name, birth date, birth time, and birth city. This information is stored on your device only and is not transmitted to Celestia's servers. When you request AI insight about a relationship, this data is sent to Google's Gemini API to generate the analysis. By adding another person, you confirm they have shared this information with you for this purpose."

### Risk 5: Hardcoded API keys flagged (likelihood: very low for review, medium for security)

`GEMINI_KEY` is in `geminiService.js` source. Apple won't flag this; security researchers will extract it. Mitigation: post-approval, route Gemini calls through a Supabase edge function. v1.1 work.

### Risk 6: PostHog identifier flag (likelihood: low if removed; medium if kept)

If PostHog is kept and Privacy Nutrition Label is wrong, this reads as a 5.1.2 violation. Mitigation: remove PostHog for v1 (recommended) OR make sure label is exact.

### Risk 7: Reviewer reaches the chat screen and tests prompts (likelihood: low)

If reviewer asks "should I leave my partner?" and the AI gives a confident answer, that's a 2.3.1 / 5.5 risk. Mitigation: AI disclaimer + check Gemini safety settings are on default-strict.

---

# 12. POST-APPROVAL ROADMAP (for context, not for v1)

Once v1 is approved, the gate is open. v1.x and v2 priorities:

- **v1.1** — add Sign in with Apple + Google + cloud backup
- **v1.2** — add subscription tier (with proper StoreKit, EULA, T&P links from day one)
- **v1.3** — re-introduce Reports as one-time purchases
- **v2.0** — iPad support with native iPad layouts
- **v2.1** — re-introduce Today as a standalone "daily energy" surface (now legitimate because the app is established as a relationship tool)

Each of these is a normal Apple review with no 4.3(b) heat — once the app is in the store as a relationship tool, future versions are evaluated against that established positioning.

---

# 13. SOURCE DOCS

- `00-resubmission-plan.md` (this file) — strategic + execution plan
- `01-listing-copy.md` — full App Store description, keywords, what's-new (to be written before submission)
- `02-screenshot-spec.md` — pixel-level guide for each screenshot (to be written by design)
- `03-privacy-policy.md` — public privacy policy text to host (to be written legal/product)
- `04-terms.md` — public terms text to host (to be written legal/product)

---

**End of plan.**
