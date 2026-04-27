# 15 — Tab-by-Tab Balance Review
## Senior indie-dev review: target audience (Western astrology girl, 18-30, iOS-heavy) vs Apple guidelines

---

## The principle

> **Default presentation = relationship app (Apple-safe). One-tap discovery = full astrology depth (audience-served).**

Two windows. The reviewer sees a relationship & self-discovery app in their 6-minute walk. The user — once she opens settings or any "Show me more" affordance — gets the full astrology product she downloaded for.

The mistake to avoid in either direction:
- Strip too much astrology → app feels generic, audience bounces, retention dies, no TikTok material
- Surface too much astrology → reviewer rejects under 4.3(b), app never reaches audience

---

## TODAY tab

### What this audience wants from Today
1. A daily reason to open the app (habit loop)
2. A reveal that feels eerie-personal — screenshot-worthy
3. A reason to come back tomorrow ("what's mine going to be?")
4. A quick win in <30 seconds

### What Apple rejects on Today
1. Categorized horoscope grids (Love/Career/Vitality/Growth/Social)
2. Moon phase + planet positions as primary chrome
3. "Today's Reading" / "Daily Horoscope" labels
4. Transit alerts as central feature
5. Predictive language ("Today brings…", "You will…")

### Current state (post-cleanup)

