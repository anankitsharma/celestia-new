# Plan — Reply to App Review's 4.3(b) Rejection

**Status:** Planning. This file describes the structure and content of the Resolution Center reply we will send. The actual paste-ready text is in `04-rejection-reply.md` once you approve the plan.

**Where the reply goes:** App Store Connect → My Apps → Celestia → App Review (or Resolution Center for the rejected submission `5e010580-14b8-4eed-9b57-49185cbd8834`) → **Reply to App Review**. This is private text seen by the reviewer; it never appears on the public listing.

**Length target:** ~1,500–2,000 characters. Reviewers skim — long replies fail. Shorter than the v1.1.0 App Review Notes (which is ~720 chars of *how to test*), longer than a one-liner because we need to defend a 4.3(b) appeal substantively.

---

## Why this reply matters disproportionately

4.3(b) is the hardest rejection class to overturn because:

1. It's a **judgment call about app concept**, not a fixable bug.
2. The rejection email explicitly says *"reconsider your app concept and submit a new app."* That's Apple inviting you to walk away from the category, not to argue.
3. Most apps that successfully overturn 4.3(b) do so by **demonstrating substantive rebuild**, not by arguing the original rejection was wrong.
4. Reviewers triage hundreds of submissions a day — if your reply reads as defensive or evasive, they default to upholding the original rejection.

So our reply has to do exactly three things, in this order:

1. **Acknowledge the rejection without arguing.**
2. **Document the substantive rebuild** between v1.0.6 (rejected) and v1.1.0 (this submission) — concretely, with specifics the reviewer can verify in the binary.
3. **Reposition the app's category and audience** so it stops looking like a saturated-category astrology app.

---

## Structure of the reply

### Section 1 — Acknowledgment (≈ 80 chars)
*"Thank you for the feedback. We agree that the previous version was indistinguishable from saturated-category astrology apps, and we have rebuilt v1.1.0 around a different positioning."*

**Why this opening:** signals that we're not arguing with the reviewer's call. Apple's tone in 4.3(b) rejections is firm — opening with disagreement is how this gets rejected again.

### Section 2 — The category change (≈ 200 chars)
*"v1.0.6 was listed in Lifestyle / Entertainment, alongside Co-Star, Sanctuary, and Nebula. v1.1.0 is now in Health & Fitness > Mindfulness primary, Lifestyle secondary — placing it next to Calm, Headspace, How We Feel, and Stoic. This category change alone changes the peer group the app is competing with."*

**Why:** the category move is the single most concrete piece of evidence that we have substantively repositioned the app. It's also the change that Apple's algorithm uses to decide which reviewer pool sees the app on resubmission. Calling this out explicitly tells the reviewer, *"please don't compare this to Co-Star — that's no longer the comparable peer set."*

### Section 3 — App name + subtitle change (≈ 150 chars)
*"App name changed from `Celestia Astrology & Horoscope` to `Celestia: Relationship Pattern`. Subtitle changed to `Attachment & compatibility`. The promotional text and full description no longer contain the words `astrology`, `horoscope`, `zodiac`, `birth chart`, `tarot`, `fortune`, or any related saturated-category vocabulary."*

**Why:** the previous app name **literally contained** the trigger words `Astrology` and `Horoscope`. Calling out the rename explicitly is critical — the reviewer's job got 50% easier the moment we changed those words.

### Section 4 — The default user surface (≈ 350 chars)
*"v1.1.0's primary feature is multi-relationship pattern recognition. Users add the people in their lives — partner, friend, parent, sibling, boss, colleague, child, or 'other' (eight relationship types) — and the app surfaces psychology-led insights drawn from attachment theory, communication styles, and emotional triggers. The default Today tab is a daily reflection prompt; there is no horoscope card, no zodiac wheel, no daily fortune. Users can add a partner with just a first name and birth date — no zodiac sign required to use the app."*

**Why:** this is the *what is the app* paragraph. We frame it as a *relationship-pattern* tool because the previous reviewer's mental model was *daily horoscope app*. The eight-relationship-types breadth is the single biggest piece of evidence that this is **not** a personal-horoscope app — daily horoscope apps are inherently solo/self-focused.

### Section 5 — Astrology features hidden by default (≈ 200 chars)
*"Astrology features remain available as an optional layer for users who want them, but are hidden by default and require an explicit opt-in toggle in Profile (`Show astrology details`). New users complete onboarding, reach the home tab, and can use the app indefinitely without ever encountering chart visualisations, planetary placements, or zodiac labels."*

**Why:** we're being honest that the engine is still astronomical. But by clearly stating *opt-in, hidden by default,* we move the astrology surface out of the app's primary feature set — exactly what 4.3(b) requires.

### Section 6 — Other concrete changes (≈ 250 chars)
A short bulleted block:
- Removed in-app daily-horoscope card and 24+ mystical notification templates
- AI responses (Google Gemini) clearly labelled in-app and require user-initiated questions; never push fortune-telling content
- All marketing screenshots now psychology-led; zero zodiac glyphs or planet symbols visible
- No subscription, no in-app purchases, no ads
- Local-only storage — privacy nutrition label is "Data Not Linked to You"

