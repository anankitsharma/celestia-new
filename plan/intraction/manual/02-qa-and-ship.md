# QA + Ship — Manual Tasks

2 tasks: smoke-test matrix, then ship to TestFlight + production.

Estimated total: 4-6 hours.

This is the gate between code-complete and live.

---

## Task 02.1 — QA matrix smoke test

**Task ID:** #107
**Priority:** P0 — blocks ship
**Estimated time:** 2-3 hours (parallel test runners can compress)

### Why this matters

32 code tasks shipped in Sprint 1 + Sprint 3. Most are small but they touch ~17 files including PaywallScreen, OnboardingFlowScreen, HomeScreen, and notification scheduling. A single missed bug here can poison the entire launch — surprise charges, broken trials, voice-guide regressions. **This is the highest-leverage 2 hours in the entire ship cycle.**

### Test environments

- **iOS** — physical device + simulator (iPhone 16 Pro)
- **Android** — physical device + emulator (Pixel 6 or higher)
- **iPad** — physical or simulator (visual QA only — no functional regression expected)

### Smoke-test matrix

#### A. Onboarding flow (most user-visible work)

- [ ] Fresh install → onboarding → step 14 paywall renders
- [ ] Step 14: tap monthly plan → CTA reads "Start 3-Day Free Trial — then $6.99 / month"
- [ ] Step 14: tap annual plan → CTA reads "Start 7-Day Free Trial — then $49.99 / year"
- [ ] Step 14: legal copy below CTA correctly says "Free 3-day trial..." / "Free 7-day trial..." per plan
- [ ] Goal-back card visible at step 14 with "You came here to [motivation]" copy
- [ ] Step 9 (renderFirstHit): core-question teaser visible ("YOUR CORE QUESTION" + sign-specific question)
- [ ] Onboarding card layouts not visually broken on iPhone SE (smallest device)

#### B. PaywallScreen (full, not from onboarding)

- [ ] Paywall opens from Profile or Pro CTA
- [ ] Annual card shows "7-DAY FREE TRIAL" gold kicker
- [ ] Monthly card shows "3-day free trial" neutral kicker
- [ ] "SAVE 50% · +4 DAYS" badge visible on annual card
- [ ] Unity line "Made for the questioners, not the believers." visible above plan cards
- [ ] CTA dynamically updates as user toggles plan (text + price subtext)
- [ ] Plan toggle haptic fires
- [ ] Purchase tap fires `purchase_tapped` event in PostHog Live Events

#### C. WelcomeToProScreen (post-purchase)

- [ ] Trigger by completing a sandbox purchase (use App Store Sandbox tester account)
- [ ] Plan-aware sub-line displays correctly (7 days for annual, 3 days for monthly)
- [ ] Unity line "For people who do their inner work." visible below 3 hero cards
- [ ] Tapping each hero card navigates correctly + fires `welcome_to_pro_card_tapped` event
- [ ] "I'll explore on my own →" dismiss works
- [ ] No crash if user has no Auth account (firstTime + no user case)

#### D. Trial-period flows (3-day monthly cohort)

- [ ] Sandbox account purchases monthly plan
- [ ] Day 1 cosmic morning push fires (verify via PostHog `push_delivered`)
- [ ] Day 1 Pro feature discovery push fires (NOT Day 3 — verify trial_length_days property)
- [ ] Day 2 trial-end push fires at user's morning time
- [ ] Push body includes "no daily Pro insight, no weekly reports, no full chat"
- [ ] Cancel-flow accessible from Profile → Manage Subscription

#### E. Trial-period flows (7-day annual cohort)

- [ ] Sandbox account purchases annual plan
- [ ] Day 5 trial-end push fires (verify trial_length_days=7 in event)
- [ ] Push body includes "no daily Pro insight, no weekly reports, no full-depth chat"
- [ ] Day 6 anticipation push: "One more morning. Then it counts." fires
- [ ] Day 7: stargazer badge unlocks + first-week recap modal renders
- [ ] D-1 trial summary surface visible on Today tab (D6) — kicker "YOUR TRIAL"
- [ ] D5 "what you'd lose" card visible on Today (red-tinted, lists 3 features)

#### F. Today tab during trial (any cohort)

- [ ] Streak counter elevated to header (larger gold treatment)
- [ ] Goal-echo card renders below briefing summary
- [ ] Goal-echo copy correct for user's motivation selection ('self', 'change', 'love', 'curious')
- [ ] If user is non-trial subscriber: goal-echo + streak elevation NOT shown

#### G. Reports

- [ ] Generate any weekly report
- [ ] PDF cover footer shows: "Synthesized from established Western astrology traditions"
- [ ] PDF closing-disclaimer includes: "Calculated using astronomy-engine + IAU ephemeris."
- [ ] Methodology footer also visible on report-detail screen (not just PDF)

#### H. Chart screen

- [ ] NASA JPL footer visible at bottom of main scroll: "Astronomical positions calculated from NASA JPL DE-441 ephemeris."
- [ ] Footer styled correctly (T.stone color, italic, centered)

#### I. WelcomeScreen (chart reveal)

- [ ] First reveal-statement share button → fires `share_initiated` event with source='first_reveal' + reveal_index=0
- [ ] Second reveal-statement share → source='reveal' + reveal_index=1
- [ ] Cosmic-identity share button visible below big-3 pills
- [ ] Cosmic-identity tap → opens share sheet with rarity copy + unity line
- [ ] Combo rarity label correct (e.g., "Rare", "Very Rare", "Unique")

#### J. Cancel flow