| Section | Verdict |
|---|---|
| Daily Reflection prompt | ✅ Apple-safe + audience neutral |
| Quick-add connection | ✅ Apple-safe + audience-loved (drives Connections) |
| Drift alert | ✅ Both — feels caring, no astrology trigger |
| Navigator Briefing | ✅ The screenshot-worthy daily insight. Apple-safe (relational-framed AI). Audience gets her daily reveal. |
| Right Now (Today's Energy chip + CTA) | 🟡 Apple-safe but audience-thin. The chip alone doesn't satisfy the daily reveal craving. |
| Previously On | ✅ Continuity — both windows like this |
| Journal card | ✅ Both |
| Evening Reflection | ✅ Both |
| Sunday Week Reflection | ✅ Both |
| Quests / Badges | ✅ Engagement |
| Time-adaptive prompts | ✅ Both |

### Audience gap on Today
**The Navigator Briefing IS the daily reveal — but it's not built for sharing.** The audience wants to screenshot something and post it. Currently the briefing card has no share affordance. PDF §06 says: "Built-in 'share this insight' button on every output."

### Recommended edit
- Add a small **"Share ↗"** button to the Navigator Briefing card. When tapped, share text format: `{forecast.navigatorHeadline}\n\n{forecast.navigatorSummary}\n\n— Celestia · celestia.app`. No astrology jargon (already AI-protected by V1 prompt).
- This serves the TikTok mechanic without adding any 4.3(b) surface.

**Verdict: Today is 90% right. Add Share button to navigator card.**

---

## CONNECTIONS tab (formerly Circle)

### What this audience wants
1. The "I put me and my ex in this and it SCREAMED" moment (PDF viral template #1)
2. Compare themselves to specific named people
3. Photos / avatars per person
4. Visual fit indicator between two people
5. Add multiple types of relationships (boss, parent, sibling, etc.)
6. Eerie-specific compatibility analysis

### What Apple rejects
1. Pure synastry-language ("Mars trine Venus" / "Composite chart")
2. Zodiac glyphs as primary visual (♈♉♊…)
3. "Compatible souls" / "Soul mate match" type language
4. "Synastry" anywhere as a section label

### Current state

| Element | Verdict |
|---|---|
| 8 relationship types (Partner / Friend / Parent / Sibling / Boss / Colleague / Child / Other) | ✅ Strong differentiation. Audience-loved. |
| Zodiac-only mode for low-friction add | ✅ Good — fast add path |
| Score label range (Exceptional fit / Deeply in sync / Strong connection / Compatible / Growing together / Complex dynamic) | ✅ Softened from astrology language |
| Partner consent modal (5.1.1) | ✅ Apple-required, also good UX |
| Detail view dimensions (Communication / Emotional / Trust / Conflict) | ✅ Relational |
| Loading copy "Reading the patterns..." | ✅ Softened |

### Audience gap on Connections
1. **Detail view layout doesn't match PDF screenshot template.** PDF says: "Compatibility analysis fits in one screen with two names visible at the top." Need to verify our compat detail does this — two names at top, score below, dimensions, no scrolling for the screenshot moment.
2. **No share button on compatibility detail.** The "ex test" is THE viral mechanic. User wants to screenshot or share the result.
3. **No celebrity charts feature** (PDF mentions). Defer to v1.x — it's the "comparing me to my celebrity crush" template.

### Apple risk on Connections
- Adding a person still requires birth date — same astrology data flag. Mitigated by: it's now framed as personality blueprint input, partner-consent modal makes it feel professional, optional birth time/city.
- The detail page's score reasoning is AI-generated — V1_OVERRIDE protects the language.

### Recommended edits
1. **Add "Share this match"** button on compatibility detail (opens system share with score + names + one-line reason)
2. **Verify the detail view layout** — names at top, single-screen (no scroll for the headline moment)
3. **Add prominent "Add Someone" FAB** on the Connections empty state to drive first add

**Verdict: Connections is the killer feature. 85% right. Adding share button is the unlock for TikTok.**

---

## ASK tab (chat)

### What this audience wants
1. The "Ask anything at 3am" companion feel
2. Specific, eerie-accurate answers about the people in her life
3. Sass + warmth (not clinical, not woo-woo)
4. Quick suggested questions to bootstrap conversations
5. Voice input ("I just talked to her about my mom" energy)
6. Conversation history that remembers context

### What Apple rejects
1. "Ask your chart" / "What does your Mercury say" framing
2. "What's your horoscope today" prompts
3. AI claiming to predict the future
4. Fortune-telling tone

### Current state

| Element | Verdict |
|---|---|
| Suggested questions (relational-reworded) | ✅ Apple-safe |
| AI disclaimer ("AI-generated · for reflection, not advice") | ✅ Required by 1.4 / 5.5 |
| 3-part response structure (psychology lead → astrology mid-sentence → redirect close) | ✅ PDF-aligned, screenshot-perfect for TikTok |
| Share button on AI bubbles | ✅ TikTok mechanic |
| V1_LANGUAGE_OVERRIDE in system prompt | ✅ Forbids trigger vocab |
| Voice input | 🚫 **DEFERRED** (real audience gap) |

### Audience gap on Ask
1. **Voice input** — PDF wants this. Current implementation is text-only. The audience speaks to the app. Defer to v1.1 due to iOS speech permission complexity.
2. **Tone calibration** — risk that V1_OVERRIDE makes the AI feel too clinical. The audience wants the "best friend who happens to read charts" feel, not "therapist citing astrology in footnotes." The prompt change at task #52 already addressed this with the few-shot examples. Worth a TestFlight check.
3. **No "ask about a specific person" affordance** — could add a chip-bar above the input: "Ask about Sarah / Mom / Marcus" pulled from saved Connections. Would dramatically increase usage but adds work.

### Apple risk on Ask
- AI generates fresh text every conversation. The V1_OVERRIDE is the only thing protecting against "Mercury retrograde is messing with you" creeping in. **Reviewer will type provocative things to test.** The system prompt + Gemini's safety settings are the defense.
- Suggested chip prompts must NEVER mention "my chart". Already cleaned.

### Recommended edits
1. **Add a "Ask about {person}" chip strip** above suggested questions when Connections has any saved people. Quick win for usage.
2. **Verify Gemini system prompt is being applied** (we wrote it in geminiService.js V1_LANGUAGE_OVERRIDE). Confirm in build.
3. **Voice input — defer to v1.1** (real audience gap but iOS speech-to-text + permissions = 1-2 days work).

**Verdict: Ask is 80% right. Per-person chip strip is the highest-impact addition.**

---

## PROFILE tab

### What this audience wants
1. **A "this is ME" identity card she can screenshot** — the Cosmic ID
2. **Her Big Three (Sun / Moon / Rising)** displayed prominently — this is THE thing the audience comes for
3. **Streaks / badges / level** for engagement
4. **Settings she can tweak**
5. **Easy access to her birth chart** when curious
6. **Privacy / data control**

### What Apple rejects
1. Sun / Moon / Rising as primary identity chrome
2. Chart wheel as default Profile content
3. "Your Cosmic Identity" / "Your Astrology Profile" labels
4. Aggressive gamification
5. Reviewer expects: "this is a relationship app — why does Profile lead with sign chips?"

### The TENSION on Profile (the hardest balance)

This is where audience and Apple disagree most. The audience downloaded the app to see her Sun/Moon/Rising. Apple sees that as a horoscope-app tell.

**Our current solution:** astrology details are gated behind a Preferences toggle (default OFF for fresh installs). Profile shows: avatar, name, birth info, streak/XP/badges journey strip, Share Profile button, Preferences (with toggle), Deep Readings, Reset App Data.

### Current state

| Element | Verdict | Audience impact |
|---|---|---|
| Avatar + name + birth info | ✅ Both | Audience: "ok where's my chart" |
| Sign badges (♈ ♉ ♊) | ⚙️ Gated by toggle, default OFF | Audience: 🚫 not visible by default |
| Journey strip (Streak/XP/Badges) | ✅ Both like this | ✅ Engagement loop |
| Share My Profile button | ✅ Both | ✅ Audience screenshots this |
| Cosmic ID Card (renamed Your Profile) | ✅ Both | ✅ Audience-loved share asset |
| 8 PDF profile sections (Personality / Love / Communication / Family / Career / Shadow / Patterns / Year ahead) | ⚙️ Gated by toggle | 🚫 Audience can't find by default |
| Reports & Readings | ✅ Always visible | ✅ Audience win |
| Show astrology details toggle | ✅ Apple win | ⚠️ Discovery problem |
| Privacy / Terms / Support | ✅ 4.0 / 5.1.1 required | ✅ |
| Reset App Data | ✅ 5.1.1(v) required | ✅ |

### The discovery problem

**A reviewer with a fresh install never sees astrology in Profile.** ✅
**A real user with a fresh install also never sees astrology in Profile.** ⚠️

She has to find Preferences → "Show astrology details" toggle. Most users won't. They'll think "I gave you my birth date but where's my chart?" and bounce.

### Recommended edits

1. **Add a one-time "Welcome to your profile" banner** at the top of Profile (first 3 visits) that says: *"Tap below to see your full chart, signs, and patterns."* with a button that opens the toggle. After 3 dismissals, hides forever.
   - Apple sees: "an empowering settings nudge"
   - User sees: "oh, my chart is here, I can turn it on"
2. **Sign badges visibility — keep gated, but improve discovery** via the banner above
3. **Cosmic ID Card share asset** — verify it's discoverable. It IS (one tap below the journey strip). Good.

### Apple risk on Profile
- If the reviewer toggles "Show astrology details" ON during their walk-through, they see all the gated content. They probably won't (they don't read Settings). But if they do, the content is there but in a deep-tab — Apple has been tolerant of this in similar apps.

**Verdict: Profile structurally right. Add the discovery banner and we have the balance.**

---

## CROSS-CUTTING ISSUES

### 1. The "where's my chart?" discovery problem
Real users won't find the astrology toggle. Solution: one-time banner on first 3 Profile visits.

### 2. The "this feels too clinical" tone risk
V1 forbids astrology vocabulary. AI may overcorrect to dry/clinical. Mitigation: the few-shot examples in V1_LANGUAGE_OVERRIDE keep the warmth. Verify in TestFlight.

### 3. The "share this" mechanic
PDF §06 wants share buttons on every shareable insight. We have:
- ✅ Chat AI bubbles
- ❌ Navigator Briefing card on Today
- ❌ Compatibility detail on Connections
- ✅ Profile (Share My Profile)

Add: navigator briefing share + compatibility detail share. Both are quick wins.

### 4. Birth-data collection framing
Onboarding step 5 (framework citation) handles this well. Birth data is positioned as "personality blueprint input" alongside attachment + love languages. Apple-safe.

### 5. The 3-tab vs 4-tab decision
We have 4 tabs (Today / Connections / Ask / Profile). PDF agrees. Good.

### 6. Notification content
Already cleaned. Channels relabeled, astrology templates disabled. Good.

---

## SUMMARY — what to actually edit

### Tier 1 — high audience impact, ~1 hr (DO)

| # | Tab | Edit | Why |
|---|---|---|---|
| 1 | Today | Add "Share ↗" button to Navigator Briefing card | Audience: TikTok mechanic. Apple: zero risk (AI-protected text) |
| 2 | Profile | Add one-time discovery banner ("Tap to see your full chart") visible first 3 visits | Solves the "where's my chart" problem without showing astrology by default |
| 3 | Connections | Add "Share this match" button to compatibility detail | Audience: the ex-test viral template. Apple: zero risk |

### Tier 2 — substantial audience win, ~2 hr (CONSIDER)

| # | Tab | Edit | Why |
|---|---|---|---|
| 4 | Ask | Add "Ask about {person}" chip strip pulled from saved Connections | Doubles Ask usage. Apple: zero risk. |
| 5 | Connections | Add prominent FAB on empty state | First-add conversion |

### Tier 3 — defer

| # | Edit | Why |
|---|---|---|
| 6 | Voice input on Ask | iOS speech permissions + 1-2 days work. v1.1. |
| 7 | Celebrity charts feature | PDF v2. Post-approval. |
| 8 | Pattern across past partners | PDF v2 killer. Post-approval. |

---

## Audience trust: the unstated risk

The astrology-girl audience has a sixth sense for "watered-down astrology apps." They downloaded Co-Star because it's brutal. They downloaded The Pattern because it's eerie. They downloaded Sanctuary because it has live readers.

**If our v1 feels too sanitized, they'll uninstall in 7 days.** Apple-approval at the cost of audience activation is a hollow win.

The defensive moves:
- AI tone in chat must stay warm and direct (not clinical). Verify in TestFlight.
- Reveal moment in onboarding step 10 must still land — "Anxious-Preoccupied with intense-merging magnetism" is on-brand.
- Discovery banner on Profile MUST work — the audience needs to find their chart within 5 minutes of install.
- Share assets must look like Celestia — purple-gold gradient, distinctive (PDF §06).

If we land Tier 1 + Tier 2 above, the audience trust holds AND Apple approves. Both windows served.

---

## What's NOT recommended (and why)

- **Don't reintroduce paywall in v1.** PDF wants $9.99/mo. Our analysis: subscription paywall in v1 is the strongest 4.3(b)-adjacent reject. Reintroduce in v1.1 with cleaner StoreKit flow. Lose 6 weeks of revenue, gain approval.
- **Don't add voice input now.** iOS Speech Framework integration is 1-2 days, requires `NSSpeechRecognitionUsageDescription`, adds Privacy Nutrition Label scope. Worth it post-approval.
- **Don't add Celebrity Charts.** Three names (Zendaya / Harry Styles / Taylor Swift) appearing in-app is a celebrity-rights concern (5.2 IP). Defer to v2 with proper licensing.
- **Don't surface the astrology toggle as ON by default.** Apple's reviewer install IS a fresh install. Default-on means they see signs immediately. Default-off + discovery banner is the right balance.

---

## Final balance verdict

The current code is at ~85% balance. The remaining 15% is:
- 3 share buttons (audience win, zero Apple risk)
- 1 discovery banner (audience win, zero Apple risk)
- 1 per-person chip strip on Ask (substantial audience win, zero Apple risk)

**Total: 5 edits, ~3-4 hr, no Apple risk added.**

After these land, both windows are served:
- Apple sees: a relationship + self-discovery app with clean defaults
- The audience sees: her chart is one tap away, her insights are one tap to share, her people are one tap to compare
