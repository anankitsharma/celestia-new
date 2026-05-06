# Trial Retention — Implementation Status

Maps every recommendation from `07-trial-retention-psychology.md` and `08-trial-playbooks.md` to: what's already shipped, what's partial, and what's a clear gap. Plus prioritized fix list.

---

## Status table — by Cialdini principle

### Reciprocity

| Tactic | Status | Code reference |
|---|---|---|
| Welcome to Pro screen (3 hero cards) replacing native Alert | ✅ Shipped | `WelcomeToProScreen.js`, Sub-3 |
| Pro Insight card on Today (only Pro users) | ✅ Shipped | TIER2-D |
| Surprise insight rolls (D4 / D10 / D17 / D24) | ✅ Shipped | `surpriseInsightService.js`, P2.5 |
| Reveal statements re-surfaced at D7 + D30 | ✅ Shipped | CA-A4 + FINAL-4 |
| Pro week-1 recap (Day 7 of being Pro) | ✅ Shipped | TIER2-F |
| Free trial itself = reciprocity baseline | ✅ Shipped (configured per RevenueCat) | n/a |
| Onboarding chart calculation = personalized gift | ✅ Shipped | onboarding flow |
| Persistent chart accessible in Chart tab | ✅ Shipped | ChartScreen |

**Reciprocity score: 8/10.** Strongest principle in code today.

### Commitment & Consistency

| Tactic | Status | Code reference |
|---|---|---|
| Streak system (loss aversion via streak counter) | ✅ Shipped | `streakService.js` |
| Journal entries persist forever | ✅ Shipped | `JournalRepository` |
| Partners added to Circle persist | ✅ Shipped | `ProfileRepository` |
| XP / level system rewards consistency | ✅ Shipped | `xpService.js`, 5 tiers |
| 20 badges + 5 hidden surprise badges | ✅ Shipped | `badges.js` |
| Onboarding micro-commitments (motivation + pain + depth) | ✅ Captured | `OnboardingFlowScreen` |
| **Goal echo back during trial** ("You said you wanted X...") | ❌ NOT IMPLEMENTED | gap |
| **Streak-as-commitment surfaced as Pro-trial conversion lever** | ❌ NOT IMPLEMENTED | gap |
| Public commitment / share at D7 milestone | ⚠️ Share button exists; copy isn't framed as commitment | partial |

**Commitment score: 7/10.** Mechanical pieces strong. The verbal commitment-echo is missing.

### Social Proof

| Tactic | Status | Code reference |
|---|---|---|
| User counts ("Join X users") anywhere | ❌ Nothing | gap |
| Testimonials on PaywallScreen | ❌ Nothing | gap |
| "X% of users do Y" stats during trial-end push | ❌ Nothing | gap |
| Cohort framing ("Other Capricorn Suns this month felt...") | ❌ Nothing | gap |
| Friend / Circle social proof ("3 of your Circle are paid") | ❌ Nothing — not even backend exists | gap |
| Anonymous community insights ("1,247 Geminis felt off today") | ❌ P4 — needs backend | blocked |
| Press / authority logos on PaywallScreen | ❌ Nothing | gap |

**Social proof score: 0/10.** Largest principle gap by far.

### Authority

| Tactic | Status | Code reference |
|---|---|---|
| Editorial typography signals craft | ✅ Implicit | Playfair + DM Sans |
| Real chart wheel (not stylized) | ✅ Implicit | `ChartWheel.js` |
| Navigator framing in long-form briefings | ✅ Implicit | `geminiService.fetchExtendedForecast` prompt |
| Voice guide rewrite of pushes | ✅ Implicit | CA-B1b |
| **Explicit methodology source** ("Based on NASA JPL ephemeris") | ❌ Not stated anywhere | gap |
| **Astrologer-author bylines on reports** | ❌ Not stated | gap |
| **"Built using astronomy-engine library"** transparency | ❌ Not stated | gap |
| Founder credentials / team page | ❌ Not in app | gap |

**Authority score: 5/10.** Strong implicit; weak explicit.

### Liking

| Tactic | Status | Code reference |
|---|---|---|
| Personalized chart with reveal statements (D0) | ✅ Best-in-category | WelcomeScreen |
| Indecision-keyword journal mining → suggestion chip | ✅ Shipped | P2.6 |
| Briefing-mode rotation (Standard → Pattern → Partner → Archetype) | ✅ Shipped | P2.1 |
| AI chat with first chat pre-filled | ✅ Shipped | P1.1 + AND-6 streaming |
| Lapse cascade with partner-name / chat-thread / chart personalization | ✅ Shipped | P1.4 |
| D30 reveal-statement callback | ✅ Shipped | FINAL-4 |
| Pro daily insight referencing user's chart | ✅ Shipped | TIER2-D |
| Voice-guide-driven push copy | ✅ Shipped | CA-B1b voice rewrite |

**Liking score: 9/10.** Strongest principle in execution.

### Scarcity

