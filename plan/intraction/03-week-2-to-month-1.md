# Stage 3 — Day 8 through Day 30

The habit-consolidation phase. The user has survived activation. Now Celestia must transition from "external trigger" (push notifications) to "internal trigger" (uncertainty about a person/decision → opens app). This is where Hook Model thinking matters most.

## Sub-stage 3.1 — Briefing-mode rotation (Week 2 onward)

**The mechanism:** `weeks_since_install % 4` selects briefing voice.

| Week mode | Voice |
|---|---|
| Week 1: `standard` | Default — daily transit + life-area briefing |
| Week 2: `pattern` | "I'm noticing something about you" — references behavior across the past week |
| Week 3: `partner` | Centers Circle entries — relational frame ("In your relationships today...") |
| Week 4: `archetype` | Mythic frame ("In this chapter of your story...") |

**Code:** HomeScreen computes `briefingMode` based on `weeks_since_install % 4`. If user has no Circle entries on Partner week, falls back to `standard` (avoids forcing a relational frame on a relationally-empty user).

**Forecast caching:** keyed per `(user, mode, day)`. Each mode generates its own daily content via Gemini.

**Analytics:**
- `daily_briefing_viewed` (with `has_navigator: true/false`)
- (Mode itself isn't currently in event properties — could be added)

**Why this matters:** Hook Model — the variable reward must keep delivering, but daily horoscopes risk feeling patterned by week 3. Rotating the FORMAT itself defeats the staleness.

**Emotional state:** +2 to +4 across week 2-4 depending on briefing-mode landing.

---

## Sub-stage 3.2 — D10 surprise insight roll

`maybeGetSurpriseInsight()` on Day 10 (one of the trigger days: D4 / D10 / D17 / D24).

If the 30% roll lands AND a previously-shown insight isn't repeated:
- A NEW personalized chart-grounded observation appears as a card on Today
- Different from the D4 surprise (deduplicated via `SURPRISE_INSIGHT_STATE`)

**Analytics:** silent render; user interaction captured downstream

**Emotional state:** +4 spike when card appears (variable reward)

---

## Sub-stage 3.3 — Internal-trigger push transition (D14+)

**Code path:** `notificationContentEngine.js` has 4 templates with `weight: (d) => d.weeksSinceInstall >= 2 ? 12 : 0` — they outrank standard morning copy after week 2.

**Templates:**
1. `cm_internal_trigger_decision` — *"Stuck on something? Your chart has an opinion."*
2. `cm_internal_trigger_person` — *"[Partner name]. Their chart shifted twice this week. Yours did too."* (only if `lastPartnerName` in data)
3. `cm_internal_trigger_pattern` — *"What you keep coming back to. There's a pattern forming in what you ask."*
4. `cm_internal_trigger_quiet` — *"What's heavier than it should be right now?"* (week 3+ only)

**Why this matters:** The voice shifts from "here's your day" (external) to "what's on YOUR mind" (internal). Hook Model: app becomes the response to an emotion, not a routine.

**Goal metric:** "Organic open rate" — apps opened with no recent push delivered. Should rise from <20% in week 1 to >50% by week 4 if the internal trigger has formed.

---

## Sub-stage 3.4 — D13 anticipation + D14 milestone

**D13:** Anticipation push fires next morning if streak === 13:
- *"Tomorrow: ⌁ 14 days."*
- *"Two weeks of showing up. Statistically: most don't get here. You did."*

**D14 cascade in `achievementService.js`:**
1. `dedicated` badge unlocks (or whatever D14 badge maps to via STREAK_MILESTONES)
2. **40% chance** of hidden-badge surprise roll (probability tier: D7=30%, D14=40%, D30=55%)
3. StreakMilestoneModal fires with: ⌁ + *"Two weeks. You're on the other side of the trial-vs-real line."* (DA-1.3 voice)
4. **Permission re-ask** if user declined notifications (FINAL-5 second of two lifetime re-asks)
5. Streak emoji escalates: ★ → ⌁ at 14 days

**Analytics fired:**
- `streak_milestone_hit`
- `badge_unlocked`
- (potential `notification_permission_requested` re-ask)

**Emotional state:** +5 (rare to make D14 — most users don't)

---

## Sub-stage 3.5 — D14+ Pro-feature discovery (Pro users only)

If the user converted to Pro at trial-end (T+0), `proEngagementService.js` fires Day 3 + Day 7 of Pro discovery pushes for highest-rank untried feature:
- Weekly report (highest priority)
- Placement deep-dive
- Compatibility / synastry
- Circle expansion (>3 partners)

**Push voice (per voice-guide):**
- *"You haven't opened a weekly read yet. The next 7 days will be different than this week. The read is already written."*
- *"The deeper placements in your chart are where the spicy reads live. Pluto, Saturn, your moon's house. You haven't looked at any of them yet."*

**Dedup:** Per-feature dedup via `PRO_FEATURE_NUDGED_AT` storage (max once per feature per 14 days).

**Analytics:**
- `pro_discovery_push_scheduled` (with feature, discovery_day=3 or 7)
- `push_opened` (with template_id=event_pro_discovery_*)

---

## Sub-stage 3.6 — D17 + D24 surprise insights

Same mechanism as D4 + D10. Variable reward keeps replenishing.

By D24, the user has potentially seen 0-4 surprise insights (each 30% probability). The dedup ensures none repeat.

---

## Sub-stage 3.7 — D27 anticipation + D28 Moon Cycle Pattern

**D27 anticipation push (if streak === 27):**
- *"Two days to a full lunar cycle."*
- *"Most people stop at week one. You're about to do something rare."*

**D28 cascade:**
1. Streak emoji escalates: ⌁ → ✶ (per `getStreakEmoji`)
2. **D28 Moon Cycle pattern modal** fires — Gemini-generated reflection (`generateMoonCyclePattern`):
   - Headline (4-7 words): *"What you keep returning to"*
   - Observation (2-3 sentences): chart-grounded behavioral pattern
   - Thread forward: small question about the next moon cycle
3. Cached forever in `MOON_CYCLE_PATTERN` storage (one-shot per profile)

---

## Sub-stage 3.8 — D30 reveal-statement callback (FINAL-4)

**The emotional climax of month one.**

`HomeScreen.js` useEffect detects:
- `daysSinceInstall` between 30-32
- `D30_REVEAL_CALLBACK_SHOWN` flag is false

If both, fires a modal:
> Kicker: *"ONE MONTH AGO"*
> Headline: *"You read this about yourself:"*
> Body (italicized): *"[their first reveal statement]"*
> Thread forward: *"Still true? It will keep getting truer."*

**Why this exists:** Pattern's "Your Pattern" portrait went viral 6 years ago because users quoted it back to themselves for years. Celestia's reveal statements are equivalent emotional anchors — but they were one-shot at onboarding. This callback re-anchors them at a meaningful date.

**Analytics:** silent fire; the event itself isn't captured but engagement on subsequent screens is.

**One-shot:** `D30_REVEAL_CALLBACK_SHOWN` boolean prevents re-fire.

**Emotional state:** **+5 (PEAK).** Often the second-most-memorable moment after the chart reveal.

---

## Sub-stage 3.9 — Indecision-keyword chip on Today

`detectIndecisionPhrase()` runs on app open. Scans recent journals for:
- "should I"
- "I don't know if/whether/what/how"
- "torn between"
- "can't decide"
- "not sure if"

**If found:** A callout chip renders on Today:
> Kicker: *"FROM YOUR JOURNAL"*
> Quote: *"[their actual indecision phrase]"*
> CTA: *"Tap to think it through with Celestia →"*

Tap → opens AskAI tab with question pre-filled: *"In my journal I wrote: '[phrase]' — help me think this through."*

**Why this matters:** Investment loads next trigger (Hook Model). The user wrote something; the app surfaces it back as a chat invitation. Reflection becomes conversation.

---

## End-of-month-one state

A user who's reached D30 active has:

| Surface | Likely state |
|---|---|
| Streak | 14-30 days (varies; many will be 30+ if anchored daily) |
| Level | Curious → Engaged → Active (XP-based) |
| Badges | 6-10 unlocked (mix of streak + exploration + hidden) |
| Journal entries | 5-15 (rough estimate) |
| Chats sent | 8-30 |
| Partners in Circle | 1-4 |
| Reports generated | 0-3 (more if Pro) |
| Pro status | Either still on trial → converted, or rejected at trial end |

**The retention scaffolding has done its job IF:**
- Organic-open rate (no recent push) > 30%
- D30 active rate > 22%
- ≥7-day streak achieved by 30% of D30 cohort

These are measurable in PostHog once cohorts are configured (P0.3).

---

## Beyond D30

The lifecycle continues but the mechanisms repeat:
- Briefing-mode rotation cycles back through Standard → Pattern → Partner → Archetype
- New surprise insights fire (the dedup tracks ~20 historical IDs; eventually pool refreshes)
- Streak grows; ✶ → ◇ at 100 days
- Solar-return push fires 7 days before user's birthday (P4.1)
- Annual Pro renewal alert (EXTRA-6) fires 7 days before annual charge

The product becomes harder to leave per month. Each user input loads stored value. The IKEA effect compounds: by month 6, leaving means abandoning an emotionally meaningful body of personal reflection.
