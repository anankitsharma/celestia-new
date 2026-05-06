# Backend + External — Sprint 4 Tasks

7 tasks across backend, email, RevenueCat, and external work. Substantial scope (4-6 weeks).

These unlock the long-tail retention + win-back gains that take composite from B+ (76%) → A- (89%).

---

## Task 05.1 — Tribe layer backend MVP

**Task ID:** #133
**Priority:** P2 — Sprint 4
**Estimated time:** 2-4 weeks (backend sprint)

### Why this matters

This is the **single biggest D60+ retention lever**. Self-Determination Theory's 3rd pillar is relatedness. Celestia today scores 0/10 on tribe (zero social layer). Adding even anonymized community insights ("1,247 Geminis felt off today, here's why") moves D60+ retention from ~50% to ~70% based on benchmarks for solo-app → tribe-aware-app transitions.

### What to build

**MVP scope:** anonymous, aggregated cohort insights. No friend graph, no usernames, no DMs in MVP.

#### Architecture

**Recommended stack:** Supabase (already configured in `src/services/supabase/client.js`) + a daily aggregation job.

**Schema:**
```sql
CREATE TABLE community_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  cohort_type TEXT NOT NULL, -- 'sun_sign', 'moon_sign', 'transit_active'
  cohort_value TEXT NOT NULL, -- e.g., 'Gemini', 'Mars-square-Moon'
  cohort_size INT NOT NULL, -- must be >= 50 for privacy
  insight_text TEXT NOT NULL, -- short 1-2 sentence aggregated read
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_community_insights_lookup ON community_insights(date, cohort_type, cohort_value);
```

**Aggregation job (nightly):**
1. Query journals + briefing-engagement events from last 24h
2. Group by sun_sign, moon_sign, active_transit
3. For each group with N≥50 active users today, generate an aggregated insight via Gemini
4. Insert into `community_insights` table
5. Old rows pruned at 7 days (insights are time-bounded by transit)

**API endpoint:**
```
GET /api/community/insights?sun_sign=Gemini&date=2026-05-06
→ Returns: { date, cohort_size, insight_text } or 404 if no insight yet
```

**Privacy + rate limiting:**
- Never expose individual user data — aggregation only
- Cohort size threshold: ≥50 users
- API rate limit: 60 req/hour per device
- Auth via Supabase RLS — anonymous read OK; writes restricted to nightly job

### Acceptance criteria

