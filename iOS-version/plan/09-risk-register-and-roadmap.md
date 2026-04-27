# 09 — Risk Register & Post-Approval Roadmap

Two halves:
1. **Risk Register** — what could still get rejected even with everything else done, and how to recover
2. **Post-Approval Roadmap** — what to ship in v1.1, v1.2, v2.0 once approval lands

---

# PART 1 — RISK REGISTER

Ranked by likelihood of being the rejection cause if it happens.

## R1 — 4.3(b) again (likelihood: medium)

**The scenario:** Reviewer reads the new title/subtitle, scrolls screenshots, and still says "this primarily features astrology."

**Likelihood factors:**
- ↑ if screenshots show zodiac wheels prominently
- ↑ if first description sentence still mentions astrology
- ↑ if Circle tab UI looks like generic compatibility (just signs)
- ↓ if screenshots lead with multi-relationship-type Circle grid
- ↓ if reviewer note frames the repositioning explicitly
- ↓ if Today tab is hidden / demoted

**Recovery if rejected:**
1. Read Apple's exact rejection text. They will reference what they saw.
2. If they cite "still primarily astrology" → strengthen the relationship lead:
   - Move Today off the tab bar entirely → put it under Profile as "Daily context"
   - Move Chart off the tab bar → put it under Profile as "Your chart"
   - Tab bar becomes 3 tabs: Circle / Ask / Reports
   - Re-screenshot
3. If they cite specific copy → fix that copy
4. Resubmit within 1 week. Don't argue, don't cite features. Just describe what changed.

**Tab-stripping fallback:** if 4.3(b) fires twice on resubmission, the nuclear option is **Decision Compass** (Option C from the earlier audit) — strip Today, Chart, and traditional reports entirely. Single-purpose flow: enter a decision → get aid. ~30% code reuse but bulletproof against 4.3(b).

---

## R2 — Privacy Policy URL doesn't resolve (likelihood: low)

**The scenario:** Reviewer clicks the Privacy Policy URL in App Store Connect, gets a 404 or "coming soon" page.

**Result:** Cite-and-reject under 5.1.1.

**Mitigation:**
- Host before submission, verify in incognito mode that the URL returns the policy text
- Don't use a hosting setup that requires authentication or has a non-trivial DNS propagation window
- If using GitHub Pages, push the file at least 30 minutes before submitting

---

## R3 — Privacy Nutrition Label mismatch (likelihood: low–medium)

