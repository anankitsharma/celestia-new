# Trial Retention Psychology — The Framework

How to keep someone using the app through their trial period and convert them to a paying subscriber, grounded in three behavioral-science frameworks. This is the *why* behind every trial-period tactic.

---

## The three frameworks at play

### 1. Fogg Behavior Model (B=MAP)

> **Behavior happens when Motivation, Ability, and a Prompt converge above the Action Line.**

For trial users:
- **Motivation** is highest at D0 (just signed up). It decays day-by-day if nothing reinforces it.
- **Ability** is the time/effort cost of using the app. This must stay tiny: < 60 seconds per session for daily reads, ≤ 1 tap to send a chat.
- **Prompt** is the daily morning push. Without it, motivation has no firing trigger.

**Implication for trial design:** Each trial day must have a tiny-yet-felt success moment. Not 1 big moment per trial. **3-7 small wins.**

### 2. Hook Model (Nir Eyal)

> Trigger → Action → Variable Reward → Investment → loops back.

For a 7-day trial, the user must complete **at least 3-4 full cycles** to internalize the loop. Anything fewer and the habit doesn't take.

For a 3-day trial: **at most 1-2 cycles possible.** This is mathematically why 3-day trials retain worse on relationship-heavy products like astrology — there's not enough time for the loop to run.

### 3. Cialdini's 7 Principles of Influence

The decision to convert from trial → paid is rarely fully rational. It's a heuristic-driven decision shaped by which psychological levers the product activates during the trial. **Each lever can be designed for or against you.**

---

## The 7 principles, applied to trial conversion

### Reciprocity — "you gave me something, I owe you back"

**The trial itself is the gift.** The user gets full access for free. The psychological obligation builds across the trial period.

What strengthens reciprocity during trial:
- **Personalized value** > generic value. The reveal statements ("you only fully feel yourself when reflected in someone else's eyes") feel like *gifts to this person specifically*, which Cialdini's research shows multiplies obligation intensity.
- **Unexpected gifts** > expected gifts. The Welcome to Pro screen with 3 hero cards (Sub-3) is reciprocity-in-action — not just unlock-the-gates but "here are 3 things to try."
- **Surprise insights** (P2.5, fires on D4/D10/D17/D24 with 30% roll) — pure unexpected reciprocity.

**Trial application:** every trial day should feel like the user received a small, personalized gift.

### Commitment & Consistency — "I told myself I was a Celestia user"

People want to be consistent with their past statements + actions. Each user input during trial creates a small commitment that compounds.

What builds commitment during trial:
- **Streak counter ticking up** — each day check-in is a tiny re-commitment.
- **Journal entries** — written self-reflection. Cialdini: written commitments are stronger than verbal.
- **Partners added to Circle** — social capital invested in the platform.
- **Chats sent** — questions asked become a record of "I came to this app for X."

**The onboarding commitment** (motivation + pain point + depth selection) was a public-ish micro-commitment to a goal. **Echoing it back during trial reinforces consistency** — currently NOT done in code (gap).

**Trial application:** by D5 of a 7-day trial, the user should have made 3-5 micro-commitments (check-ins, journals, chats, partners). Each makes them feel "I am someone who uses Celestia."

### Social Proof — "people like me are using and loving this"

When uncertain about a decision (will I keep paying?), people look to others' behavior.

Cialdini: social proof is **most powerful when observers are uncertain**, exactly the trial-conversion moment.

What's shipped today: **almost zero social proof** in Celestia's app surfaces. No user counts, no "X% of users hit a 7-day streak," no testimonials, no "Sarah from NYC just generated her year-ahead report." This is the single biggest principle-gap in the trial experience.

**Trial application:** add restrained, accurate social proof at trial decision moments:
- Trial-end push: *"82% of users who reach a 7-day streak still use Celestia at month 3."*
- Welcome to Pro: *"Most Pros generate their first weekly read in 24 hours."*
- Cancel-flow save offers: *"Members who used Pro for 14+ days have a [specific] retention rate."*

(All numbers must be real once analytics has data — never fabricated.)

### Authority — "this app knows what it's doing"

Authority signals lower the user's resistance because following an expert is an efficient shortcut.

Celestia's authority sources today:
- **Editorial typography** — Playfair Display + DM Sans signals craft (implicit authority).
- **Real chart wheel** with astronomical accuracy — implicit authority over horoscope-generator competitors.
- **Navigator framing** — voice signals expertise ("here's what to do, here's the alternative").
- **Voice guide rewrites** — push copy reads like written-by-a-human, not template-output.

