# Data-Dependent — Defer Until Measured

2 tasks. Both wait on PostHog cohort data.

These are NOT blockers and should NOT be touched until at least 30 days of post-Sprint-1 measurement data exists. Acting on them earlier = shipping blind.

---

## Task 06.1 — Onboarding step compression

**Task ID:** #130
**Priority:** P3 — defer
**Estimated time:** 2-3 days when ready

### Why this matters

Industry benchmark for onboarding is 7-10 steps. Celestia has 14. Each unnecessary step is a drop-off tax — ~3-5% per step on average. Compression could reasonably move overall onboarding completion rate from ~75% to ~85% if executed well.

But: cutting steps without data is dangerous. The motivation/pain-point step (#2) feels like overkill but it's what powers the goal-echo block. The depth selection (#11) feels like overkill but it's what tunes AI chat tone. Each step has a payoff somewhere downstream.

**Don't cut blindly. Cut from data.**

### When to start

Wait until F1 (Activation funnel) has ≥1000 users in cohort. Then evaluate:

- Per-step drop-off table
- Identify any single step with ≥15% drop-off
- That step is your candidate for compression

### Decision tree

For each high-drop-off step:

| Drop-off | Action |
|---|---|
| ≥20% | Strongly consider removing or making skippable. Test with A/B variant. |
| 15-20% | Investigate root cause (UX bug? Confusing copy? Required input that user resists?) Fix root cause first; remove only if fix doesn't help. |
| 10-15% | Acceptable — don't touch unless overall completion is below 70%. |
| <10% | Healthy — leave alone. |

### Compression playbook

**Likely candidates** based on `02-day-1-to-7-activation.md`:

- **Step 7 (birth time toggle)** — drop-off if user feels overwhelmed
  - Compression: make it more clearly skippable. Default to "I don't know" with a friendly-tone explainer.
- **Step 11 (chat depth selection)** — drop-off if user picks "Light" + later regrets
  - Compression: defer to first chat interaction. "What kind of read do you want?" inline.
- **Step 14 (final paywall)** — already optimized in Sprint 1 with goal-echo + plan-aware copy
  - Compression: not recommended — this is the conversion moment

### What to measure post-compression

- Overall onboarding completion rate (pre vs post)
- The specific step's drop-off rate (should improve)
- Downstream metrics that depended on the cut step (e.g., if you cut depth selection, monitor chat satisfaction)

### A/B test methodology

- Branch the compression behind a feature flag (`onboarding_step_compression_v1`)
- 50/50 split for ≥2 weeks
- Outcome: overall completion rate at step 14
- Statistical significance threshold: 95%
- If the compression hurts conversion: revert
- If it helps: roll to 100% + remove flag

### Acceptance criteria

- [ ] F1 funnel data shows ≥30 days of post-Sprint-1 cohort
- [ ] Identify worst-drop-off step from data
- [ ] Decide via decision tree above
- [ ] If compressing: A/B test ≥2 weeks before rolling out
- [ ] Document the change in `plan/intraction/02-day-1-to-7-activation.md`

### Notes / gotchas

- Don't compress more than one step per A/B cycle — interaction effects make it hard to attribute
- The current 14-step flow has structure (intent → identity → reveal). Cutting wrong steps breaks the dramatic arc.
- If completion rate is ALREADY ≥85%, don't compress — diminishing returns

---

## Task 06.2 — Quarterly content refresh evaluation

**Task ID:** #142
**Priority:** P3 — defer
**Estimated time:** 1-2 weeks per quarter when ready

### Why this matters

Daily briefing-mode rotation (Standard → Pattern → Partner → Archetype) was shipped in Sprint 1. Each mode is variable-reward content. But content variety decays: by month 6, users have seen each mode ~6-7 times. Engagement with daily briefings can flatten if the modes start feeling repetitive.

Quarterly content refresh is the antidote — pilot a 5th briefing mode if data supports it.

### When to start

Wait until briefing-mode engagement data is ≥90 days post-Sprint-1. Compare engagement across modes:

| Mode | Daily briefing read-through rate (D90+ cohort) |
|---|---|
| Standard | ~75% |
| Pattern | ~70% |
| Partner | ~60% (lower because requires Circle) |
| Archetype | ~55% |

If any mode drops below ~50% read-through (significantly worse than peers): consider replacement OR skip rotation when it would land.

### Decision tree

| Lowest mode's read-through | Action |
|---|---|
| ≥60% | All healthy — no refresh needed. Re-evaluate next quarter. |
| 50-60% | Investigate: is it the mode itself or the user cohort? Evaluate per-week-of-tenure. |
| <50% | Replace or skip-rotation. Pilot a new 5th mode (e.g., "Weekly Theme" or "Reflection Wednesday"). |

### Pilot a new briefing mode

**Process:**
1. Design + draft new mode in `geminiService.js` (extend `briefingMode` enum)
2. Update voice-guide-pushes.md with the new mode's voice rules
3. A/B test: 50% of users get 5-mode rotation, 50% stay on 4-mode
4. Run for ≥4 weeks (full rotation cycle)
5. Compare engagement: read-through rate + DAU change
6. If new mode performs ≥ peer average: roll to 100%
7. If underperforms: drop the new mode, keep 4-mode rotation

### Acceptance criteria

- [ ] ≥90 days of post-Sprint-1 engagement data
- [ ] Per-mode read-through rates measured in PostHog
- [ ] Decision based on the decision tree above
- [ ] If piloting new mode: A/B test ≥4 weeks
- [ ] Voice-guide-pushes.md updated if new mode adopted

### Notes / gotchas

- Don't add a 5th mode just for novelty — only if data supports a real gap
- Rotation cycle must remain weekly — don't switch mid-week
- New modes still need Hook Model variable-reward properties (different angle, fresh framing)
- Avoid mode name collisions with existing concepts ("Daily" mode = Standard, etc.)

---

## When in doubt — DON'T act yet

Both tasks in this doc are tempting to do early. Resist.

The Sprint 1 + Sprint 3 work needs measurement to validate before any further changes. Acting on these tasks before data exists = shipping blind.

The right reading order:
1. Ship Sprint 1+3 (manual docs 01 + 02)
2. Set up PostHog measurement (manual doc 03)
3. Wait 30-60 days for cohort data
4. Read F1 + briefing-mode engagement data
5. Decide on these tasks based on the decision trees above

If a task in this doc seems urgent, double-check: is it really data-blocked, or is there an upstream blocker that's actually the issue? When in doubt, leave it pending.
