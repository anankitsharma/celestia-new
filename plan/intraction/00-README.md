# Celestia Interaction Map

End-to-end user journey from first tap through daily engagement and subscription. Built using the `journey-map` skill methodology + complete code audit of every interaction surface in the app.

## How to read this folder

Each doc covers one stage of the user lifecycle. Together they describe **every meaningful interaction a user has with Celestia** — what they see, what they tap, what fires (analytics + push + modal), what they feel, and where the design either supports or fails them.

| File | Stage | Duration |
|---|---|---|
| `00-README.md` | This index + emotional curve + moments of truth | — |
| `01-pre-install-and-onboarding.md` | App Store → splash → 14-step onboarding → chart reveal → first chat | 0–10 min (D0) |
| `02-day-1-to-7-activation.md` | Daily returns + first push + streak start + chat habits | Days 1–7 |
| `03-week-2-to-month-1.md` | Briefing-mode rotation, internal-trigger transition, D14 + D28 milestones | Days 8–30 |
| `04-subscription-lifecycle.md` | Trial conversion → Welcome to Pro → cancel flow | Per subscription cycle |
| `05-lapse-and-recovery.md` | 7-stage lapse cascade, restore-with-freeze, win-back | When user goes quiet (D2+ inactive) |
| `06-event-instrumentation.md` | Every PostHog event fired at every interaction (47 events total) | All stages |

## The journey at a glance

```
   Pre-install         Onboarding         Day 0          Days 1-7         Days 8-30        Trial→Paid       Daily as Pro      Lapse → Recover
    (curiosity)         (14 steps)       (chart wow)    (activation)     (habit form)     (commitment)     (deepening)        (re-engage)
        │                    │                │              │                │                │                │                  │
        ▼                    ▼                ▼              ▼                ▼                ▼                ▼                  ▼
   App Store        Birth data,         "Chart      Personal D1    Briefing-mode      Welcome to     Pro daily      D2/3/5/7/10/14/21
   discovery        psychology Q,       reveal +    push, freeze   rotation, internal Pro screen,   insight,       lapse cascade
   (organic / paid) wake-time choice   2 deeply    offer at D2,   trigger morning   3 hero cards,  Pro feature    with personalized
                                       specific    surprise at    pushes flip,      8 specific     discovery,     copy (partner /
                                       statements" D4, D7 recap   D14 + D28 ritual  reasons in     trial-end       chat / chart)
                                                                                    cancel flow    push 2 days
                                                                                                   before charge
```

## The emotional curve

Built with the `journey-map` skill emotional-arc methodology. Numeric values are estimated; real validation needs PostHog cohorts post-ship.

```
emotional valence (−5 to +5)

  +5 │                          ★ chart reveal
     │                         ╱ (the wow)
  +4 │      ╲              ╱     ╲
  +3 │       ╲     ★      ╱       ╲              ★ Welcome to Pro
  +2 │        ╲   ╱╲     ╱         ╲          ╱  ╲
  +1 │         ╲ ╱  ╲   ╱           ╲   ___╱       ╲___
   0 │ ●──────●─    ╲ ╱             ╲╱                  ╲___
  −1 │                                                       ╲___ ★ cancel-temptation
  −2 │ App Store    onboarding            day-3 plateau    day-30 reflection
     │ install      (long)                "is this for me"
  −3 │
  −4 │
  −5 │
       └─────┴─────┴──────┴──────┴──────┴──────┴──────┴──────┴
       D−1   D0    D1     D3     D7    D14    D30   D45    D60
```

**Peaks (positive emotional spikes):**
- D0 — chart reveal + 2 deeply specific reveal statements
- D0 — Welcome screen post-chart shimmer + first AI chat
- D1 — first personalized morning push acknowledging D0 chart
- D7 — first-week recap modal
- T+0 — Welcome to Pro screen with 3 hero cards
- D14 — emoji escalation + hidden-badge surprise roll
- D28 — Moon Cycle pattern reflection (Pro)
- D30 — reveal-statement callback ("One month ago you read this...")

**Valleys (emotional risk):**
- D−1 — App Store browse fatigue / paid-ad scroll past
- D0 onboarding step 7-9 (birth time / city — friction-heavy)
- D2-D3 — novelty fade, no streak yet
- Trial day 5-6 — "do I want to commit?"
- D45+ — habit decay, content-repetition feel
- Cancel-flow trigger moment

## Moments of truth

The 5 interactions that make-or-break the user's relationship with Celestia. These are the ones to instrument hardest and protect from regression.

### MoT-1 — The chart reveal (D0, post-onboarding)
**What happens:** WelcomeScreen renders with chart wheel, Big 3, and 2 deeply specific reveal statements (e.g., *"You only fully feel yourself when reflected in someone else's eyes"* for 7H moon).
**Why it matters:** This is the "this app knows me" moment. Without it, the user is dealing with a horoscope app. With it, they're dealing with something that took craft.
**Risk:** Birth-time-unknown users get a less-specific moon-house reveal; if the fallback statement isn't strong, the wow lands weaker.

### MoT-2 — First-day morning push (D1, ~7am)
**What happens:** `cm_d1_personal` template fires referencing the user's first reveal statement: *"Yesterday you read this about yourself: '[statement]'. Today watch for the second part."*
**Why it matters:** Closes the activation funnel. Without this push, ~50% of users who saw the chart never come back.
**Risk:** User declined notification permission (P1.2 timing fix improved consent rates; still ~30% decline).

### MoT-3 — Day 7 first-week recap (after streak hits 7)
**What happens:** Streak milestone modal fires + a modal containing a Gemini-generated personalized recap referencing the user's onboarding statement.
**Why it matters:** Anchors the habit. Users who hit D7 are 3-4x more likely to reach D30.
**Risk:** Sporadic users who never hit a 7-day streak miss this entirely (mitigated by the D5 "fresh start" push for non-streakers).

### MoT-4 — Trial-end push (T+5 days for trial users)
**What happens:** 2 days before trial charges, push fires with the user's interaction stats: *"Two days. We don't want to charge you if you don't want this."*
**Why it matters:** Single biggest churn driver — refund-anxiety surprise charges. This push prevents them.
**Risk:** Users who have notifications disabled never see it.

### MoT-5 — The first opened chat (anywhere in the journey)
**What happens:** User taps Ask AI tab or post-chart CTA, sends a message, gets a streaming response.
**Why it matters:** Chat is Celestia's flagship paid-tier feature. Users who chat have ~5x retention vs those who don't. The streaming response (AND-6) is critical here.
**Risk:** Users who never discover chat. Multiple onboarding nudges + Pro feature-discovery pushes drive this.

## Persona context

All journey docs assume the **Inner-Work Practitioner persona** from `plan/design-audit/01-target-audience.md`:
- Women 26-42, urban US/UK, college+ educated
- Therapy-positive, journals, reads NYT / Cup of Jo
- Astrology gateway from Co-Star or lapsed The Pattern
- Wants smart-but-not-mean voice + non-mystical aesthetic
- Pricing tolerance: $50-100/year

Secondary: tech/creative men 28-40 doing astrology ironically-but-seriously.

## The 47-event instrumentation map

`06-event-instrumentation.md` documents which PostHog events fire at every step. This is the source-of-truth for funnel analysis. Without it, you can't measure whether each MoT actually performs.