**The scenario:** Reviewer notices a discrepancy between the Privacy Policy text (which mentions Gemini, Nominatim) and the Nutrition Label (which doesn't disclose third-party data sharing).

**Result:** Reject under 5.1.2 with a request to fix the label.

**Mitigation:** the matrix in `06-app-store-connect-fields.md` aligns with the policy in `04-privacy-policy.md`. Verify by reading both side-by-side before submit.

The most-missed cell is **Other Data → Other Data Types** for the partner birth-info. Don't forget it.

---

## R4 — Hidden references to removed features in code (likelihood: low)

**The scenario:** A reviewer poking at the binary or testing "edge" navigations stumbles into AuthScreen / PaywallScreen / a sign-in button we missed.

**Result:** Reject under "App Completeness" (2.1) for "broken / non-functional features" or under 4.0 for "low quality."

**Mitigation:** the static checks in `08-pre-submission-checklist.md` §E.1 catch most of this. Run grep before each build.

If reviewer DOES find a stale reference: respond to the rejection by pointing out the screen is unreachable in v1, fix any lingering UI affordance that pointed there, resubmit.

---

## R5 — AI generates inappropriate content during review (likelihood: low)

**The scenario:** Reviewer types something provocative into Ask, receives an AI response that's too direct / emotionally heavy / borders on advice.

**Result:** Reject under 1.4 (physical harm) or 5.5 (fortune-telling).

**Mitigation:**
- AI disclaimer line visible at all times (`Block F` of `01-code-changes.md`)
- Gemini's default safety settings active
- Terms of Service §3 and §4 explicitly disclaim
- Suggested-question chips contain no provocative prompts (`Block K` of `01-code-changes.md`)

If rejected: review what was generated, tighten Gemini system prompt to add stronger refusals, add a "this is not professional advice" disclaimer to AI responses (string-prepended), resubmit.

---

## R6 — In-app links don't work (likelihood: low after fixes)

**The scenario:** Reviewer taps Privacy Policy in Profile, nothing opens.

**Result:** Reject under 4.0.

**Mitigation:** `Block H.1` of `01-code-changes.md` wires `Linking.openURL()`. Test on real device that the URLs actually open in Safari.

---

## R7 — Privacy manifest missing for a third-party SDK (likelihood: low)

**The scenario:** EAS build succeeds, but Apple's automatic upload check fails because a dependency lacks `PrivacyInfo.xcprivacy`.

**Result:** Build won't even appear in TestFlight. Email from App Store Connect.

**Mitigation:**
- `npm update` everything before final build
- Watch EAS build logs for manifest warnings
- If failure: identify the offending SDK from the email, update or remove it

---

## R8 — App rated below 17+ for AI content (likelihood: very low)

**The scenario:** Reviewer flags the rating because we marked it 12+ or 4+.

**Result:** Metadata rejection.

**Mitigation:** Set 17+ in App Store Connect (`06-app-store-connect-fields.md`). Easy.

---

## R9 — Encryption export-compliance flag wrong (likelihood: very low)

**The scenario:** App uses standard HTTPS and we miss setting `ITSAppUsesNonExemptEncryption: false`. App Store Connect prompts a question we answer wrong.

**Result:** Build delayed, not rejected.

**Mitigation:** `Block J.1` sets the flag in `app.json`.

---

## R10 — Reviewer asks for a demo account (likelihood: low)

**The scenario:** Reviewer reads the note saying no demo needed, but still emails asking for one.

**Result:** "Information Needed" status — pauses review.

**Mitigation:** Reply within 24h. Reaffirm the app is local-first. Walk them through onboarding (2 minutes). Apple usually accepts this.

---

## R11 — Apple requests changes to the AI feature (likelihood: low–medium)

**The scenario:** Apple may request additional safety affordances around generative AI:
- A way to report inappropriate AI responses
- Stronger content filtering
- A specific notice (e.g., "AI may produce inaccurate content") shown more prominently

**Result:** Conditional approval pending changes.

**Mitigation for rapid response:**
- Add a "Report this response" tap target in chat (long-press response → "Report")
- Strengthen disclaimer copy
- Submit a metadata-only update

---

## R12 — Apple rejects under 4.5.4 (push notification spam) (likelihood: very low)

**The scenario:** A reviewer with notifications enabled receives a notification that reads as marketing.

**Mitigation:** verify `notificationContentEngine.js` templates are 100% informational. Streak nudges are informational. Cosmic-event notifications are informational. Anything that reads as "Try X for free!" — remove.

---

## R13 — Apple rejects for "minimum functionality" (4.2) — very unlikely

**The scenario:** They decide the app is too thin without subscription/auth.

**Mitigation:** v1 has substantial functionality (Circle, Ask, Chart, Reports, Today, partner profiles, journal, AI insight, education layer). 4.2 is for apps that are basically a wrapper around a website. We're not.

---

## Risk-by-risk summary

| Risk | Likelihood | If it fires |
|---|---|---|
| R1 — 4.3(b) again | medium | Strip more, reposition harder |
| R2 — Privacy URL 404 | low | Re-host and confirm |
| R3 — Nutrition Label mismatch | low–medium | Align label with policy |
| R4 — Stale references | low | grep + fix |
| R5 — AI content flag | low | Tighten prompts + disclaimer |
| R6 — Broken in-app link | low | Re-test Linking.openURL |
| R7 — Missing privacy manifest | low | npm update SDKs |
| R8 — Wrong age rating | very low | Set 17+ |
| R9 — Encryption flag wrong | very low | Set in app.json |
| R10 — Demo account request | low | Reply with explanation |
| R11 — AI safety request | low–medium | Add report affordance, resubmit |
| R12 — Notification spam | very low | Audit content templates |
| R13 — Minimum functionality | very low | Demonstrate features |

---

# PART 2 — POST-APPROVAL ROADMAP

Once v1.1.0 is approved, the gate is open. Future versions face dramatically less scrutiny because the app's category is now established as "relationship tool, not horoscope app."

## v1.1 (within 2 weeks of v1 approval)

**Goal:** monetization + cloud backup. Kept small to avoid review surprises.

| Feature | Effort | Apple-review concern |
|---|---|---|
| Sign in with Apple (primary) | 1 day | None if implemented per 4.8 |
| Sign in with Google (alongside) | 0.5 day | None now that Apple is offered |
| Cloud backup via Supabase | 2 days | 5.1.1 nutrition label update |
| Subscription tier ("Celestia+") | 3 days | 3.1.2 disclosures must be perfect |
| Subscription paywall (single, in Profile or after free-tier limit) | 1 day | Must avoid the 4.3(b)-triggering "onboarding paywall" pattern |
| Restore Purchases | 0.5 day | None |
| Functional Terms / Privacy on PaywallScreen | 0.5 day | 3.1.2 hard requirement |

**Pricing for v1.1:**
- Free tier: 5 partners in Circle, unlimited chat, 3 reports/month, daily insight
- Celestia+ ($4.99/mo or $39.99/year): unlimited partners, unlimited reports, advanced AI voices

**What NOT to add to v1.1:**
- Reviewers re-checking for 4.3(b)-triggering UI changes. Keep the relationship positioning intact. Don't add a "horoscope of the day" widget.

## v1.2 (4–6 weeks after v1 approval)

**Goal:** retention + content depth.

- Re-introduce one-time purchase reports as Celestia+ exclusives (or sell separately for non-subscribers)
- Add a "Conversation prompts" feature: Celestia generates a single discussion prompt per relationship per week
- Add data export (JSON) — addresses GDPR portability
- Add iCloud backup option (syncs SQLite via iCloud Documents) — alternative to Supabase

## v1.3 (8–10 weeks after v1 approval)

**Goal:** social/sharing + virality.

- Partner-can-respond mode: invite a partner to also use the app and connect their chart
- Compatibility share cards (already exist in code, currently not exposed)
- Friend-of-friend chart introduction flow

## v2.0 (4–6 months after v1)

**Goal:** platform expansion.

- iPad layouts (re-enable `supportsTablet` with proper iPad UI)
- macOS Catalyst port
- Apple Watch companion (today's relational themes)

## Things we DON'T plan to do

- Live astrologer chat (would push us into competition with Sanctuary, Nebula — and reviewers know that category)
- "Daily horoscope" widget — never bringing this back. Today is positioned as relational-context.
- Tarot, palm reading, numerology — explicit 4.3(b) trigger words
- Gambling/contests (5.3) — out of category
- Any "spiritual coaching" framing — keep it secular and self-development-toned

---

# PART 3 — How to handle a rejection on resubmission

If 1.1.0 is rejected anyway:

1. **Don't reply emotionally.** Read the rejection 2–3 times. The reviewer's exact words are diagnostic.
2. **Identify the cited guideline.** Apple always cites a specific guideline. The recovery action depends on which one.
3. **Map to this risk register.** Most rejections fit one of R1–R13.
4. **Make the smallest change that addresses the cited issue.** Don't re-architect on every rejection.
5. **Reply in Resolution Center within 48 hours.** Apple's "queue freshness" matters. Long replies bump you to the back.
6. **Don't argue 4.3(b).** If they cite 4.3(b) twice, the answer is more aggressive repositioning, not better arguments.
7. **Stay polite.** Apple reviewers see hundreds of rejection emails per day. Politeness is correlated with re-review speed.

---

# PART 4 — Communication template for rejection responses

If we get rejected, paste this skeleton into the Resolution Center reply (customize the middle):

```
Hi reviewer,

Thank you for the feedback. We've made the following changes to address [GUIDELINE NUMBER]:

1. [Specific change #1]
2. [Specific change #2]
3. [Specific change #3]

We've uploaded build [BUILD NUMBER] to TestFlight reflecting these changes.

If anything else is still unclear, we're happy to provide more detail.

Best,
[NAME]
```

Keep it factual. Don't justify, just describe what changed.
