# Stage 1 — Pre-install through chart reveal

The activation funnel. From the moment a user discovers Celestia in the App Store / Google Play to the moment they hit "Ask Celestia about this" on the post-chart CTA. Roughly 5-15 minutes elapsed. **The single highest-stakes window in the entire user lifecycle.**

## Sub-stage 1.1 — Pre-install awareness

**Touchpoints:**
- Google Play Store / App Store listing
- Press / blog mentions (organic)
- Social media (TikTok / Reels / Twitter — Co-Star push screenshots create category awareness)
- Word-of-mouth referral

**User goal:** *"Find an astrology app that doesn't feel cheesy."*

**User actions:**
- Browses store listings
- Reads screenshots + first 2 paragraphs of description
- Glances at rating + review count
- Compares to competitors visible in same search

**Touchpoint state today:**
- App icon configured (`assets/icon.png`, navy + gold)
- Adaptive icon configured for Android (`adaptiveIcon` in app.json)
- Splash background set to `#0E0E22`
- ⚠️ **Themed monochrome icon NOT yet shipped** (per `plan/android-status-followup.md`) — apps without it look inconsistent on Material You themed home screens

**Emotional state:** curious + skeptical (+1)

**Risk:** Bounces to Co-Star or The Pattern instead. Mitigation = ASO work (covered separately by `app-store-aso` skill, not this audit).

---

## Sub-stage 1.2 — First launch + splash

**Trigger:** User taps the icon for the first time after install.

**Touchpoints:**
- `assets/splash-icon.png` over navy `#0E0E22` background
- Native splash → SplashScreen.js animated handoff
- App.js loads fonts + initializes SQLite schema

**Code path:**
1. `App.js` `useEffect` calls `initSchema()` (creates SQLite tables)
2. Fonts (Playfair + DM Sans 8 weights) load via `useFonts`
3. While loading: dark navy bg + gold spinner
4. Once `fontsLoaded && dbReady`, AppNavigator renders
5. SplashScreen → OnboardingFlow stack push

**Analytics events fired:**
- `app_opened` (via PostHog autocapture in App.js:35)
- `onboarding_started` (`OnboardingFlowScreen.js:156`)

**Emotional state:** anticipation (+2)

**Pain points:**
- Cold-start font loading can take 1-3 seconds — perceived "stuck"
- ⚠️ **No skeleton during font load** — just a spinner

---

## Sub-stage 1.3 — The 14-step onboarding

`OnboardingFlowScreen.js` runs 14 sequential steps, displayed by `case 1...14` switch in render.

| Step | Screen | What's asked | Friction |
|---|---|---|---|
| 1 | renderHook | Emotional hook — "Why are you here?" | Low |
| 2 | renderMotivation | Pick 1 of: love / change / career / self-knowledge | Low |
| 3 | renderPain | Pick a pain point | Low |
| 4 | renderDepth | Voice depth (Beginner / Intermediate / Advanced) | Low |
| 5 | renderBirthDate | Date picker | Low |
| 6 | renderBirthTime | Time picker + "I'm not sure" path → noon chart | **MEDIUM** — birth-time-unknown drop-off mitigated by the explicit fallback path |
| 7 | renderBirthPlace | City search w/ autocomplete | **MEDIUM** — typo, slow autocomplete |
| 8 | renderCalculating | Animated chart-calculation phases | Low |
| 9 | renderFirstHit | First compelling line based on chart | Low |
| 10 | renderBigReveal | Big 3 chips + chart wheel + 2 reveal statements | **PEAK** |
| 11 | renderDailyHook | Today's sky preview + **wake-time picker** (P1.3) | Low |
| 12 | renderSoftPaywall | Pro tier preview, no hard ask | Low |
| 13 | renderReassurance | "Cancel anytime, no charge" | Low |
| 14 | renderHardClose | Final CTA → main app | Low |

**Analytics:**
- `onboarding_step_completed` (with from_step / to_step) fires on every advance
- `onboarding_completed` (with sun_sign, motivation, pain_point) fires at end

**Emotional state across:** climbs from +1 → +5 at step 10, dips slightly during paywall preview, recovers at hard close.