- [ ] Supabase table `community_insights` created
- [ ] Nightly aggregation job deployed (Vercel Cron, GitHub Actions, or Supabase Edge Function)
- [ ] API endpoint accessible and rate-limited
- [ ] Privacy review: no PII exposed
- [ ] Sample data populated for testing (manually seed 5-10 rows)
- [ ] Notify me to wire frontend integration (Task #134)

### Notes / gotchas

- Don't reinvent — Supabase + a single Edge Function nightly is enough for MVP
- Generative AI cost: ~$0.0005 per insight × 12 sun signs × 365 days = ~$2/year. Negligible
- If aggregation job fails: graceful fallback — frontend just doesn't show the card

---

## Task 05.2 — Tribe layer frontend integration

**Task ID:** #134
**Priority:** P2 — depends on Task 05.1
**Estimated time:** 1 week (after backend ships)

This is mostly code (mine), but the trigger to start is the backend going live.

### What I'll build (after #133 ships)

- New "Community Pulse" card on Today tab
- Reads from `/api/community/insights?sun_sign={user_sun}&date={today}`
- Caches response 6 hours
- Renders below briefing card, above bento row
- Tap → expanded view (future scope)
- `community_insight_viewed` event with cohort properties

### Notify me when

- Backend API is reachable from production app
- Test data is populated for ≥3 sun signs
- Privacy review signed off

---

## Task 05.3 — Friend / Circle social proof feature

**Task ID:** #135
**Priority:** P2 — Sprint 4
**Estimated time:** 1-2 weeks (backend + frontend)

### Why this matters

Wisdom-of-friends social proof is more powerful than wisdom-of-crowds (Cialdini). Even an anonymized "X of your friends also had this transit hit them today" line moves engagement.

### What to build

**MVP:** aggregate Circle adds across all users (not friend-graph specific). Then surface as "X members added a partner this month" on the Circle screen.

**Stretch:** opt-in friend graph — users can mutually link Circles to see each other's transit alignment. Substantially more privacy work.

### Acceptance criteria

- [ ] MVP Circle aggregation deployed to backend
- [ ] Circle screen shows aggregate stat
- [ ] Privacy review signed off
- [ ] Stretch (friend graph): deferred or scoped separately

---

## Task 05.4 — RevenueCat trial-extension API for "+3 days free" save offer

**Task ID:** #103
**Priority:** P2 — Sprint 4
**Estimated time:** 1 week

### Why this matters

The cancel-flow currently has TRIAL_SAVE_OFFERS that softly say "use the rest of your trial" — but doesn't actually grant additional time. A real "+3 days free" extension via RevenueCat backend can recover ~5-10% of trial cancellers.

### What to build

**Apple side:**
- RevenueCat → App Store Connect Subscription Promotional Offer
- Configure a 3-day free promotional offer (separate from initial trial)
- Backend: when user accepts the save offer, RevenueCat applies the promotional offer

**Google side:**
- Google Play Subscription API → defer billing for 3 days
- Backend: webhook handler that calls Google's API to defer billing

**Frontend (mine):**
- Once RevenueCat is configured, I add the new TRIAL_SAVE_OFFER variant in CancelFlowScreen.js
- Routes through RevenueCat extension RPC
- Tracks `cancel_save_offer_extension_offered` + `_accepted` events

### Acceptance criteria

- [ ] App Store Connect promotional offer configured
- [ ] Google Play subscription API webhook deployed
- [ ] RevenueCat documentation followed: https://www.revenuecat.com/docs/promotional-offers
- [ ] Notify me to wire the frontend save-offer variant

### Notes / gotchas

- Apple's promotional offers are NOT the same as introductory offers — read the RevenueCat docs carefully
- "+3 days" is small enough that App Store reviewers won't flag it as a dark pattern
- Don't offer to ALL trial cancellers — only those whose reason is "not_ready_commit" or "forgot_trial" (otherwise this becomes a default freebie)

---

## Task 05.5 — Email provider procurement + DPA review

**Task ID:** #136
**Priority:** P2 — Sprint 4
**Estimated time:** 1-2 weeks

### Why this matters

In-app push reaches users who have notifications enabled. Email reaches everyone. Dunning + win-back sequences are the only path to recovery for users who:
- Disabled push notifications
- Churned and no longer have the app installed
- Had a payment fail and didn't see the in-app prompt

7 email templates already exist in `plan/retaintion-new/email-templates/`. They just need a delivery provider.

### What to procure

**Recommended providers (ranked by fit for Celestia):**

1. **Customer.io** — best-in-class for behavioral campaigns + segmentation. ~$100-200/mo at Celestia scale. Has direct PostHog integration.
2. **Resend** — modern, developer-friendly, simple API. ~$20/mo. Use if you want to keep email simple.
3. **Postmark** — transactional excellence. ~$10/mo at low volume. Less fancy automation.

**Not recommended:** SendGrid (deliverability issues), Mailchimp (consumer-facing, hard to wire programmatically).

### Procurement steps

1. Pick provider (recommend Customer.io for full automation OR Resend for MVP)
2. Sign DPA (Data Processing Agreement) — legal review required for GDPR/CCPA
3. Configure sending domain: SPF, DKIM, DMARC records on `hicelestia.com` (or chosen domain)
4. Verify deliverability via Mail-Tester.com
5. Set up unsubscribe + preference center pages on web
6. Configure RevenueCat → Email-provider webhook for billing events

### Acceptance criteria

- [ ] Provider chosen + contracted
- [ ] DPA signed by both parties
- [ ] DKIM/SPF/DMARC verified at 90%+ score
- [ ] Unsubscribe page live at `/unsubscribe`
- [ ] Preference center live at `/email-preferences`
- [ ] Notify me to wire the integration (Task 05.6 + 05.7)

---

## Task 05.6 — Email integration: dunning sequence (D0 / D3 / D7 / D10)

**Task ID:** #137
**Priority:** P2 — depends on 05.5
**Estimated time:** 3-5 days after provider is live

### What I'll wire (after #136 completes)

- Trigger: RevenueCat webhook on `subscription_billing_failure`
- Schedule emails at D0, D3, D7, D10 from billing failure
- Send dunning-d0.md → dunning-d3.md → dunning-d7.md → dunning-d10.md
- Stop sequence on successful payment OR final cancel
- Track `email_sent` + `email_opened` + `email_clicked` events in PostHog
- Test with sandbox payment failures

### Templates already written

`plan/retaintion-new/email-templates/dunning-d0.md` through `dunning-d10.md`. Variables documented.

### Acceptance criteria

- [ ] Webhook handler deployed
- [ ] All 4 templates wire-tested with mock data
- [ ] Sandbox payment-failure test recovers correctly
- [ ] Events fire in PostHog Live Events

---

## Task 05.7 — Email integration: win-back sequence (D30 / D60 / D90)

**Task ID:** #138
**Priority:** P2 — depends on 05.5
**Estimated time:** 3-5 days after provider is live

### What I'll wire (after #136 completes)

- Trigger: RevenueCat webhook on `subscription_cancelled` OR lapse-cascade exhausted
- Schedule emails at D30 + D60 + D90 from cancellation
- D60 is conditional: only send if a feature shipped that addresses the cancel reason
- After D90, stop forever (open rates collapse, unsubscribe rates spike)
- Win-back deep-link: `celestia://winback/d30` (etc.) — already wired to WelcomeBack screen
- Track `winback_sent` + `winback_clicked` + `winback_returned` events

### Templates already written

`plan/retaintion-new/email-templates/winback-d30.md`, `winback-d60.md`, `winback-d90.md`.

### Acceptance criteria

- [ ] Webhook handler deployed
- [ ] All 3 templates wire-tested
- [ ] Deep-link `celestia://winback/d30` opens app to WelcomeBack screen
- [ ] D90 unsubscribe + suppression list working

---

## Task 05.8 — Press kit / website teaser landing

**Task ID:** #141
**Priority:** P2 — Sprint 4 (lower priority than retention work)
**Estimated time:** 1-2 weeks (mostly design + writing)

### Why this matters

External authority signal. Lets press, partners, and curious users find a non-app source of truth. Powers SEO + organic discovery.

### What to build

**Single-page landing site at celestia.app or hicelestia.com:**

**Sections:**
1. Hero — brand voice + unity language ("Astrology for the questioners.")
2. App screenshots (carousel) — same compositions from App Store
3. Methodology callout — "NASA JPL ephemeris. Established Western astrology traditions. AI tuned to your real chart."
4. Founding story — 3-4 paragraphs. Why this exists.
5. App Store + Play Store download buttons
6. Press kit link → leads to assets

**Press kit (separate page or download):**
- High-res screenshots (1290×2796 + 6.1" + Android sizes)
- App icon (1024×1024 + 512×512)
- Brand guidelines (1-page PDF) — logo usage, colors, typography
- Founder bio (200 words)
- Press contact email
- Optional: testimonials from existing users (consent-first)

### Tech stack

Recommend: Astro or Next.js + Vercel hosting. Single page, no auth.

### Acceptance criteria

- [ ] Landing page live at chosen domain
- [ ] Press kit downloadable
- [ ] App Store + Play Store deep-links work
- [ ] SEO meta tags + OpenGraph configured
- [ ] Lighthouse score ≥90 on all metrics
- [ ] Mobile-responsive

### Notes / gotchas

- Domain: pick something memorable. `celestia.app` if available; `hicelestia.com` is the current convention per existing app copy
- Don't over-design — single-page, fast-loading, on-brand
- Not for monetization — for legitimacy + discovery