| Tactic | Status | Code reference |
|---|---|---|
| Free trial (time scarcity) | ✅ Shipped (RevenueCat) | n/a |
| Trial-end push 2 days before charge | ✅ Shipped | Sub-2 + FINAL-3 voice |
| Pre-billing renewal reminder for annual | ✅ Shipped | EXTRA-6 |
| Subscription-ending alert (`willRenew === false`) | ✅ Shipped | FINAL-3 |
| **Adaptive trial-end timing for 3-day vs 7-day trials** | ❌ NOT IMPLEMENTED | gap (the borderline issue) |
| **D5-6 of 7-day trial: emphasis on what they'd lose** | ⚠️ Partial — current copy is informational | could be stronger |
| **3-day trial scarcity pacing** | ❌ Not adapted | gap |

**Scarcity score: 7/10.** Good for 7-day; underdone for 3-day.

### Unity

| Tactic | Status | Code reference |
|---|---|---|
| Implicit unity through brand voice | ✅ Strong | navigator framing |
| Audience persona documented | ✅ Yes | `plan/design-audit/01-target-audience.md` |
| **Explicit "for the Inner-Work Practitioner" copy** | ❌ Nothing | gap |
| **PaywallScreen tribe-naming** | ❌ Nothing | gap |
| **Cancel-flow save offer with unity framing** | ❌ Nothing | gap |
| User community / friends list | ❌ P4 — needs backend | blocked |

**Unity score: 3/10.** Implicit only.

---

## Net principle scorecard

| Principle | Score | Bottleneck |
|---|---|---|
| Liking | 9/10 | Personalization is best-in-category |
| Reciprocity | 8/10 | Trial mechanics + Welcome to Pro |
| Commitment | 7/10 | Goal echo + commitment naming missing |
| Scarcity | 7/10 | Adaptive trial-end timing for 3-day |
| Authority | 5/10 | Implicit only — no explicit cues |
| Unity | 3/10 | No tribe-naming copy |
| **Social Proof** | **0/10** | Nothing in code |

**Overall trial-conversion influence score: 5.6/10.**

The strong principles (Liking + Reciprocity) are doing most of the work. Adding social proof + unity copy + explicit authority would close the conversion gap meaningfully.

---

## Prioritized fix list — code-buildable

### Tier 1 — ship in next sprint (~1-2 days each)

| # | Fix | Principle | Effort |
|---|---|---|---|
| **T1.1** | Adaptive trial-end push timing (fire 1 day before for 3-day trials) | Scarcity | S |
| **T1.2** | First Pro feature-discovery push moves from D3 → D1 for trials shorter than 5 days | Reciprocity | S |
| **T1.3** | Goal-echo block on Today during trial: *"You said you wanted [motivation]. Here's what's coming."* — pulls from `motivation` field captured at onboarding step 2 | Commitment | M |
| **T1.4** | Add 1 unity line to Welcome to Pro screen subhead: *"For people who do their inner work."* | Unity | XS |
| **T1.5** | Add 1 unity line to PaywallScreen — tribe-naming above pricing | Unity | XS |
| **T1.6** | Methodology footer link on each report ("How this was generated") | Authority | S |

### Tier 2 — ship after analytics validates (~2-3 days each)

| # | Fix | Principle | Effort |
|---|---|---|---|
| **T2.1** | Trial-end push includes social proof: *"82% of users who built [N] journals stay subscribed at month 3."* (real number from PostHog cohort once available) | Social Proof | M (needs PostHog cohort data) |
| **T2.2** | Welcome to Pro hero-card subtext: *"Most Pros generate their first weekly read in 24 hours."* | Social Proof | M |
| **T2.3** | Cancel-flow save offer adds: *"Members who used Pro for 14+ days have a [X]% retention rate."* | Social Proof | M |
| **T2.4** | Onboarding step 3 → display goal back at completion: *"You're here to [motivation]. Let's start with..."* | Commitment | M |
| **T2.5** | D5 of 7-day trial: explicit "what you'd lose" surface listing 3 specific things | Scarcity + Commitment | M |

### Tier 3 — only after Tier 1+2 measured (~half-day each)

| # | Fix | Principle | Effort |
|---|---|---|---|
| **T3.1** | Astrologer-author byline on each report type | Authority | S |
| **T3.2** | "Built using astronomy-engine + NASA JPL ephemeris" tagline somewhere user-visible | Authority | XS |
| **T3.3** | Cosmic-identity card share — adds unity framing: *"You're a rare combination."* | Unity | S |

### Blocked items (require backend or external work)

| Item | Blocker |
|---|---|
| Friend / Circle social proof | Backend (Sprint C from competitive-audit) |
| Anonymous community insights | Backend |
| Email-side dunning + win-back | Email provider integration |

---

## The single-sentence answer to "how do we retain trial users"

> **Most of the heavy lifting is shipped. The biggest unrealized lever is social proof (zero in code today). Second-biggest is making the existing scarcity/commitment-stack work for 3-day trials too — adaptive push timing + earlier Pro-feature discovery + goal-echo from onboarding. Six tactical changes (~1-2 days total dev work) close most of the trial-conversion gap. The 7th — standardizing on 7-day trial across both plans — is the highest-leverage single change.**

If trial conversion under-performs after Tier 1 ships, run `marketing-skills:ab-test-setup` skill to design rigorous A/B variants. Don't add more tactics until measured.