**Pain points + mitigations:**
- **Long flow** (14 steps) — risk of mid-flow drop-off. Mitigations: progress bar (`ProgressBar` component), animated transitions between steps, no required account creation.
- **Birth-time unknown** — explicit "I'm not sure" → noon chart path (renderBirthTime line 411).
- **City search latency** — autocomplete debounce in renderBirthPlace.
- **Wake-time question** — added (P1.3) to anchor morning push to user's actual routine.

**Code-side hardening:**
- Persona prefs persisted to `celestia_persona_prefs` storage (motivation + painPoint + depth)
- Sun sign + motivation + pain point sent to PostHog `identify()` for cohort analysis

---

## Sub-stage 1.4 — Chart reveal (the moment of truth)

**Screen:** `WelcomeScreen.js` (after onboarding, before main app).

**What renders:**
1. Chart wheel SVG (real astronomical visualization)
2. Big 3 chips (Sun / Moon / Rising — typographic glyphs)
3. **Two deeply specific reveal statements** from `MOON_HOUSE_INSIGHTS / SUN_MOON_COMBOS / VENUS_SIGN_INSIGHTS` lookup tables. Examples:
   - *"You only fully feel yourself when reflected in someone else's eyes"* (7H moon)
   - *"You burn bright, feel fast, and recover quickly. But you rarely let anyone see the ashes."* (Fire-Fire sun-moon)
4. Subtle gold-shimmer animation over the wheel + soft `haptic.success()` on render
5. Two CTAs:
   - Primary (gold): **"Ask Celestia about this →"** (P1.1)
   - Secondary: "Or continue to your dashboard"

**Analytics fired:**
- `chart_revealed` (with sun/moon/rising/venus signs + has_birth_time)
- `post_chart_cta_shown` (after CTA fade-in)
- `post_chart_cta_tapped` (with target='chat' or 'dashboard')

**Persistence:**
- `FIRST_REVEAL_STATEMENT` saved to AsyncStorage so D1 push (`cm_d1_personal`) can reference it later

**Emotional state:** **+5 (PEAK)**. This is the moment of truth.

**Notification permission:**
- Modal shown immediately after CTA tap (P1.2 — timed to peak motivation)
- Copy: *"Mornings are when this app is most useful — turn on a daily 30-second briefing tailored to your chart?"*
- Captures: `notification_permission_requested`, then `_granted` or `_denied` with `source: 'post_chart'`

---

## Sub-stage 1.5 — First chat (post-CTA tap)

If user taps "Ask Celestia about this", they land on ChatScreen with a **pre-filled question** referencing their first reveal statement:

> *"Tell me more about this — '[their reveal statement]'"*

**ChatScreen state:**
- Input field has the question pre-typed and ready to send
- TextInput auto-focused (350ms delay so screen mounts first)
- User decides to send or edit + send

**Streaming response (AND-6):**
- Tap send → user message appears immediately
- Placeholder AI message inserted with `isStreaming: true`
- Stream chunks arrive token-by-token (Gemini `generateContentStream`)
- Each chunk updates the AI message text via callback
- On completion, `isStreaming: false` set

**Analytics:**
- `first_chat_message_sent` (with source='post_chart', char_count)
- `ai_chat_message_sent` (with `is_first: true`)

**Auto-scheduled side effect:**
- `event_chat_followup` push scheduled for +24h: *"About what you asked yesterday — there's another angle worth a moment."*
- (Push canceled on next app open if user returns)

**Emotional state:** +4 (still elevated; first AI response either confirms or weakens the chart-reveal magic)

---

## End-of-D0 state (when user closes app)

After their first session, the user has:
- ✅ Their chart calculated + saved (SQLite)
- ✅ Big 3 + 2 reveal statements seared into memory
- ✅ Wake-time setting persisted (drives morning push schedule)
- ✅ Notification permission decided (granted or declined)
- ✅ First chat sent (50%+ of users per the activation funnel target)
- ✅ Streak = 1
- ✅ XP awarded for daily check-in
- ✅ `first_light` badge unlocked
- ✅ FIRST_REVEAL_STATEMENT in storage (for D1 push)

The next interaction depends on whether notification permission was granted. If yes → D1 morning push. If no → silent return some other day, or never. Hence permission grant is the most important conversion in this stage after the chart reveal itself.