What's missing:
- **Explicit authority cues**: no "Built using NASA JPL ephemeris," no astrologer-author byline on reports, no team credentials anywhere.
- **Source citations**: deep-dive content claims things without "based on [tradition / school / established astrologer]."

**Trial application:** introduce 1-2 authority signals during trial — particularly in reports (the highest-perceived-value Pro feature). A small "Methodology" link or tagline on each report would meaningfully reduce subscription doubt.

### Liking — "I feel something for this app"

People say yes to those they like. Brand voice + personalization are the dominant liking drivers in software.

Celestia's liking strengths:
- **Personalization depth** — chart, reveal statements, briefing-mode rotation, journal mining, indecision keyword surfacing. The app references the user's specific data more than any competitor.
- **Voice in long-form briefings** — navigator framing reads warm + intelligent.
- **Reveal statements** are the most-liked content asset in the app per the audit.

What weakens liking:
- **Stock language in micro-moments**: error messages, loading text, button labels. Each is a small disconnection.
- **Lack of human visibility** — no team page, no founder presence, no human warmth beyond the AI's tone.

**Trial application:** the highest-liking moment in the entire user journey is the chart reveal at D0 + first AI chat. Trial users who skip these have lower liking score → lower conversion. Defending the chart-reveal CTA tap-rate (P1.1 already does this) is critical for liking.

### Scarcity — "if I don't decide now, I'll lose this"

Cialdini: scarcity of TIME > scarcity of quantity. Loss aversion is stronger than gain seeking.

The trial itself creates time scarcity. The trial-end push (Sub-2 + voice rewrite) operationalizes it ethically:
> *"Two days. We don't want to charge you if you don't want this. [N] briefings, [M] chats, [P] journal entries — what you've built so far. You keep it all either way."*

This is **good scarcity** — informational, not coercive. Cialdini's ethical-scarcity boundary respected.

What weakens scarcity:
- **3-day trial scarcity is TOO compressed** — user feels rushed, leading to churn-via-anxiety rather than thoughtful conversion.
- **No acknowledgment of "what you'd lose access to"** until the cancel flow itself.

**Trial application:**
- 7-day trial: scarcity peaks at D5 (push) and D6-7. Healthy.
- 3-day trial: scarcity is constant from D0 — feels coercive. Recommend extending to 7 days OR making the 3-day trial scarcity-frame more compassionate.

### Unity — "I'm the kind of person who uses this app"

Tribal identity. People say yes to those they consider "us."

Celestia's tribe is the Inner-Work Practitioner (per `plan/design-audit/01-target-audience.md`):
- Therapy-positive
- Reads NYT / Cup of Jo
- Uses Notion / Aesop
- Wants smart-but-not-mean voice

What's shipped: **implicit unity** through voice + design. The brand doesn't say "this is for you" but the user *feels* "this is for me."

What's missing: **explicit unity language**. *"Made for people who do the work,"* *"For the questioners, not the believers,"* — copy that names the tribe.

**Trial application:** unity copy on PaywallScreen + Welcome to Pro + cancel-flow save offers. Even one line of unity-naming copy strengthens conversion intent.

---

## The trial-retention thesis

For Celestia's trial to convert at premium rates (≥60% trial→paid for the Inner-Work Practitioner audience), each principle must fire at least once during the trial:

| Principle | When to fire | How (current code) |
|---|---|---|
| **Reciprocity** | D0 + every day | ✅ Welcome to Pro + Pro daily insight + reveal statements |
| **Commitment** | D1, D3, D5 micro-actions | ⚠️ Streak yes; goal-echo from onboarding NO |
| **Social proof** | D4-6 + Welcome to Pro + cancel | ❌ Not in code anywhere |
| **Authority** | Reports + chart deep-dive | ⚠️ Implicit only — no explicit cues |
| **Liking** | D0 chart reveal + first chat | ✅ Best-in-category personalization |
| **Scarcity** | D5+ for 7-day, D2 for 3-day | ✅ Trial-end push (voice good) |
| **Unity** | Welcome to Pro + cancel save offers | ❌ No explicit tribe language |

**Score: 3 of 7 principles fully active. 2 partial. 2 missing.**

The missing principles (social proof + unity) and underleveraged ones (commitment echo, explicit authority) are the biggest trial-conversion levers Celestia hasn't pulled yet. **Each is code-buildable in the next sprint.**

The next two docs (`08-trial-playbooks.md` and `09-trial-implementation-status.md`) operationalize this framework into specific day-by-day tactics for the 3-day vs 7-day trials, and map every recommendation to whether it's already shipped or pending.