**Why:** these are individually small, but together they form a body of evidence that *every visible surface of the app has been redesigned around the new positioning,* not just metadata.

### Section 7 — Verification path for the reviewer (≈ 200 chars)
*"To verify in 60 seconds: launch the app fresh (no sign-in required), complete onboarding using any name + a sample birth date, and you'll land on the Today tab — a daily reflection prompt with no horoscope card. Tap the Profile tab and you'll see `Show astrology details` is OFF by default."*

**Why:** giving the reviewer a deterministic verification path is the easiest way for them to confirm our claims. If they can't see the difference in 60 seconds of testing, they uphold the rejection.

### Section 8 — Closing (≈ 60 chars)
*"Thank you for your time. We're happy to clarify anything further."*

---

## What the reply deliberately does NOT contain

| Thing | Why we don't include it |
|---|---|
| ❌ "We disagree with the rejection" | Direct contradiction is how 4.3(b) replies fail. |
| ❌ "Many apps in the saturated category were approved" | Whataboutism. Apple isn't bound by past approvals. |
| ❌ "But astrology is mainstream / has 50M users / Forbes wrote about it" | The 4.3(b) guideline is about saturation, not legitimacy. |
| ❌ Lists of academic citations for attachment theory | Reviewers don't need credentials; they need to see the rebuild. |
| ❌ Promises of future improvements ("v1.2 will add…") | We're appealing the current submission, not pitching future work. |
| ❌ Mentions of competitor apps by name in defensive ways ("we're not Co-Star because…") | Comparative claims are 2.3.1 risk territory. Better to describe what we *are* than what we are *not*. |
| ❌ Long apologetic preamble | One acknowledgment sentence is sufficient. Apologetic length signals weakness. |
| ❌ Mystical vocabulary anywhere — even in negation ("we removed all astrology", "the horoscope features are gone") | Keyword scanners pick these up; even acknowledging the trigger words by repeating them weakens the appeal. The reply should describe the *new* positioning, not eulogise the old one. |

---

## Tone

- **Professional, factual, third-person where possible.**
- **No hedging language** ("we hope", "we believe", "we feel"). Direct: "the app does X", "the user sees Y".
- **No marketing copy.** This isn't the App Store description — it's a reply to a reviewer who has already decided once. Treat them like a peer, not a customer.
- **Use specific numbers** where possible (8 relationship types, 7 screenshots, 0 banned words, etc.). Specifics read as substance; vague claims read as marketing.

---

## Risks and what to verify before sending

- [ ] **Verify all categorical claims are actually true in the binary.** If we say "no horoscope card" and the reviewer finds one, this becomes a 2.3.1 metadata-accuracy rejection on top of 4.3(b). Specifically check:
  - [ ] Today tab on first launch has no horoscope card
  - [ ] Profile toggle is OFF by default for new install
  - [ ] No zodiac glyphs or planet glyphs visible in default UI
  - [ ] No 24+ mystical notification templates fire on default install
  - [ ] All 7 screenshots actually use psychology vocabulary
- [ ] **Verify ASC categories are saved as Health & Fitness > Mindfulness primary, Lifestyle secondary.** (You mentioned earlier these were updated — confirm before sending.)
- [ ] **Verify the new bundle ID, app name, subtitle, description, and keywords are all live in ASC.** Reply text references all of these as verifiable facts.
- [ ] **Verify the v1.1.0 build is attached.** If somehow build 5 / 1.0.6 is still attached, the reviewer will look at that and we have nothing.

---

## What to do if Apple still rejects after this reply

The rejection severity ladder for 4.3(b):

1. **First reply rejected → second reply with more specifics.** Add a 30-second screen recording of the onboarding + Today tab. Paste a banned-word grep result showing 0 matches. Reference Apple's published examples of approved relationship-pattern apps (The Pattern, etc.) — but only as category precedent, never as comparison.
2. **Second reply rejected → request a call with App Review.** Tap "Resolution Center" → "Schedule a Call". A 15-minute call with a reviewer often clears 4.3(b) ambiguities that text replies can't.
3. **Call rejected → file a formal appeal via App Review Board.** Last resort. App Review Board is a separate team that reviews disputed rejections.

Document the response chain in `submission/05-rejection-followups.md` if the first reply doesn't clear it.

---

## Approval checklist before I write the reply

Tell me:

1. **Are ASC categories now Health & Fitness > Mindfulness + Lifestyle?** (You mentioned doing this — confirm.)
2. **Is the v1.1.0 build (build 6 or 7) attached to the submission?**
3. **Anything you want to add or remove from the structure above?** Is there a specific change you want me to highlight more prominently, or one I should leave out?
4. **Approve the ~1,500–2,000 char target length?** I can go shorter (1 paragraph) or longer (3 pages) — but the recommended length is the sweet spot for reviewer attention.

Once you give the green light on items 1–4, I'll write the actual reply text in `04-rejection-reply.md`.
