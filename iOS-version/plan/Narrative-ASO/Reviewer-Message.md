# Reviewer Message — Ready to Paste

**Where this goes:** App Store Connect → My Apps → Celestia → App Review Information → Notes (the larger text field, not the demo account section).

**When to update:** Only if the rejection date / version number / build features change. The narrative framing is locked — do not edit phrasing without consulting `Narrative.md`.

**Why it exists:** This message frames the build before the reviewer opens it. It pre-empts the 4.3(b) pattern-match by acknowledging the prior rejection, naming the changes, and anchoring the reviewer to the right comparable apps (Calm, Headspace) — not the wrong ones (Co-Star, Sanctuary).

---

## Paste this verbatim

```
Hi reviewer,

This is a substantial repositioning of our previously rejected submission
(1.0.6, rejected under 4.3(b) on 2026-01-23).

KEY CHANGES IN THIS VERSION

1. The app is positioned as a relationship pattern recognition tool. The
   default user surface is psychology-led: attachment theory, communication
   styles, emotional triggers, family dynamics.

2. Astrology is an internal analytical framework, not the surface vocabulary.
   It is hidden by default and revealed only when the user explicitly opts in
   via a Profile setting ("Show astrology details").

3. Daily horoscope content has been removed entirely. The Today tab leads
   with a daily reflection prompt and journaling.

4. Sign-in is removed. The app is fully usable without an account.

5. In-app purchases and subscriptions are removed. All readings are free.

6. AI-generated content is clearly labeled with an "AI · for reflection,
   not advice" disclaimer.

7. iPad support is disabled for this initial version.

DEMO ACCOUNT

Not required — the app is local-first and works without sign-in. Onboarding
takes ~2 minutes (enter name, birth date, time, city).

WHY THIS IS NOT A SATURATED CATEGORY APP

Celestia uses birth-chart mathematics as the diagnostic engine for its
relationship pattern analysis, in the same way Co-Star uses it for daily
prompts and Pattern uses it for personality framing. However, our user
surface vocabulary is exclusively psychology and attachment theory.
Reviewers will find no horoscopes, no daily zodiac readings, no fortune-
telling content, and no mystical aesthetic. The app is closer in spirit
to Calm or Headspace's reflection tools than to Co-Star or Sanctuary.

PRIVACY

All user data and all data about people the user adds is stored locally in
SQLite on the device. AI requests are sent to Google's Gemini API without
account identifiers and are not retained. The full privacy policy is at
https://celestia.app/privacy.

CONTACT

support@celestia.app — we'll respond within 24 hours to any review questions.

Thank you for your time.
```

---

## Companion fields (also in App Review Information)

| Field | Value |
|---|---|
| First Name | _your first name_ |
| Last Name | _your last name_ |
| Phone Number | _phone with country code_ |
| Email | `support@celestia.app` (or your monitored inbox) |
| Demo Account — Username | _leave blank — note states "not required"_ |
| Demo Account — Password | _leave blank_ |
| Notes | _the message above_ |
| Attachments | _none required_ |

---

## What NOT to include

- Do **not** mention the TikTok strategy, viral hook, or future v1.1 paid tier. Reviewers don't need that context and it can read as "we'll behave for review and turn it on later" — bad signal.
- Do **not** apologize at length. The note is short, professional, factual.
- Do **not** offer to "fix anything they flag." That signals uncertainty. The build either passes or it doesn't.
- Do **not** include screenshots or marketing copy in the note. ASC has a separate place for those.

---

## Final check before submitting

- [ ] Paste matches the block above verbatim (re-paste from this file, don't retype)
- [ ] No banned words leaked into the note: `horoscope`, `zodiac`, `daily horoscope`, `fortune` should appear **0 times** in your final paste
- [ ] Phone + email + first/last name are filled in
- [ ] Demo account fields are blank (the note covers why)
- [ ] Privacy policy URL in the note resolves to a live page

If all 5 boxes are checked, this section of the submission is done.