- [ ] Trigger cancel → reason picker → save offer
- [ ] Trial cancellers see TRIAL_SAVE_OFFERS variants (not full SAVE_OFFERS)
- [ ] If `cancel_save_social_proof` flag is enabled in PostHog with payload, retention-rate card shows
- [ ] If flag disabled: retention card hidden, no broken state

#### K. Annual renewal year-in-review (only triggers for annual subscribers within 30 days of renewal)

- [ ] Hard to test in normal QA — defer to live observation
- [ ] Sanity check: navigate to YearInReview manually via dev-only route → verify renders without crash

#### L. Welcome back surface (deep-link)

- [ ] Manually open `celestia://winback/d30` in Safari → app should open + navigate to WelcomeBack screen
- [ ] WelcomeBack stats render with correct counts
- [ ] "Take me to Today" button works

#### M. Notifications general

- [ ] All push categories fire on correct channels (cosmic_morning, evening_reflection, transit_alerts, streak_guardian, reactivation, cosmic_milestones, weekly_digest)
- [ ] Permission re-ask shows at D7 + D14 + D30 streak milestones (capped at 3 lifetime)
- [ ] `app_opened` events fire with correct `launch_source` ('cold' / 'push' / 'organic')

### Acceptance criteria

- [ ] All 50+ checks above pass
- [ ] No crashes on iOS or Android during smoke test
- [ ] No console errors / red screens / yellow warnings beyond pre-existing ones
- [ ] All Sprint 1 + Sprint 3 events fire in PostHog Live Events panel
- [ ] Voice of all new copy passes a visual read-through (no ALL CAPS shouting, no manipulation)

### Notes / gotchas

- Use App Store Sandbox tester accounts for purchase flows (Settings → App Store → Sandbox Account)
- For 3-day-trial timing, you can manipulate device time forward to simulate D1/D2 — but kill + restart app to force fresh notification scheduling
- PostHog Live Events panel: Project → Live Events → filter by `purchase_completed` etc.
- If a check fails, log the bug + screenshot, do NOT proceed to ship until resolved

---

## Task 02.2 — Ship to TestFlight + production

**Task ID:** #108
**Priority:** P0
**Estimated time:** 1-2 hours active + bake time

### Why this matters

The shipped artifact is what determines whether all the code work translates to user-visible improvements. A broken build = 0% of the lift. A clean ship = full Sprint 1 + 3 lift live.

### What to do

#### Step 1: Pre-flight

- [ ] Confirm Task 02.1 (QA matrix) all green
- [ ] Confirm Task 01.1 (ASC categories fix) complete
- [ ] Verify package.json version bumped (e.g., 1.1.0 → 1.2.0)
- [ ] Run `git status` — no uncommitted changes
- [ ] Tag the commit: `git tag sprint-1-3-ship`

#### Step 2: Build artifacts

- [ ] iOS: `eas build --platform ios --profile production` (or your build config)
- [ ] Android: `eas build --platform android --profile production`
- [ ] Wait for builds to complete (10-30 min each on EAS)
- [ ] Download .ipa + .aab artifacts

#### Step 3: TestFlight (iOS internal track)

- [ ] Upload .ipa to App Store Connect via Transporter or `eas submit --platform ios`
- [ ] Wait for processing (5-15 min)
- [ ] Add to TestFlight internal testing group
- [ ] Distribute to internal testers
- [ ] Internal smoke check (you + 1-2 trusted users) — give it 24-48h before production rollout

#### Step 4: Google Play (Android internal track)

- [ ] Upload .aab to Play Console
- [ ] Promote to Internal Testing track
- [ ] Internal smoke check 24-48h

#### Step 5: PostHog baseline annotation

- [ ] Once shipped, immediately open PostHog
- [ ] Add an annotation at ship timestamp labeled "Sprint 1+3 — Tier 1 fixes shipped"
- [ ] Note the changes: loss-frame copy, adaptive 3-day timing, paywall asymmetry, D-1 surface, streak header, year-in-review trigger
- [ ] This is doc 03's task #115 — don't forget

#### Step 6: Production rollout

- [ ] iOS: Submit for App Review — write release notes (see template below)
- [ ] Android: Promote internal → production at 5% rollout, monitor for 24h, expand
- [ ] Track key metrics in PostHog: crashes, `purchase_completed` rate, `app_opened` patterns
- [ ] If `purchase_completed` rate drops > 10% vs. baseline within 48h → rollback

### Release notes template

```
This release is about respecting your time.

— 7-day annual / 3-day monthly trials, clearly differentiated.
— A trial-end reminder that's specific (we tell you exactly what you'd lose) and permissive (we won't surprise you).
— The "what you built" surface on the last day of trial.
— Streak counter elevated for new members building a daily practice.
— Methodology footer on every report — astronomical accuracy, transparently sourced.
— Welcome back if you've been gone — your chart and journals are still here.

For the questioners, not the believers.
```

### Acceptance criteria

- [ ] iOS .ipa successfully uploaded to ASC
- [ ] Android .aab successfully uploaded to Play Console
- [ ] TestFlight + Play internal track distribution complete
- [ ] PostHog baseline annotation added at ship timestamp
- [ ] iOS app review submitted (4.3(b) resubmit applies — should pass with category fix)
- [ ] Android 5% rollout active

### Notes / gotchas

- 4.3(b) resubmit: ensure ASC categories are fixed BEFORE iOS submit
- For first-time TestFlight submission: Apple may require additional review (1-3 days)
- Production rollout: don't rush 100%. Stage 5% → 25% → 100% over 7-14 days
- If a critical bug surfaces post-ship: hotfix branch off ship tag, fix, re-submit; don't try to amend the live build
- Monitor App Store reviews for the first week — early reviews disproportionately affect rating
