# Celestia Onboarding — Loose Design Brief

This brief describes the *intent* of each onboarding screen — what the user is doing, what they're feeling, what role the screen plays in the journey. Layout, copy, components, and color choices are entirely up to you.

The goal here is to give you the emotional and functional shape of the flow. Bring your own taste to the rest.

---

## About Celestia

Celestia is a real-chart astrology companion. The differentiator: every reading comes from the user's actual birth chart, not their sun sign. The audience is mostly women, 22–34, who are tired of vague generic horoscopes and want something specific to them. They want to feel *seen*, not *entertained*.

The tone we want to evoke: thoughtful, calm, editorial. A Sunday-magazine horoscope column written by someone who actually knows them — not a glossy tech app, not a mystical-tacky app, not a cold Co-Star clone.

## Broad visual direction

Warm and editorial. Cream and burgundy palette with a single muted gold accent. We want the app to feel like reading a beautifully typeset magazine — generous whitespace, restrained ornament, hairline strokes over heavy boxes. Avoid anything that reads as "cosmic-tech" (electric purples, neon blues, dark space gradients, swirling orbs).

That's the only color/style guidance. Everything else is your call.

---

## The arcs of the flow

The 14 onboarding screens move the user through five emotional beats:

1. **Hook** — promise the differentiator
2. **Investment** — three commitment moments where the user reveals something
3. **Payoff** — birth data → calculation → reveal of their actual chart
4. **Proof** — let them touch what they're about to commit to
5. **Commitment** — set up the daily rhythm and offer the trial

Plus a sixth beat *after* onboarding — the welcome moment + first notification ask — that you should treat as part of the same continuous experience.

---

## Screen-by-screen intent

### Screen 1 — Hook
The front door. The user just opened the app for the first time. We have one beat to make a promise that distinguishes us from every other astrology app on the store. They should feel: *"oh — this is different."*

### Screen 2 — Motivation
The first commitment moment. Why did they open the app tonight? Their answer is going to be mirrored back to them later (twice — once in the solution bridge, once in the paywall). The user should feel like they're being *asked*, not surveyed.

### Screen 3 — Pain points
A deeper, more vulnerable commitment. Multi-select — they pick the things that are hard for them right now. The screen should feel safe, almost confessional. Not "tap your interests"; more "tell us where it hurts."

### Screen 4 — Solution bridge
The "we heard you" moment. We mirror the pains they just selected back to them, paired with how Celestia specifically addresses each one. This is the strongest commitment-consistency move in the flow. The user should feel like the app already understands them better than most apps do after a month.

### Screen 5 — Birth date + name
First data-collection screen. Friction is unavoidable, but we want it to feel like a ritual rather than a form. Two fields: their first name and their date of birth. The framing should feel like beginning a story, not filling out paperwork.

### Screen 6 — Birth time
Second data field. Many users won't know their exact birth time — we need to handle that gracefully. Two paths: "yes, I know it" (opens a time picker) or "I'm not sure" (auto-advances with a noon fallback). The user should never feel disqualified for not knowing.

### Screen 7 — Birth place
Third and final birth-data field. Live city search. We also offer a quiet "skip for now" affordance for users who balk at the keyboard — they get an approximate-location fallback that still produces a usable chart. The screen should feel forgiving.

### Screen 8 — Calculating
A loading moment that we deliberately stretch into a small piece of theatre. Four sequential phases of "calculation" text, lasting maybe three seconds total. The intent: make the upcoming reveal feel earned and substantive, not instantaneous. Restrained — *not* a swirling cosmic orb. We are editorial, not mystical.

### Screen 9 — Big 3 reveal
The magic moment, part one. The user learns their Sun, Moon, and Rising signs — but they have to *do* something to get them. Three locked elements; each tap reveals one placement. Earned reveal beats passive display. Once all three are revealed, the user moves on.

The screen should fit one viewport. No scrolling. The user should feel a small ceremony with each tap.

### Screen 10 — Blueprint synthesis
The magic moment, part two. Now that the user knows their three placements individually, this screen tells them what those three together *mean* — the meaning of their unique combination. Plus a personalized insight referencing whatever they told us about themselves earlier. Ends with a single ceremonial advance.

This is the most "magazine cover" beat of the entire onboarding. Treat it with care.

### Screen 11 — Preview
A Tinder-style swipe stack of mock cards showing exactly what the user will receive in the app each day, populated with their real placements. Three cards: a daily anchor, a spotlight on whatever pain they selected, and a sky/transit moment. The user can swipe through manually, or watch them auto-cycle if they don't touch.

The point is not to teach swiping (the home tab uses scroll). The point is: **let them physically handle the product before they pay for it.**

### Screen 12 — Wake anchor
The highest-ROI question we ask. *When* should the morning notification fire? Critically, we frame it as *when does your day usually start?* — anchoring the push to an existing routine rather than asking them to pick a notification time. This framing alone has a measurable retention impact.

The screen should feel like a small, considerate question — not a settings panel.

### Screen 13 — Notification rhythm
The user calibrates how present we are in their day. Three bundled options (light / medium / heavy presence) plus a separate opt-in for transit-event alerts. The bundle pattern matters: most users default-pick rather than fine-tune, so giving them three good options beats giving them seven toggles.

### Screen 14 — Trial offer
Convert. The user has invested four commitments, seen their chart, and touched the product. Now we offer the trial. Personalized goal-back at the top (mirroring what they said in screen 2), a personalized benefit list (each line referencing their actual Sun and Moon by name), one testimonial, plan select, free trial CTA. Plus a quiet skip affordance for users who aren't ready.

This is the densest screen of the flow. It's the only one that earns a scroll.

---

## After onboarding (post-paywall)

### Welcome / chart reveal
The first time the user sees their full chart wheel. Large, centered, alive with their actual planetary positions. Below the wheel, a 1–2 sentence editorial reveal statement personalized to their strongest placements. Two share affordances and a single ceremonial advance into the app.

This is the biggest visual moment of the entire experience. The most "wow, this was made for me" beat.

### Notification permission modal
A primer modal that shows up *before* the iOS system permission prompt. We show the user a faithful preview of the actual first notification they'll receive tomorrow — using their real reveal statement and their real wake time ("Tomorrow at 6:55am: …"). They allow or maybe-later. If they allow, we schedule the first morning push five minutes before their wake hour.

The intent: show the value before asking for the permission, not after.

---

## Notes for the designer

You're free to interpret all of the above. Some general guidance:

- **One screen, one moment.** Onboarding screens shouldn't scroll unless the screen is genuinely a list (the trial offer is the only place this rule bends).
- **Less ornament, more whitespace.** When in doubt, take something out.
- **Two CTA tiers.** Some screens are ceremonial (the hook, the reveal, the synthesis) and want a brand-anchor button. Some screens are transactional (data fields, settings, continue moments) and want a lighter, more functional button. You decide what those two tiers look like.
- **Kickers belong on most screens.** A small, confident label at the top of each screen orienting the user (e.g. "ABOUT YOU", "YOUR CHART", "YOUR MORNING"). They become the through-line of the editorial voice.
- **Magic moments deserve weight.** Screens 9, 10, and the post-onboarding chart reveal should each feel like the user has arrived somewhere — not just seen another step.
- **Consistency is the brief.** Whatever language you settle on for cards, kickers, buttons, and motion — apply it everywhere. The flow should feel like one continuous magazine, not 14 separate templates.

Make it beautiful. Make it feel personal. Make us proud.
