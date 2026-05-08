# 05 — Implementation Roadmap

What to build, in what order, by what file. Designed for ~2 weeks of focused work.

---

## Sequencing — three phases

### Phase 1 (week 1) — High-leverage, low-risk changes

These are the wins that don't require restructuring the flow.

| Task | Files | Effort | Impact |
|---|---|---|---|
| Add bundle-choice screen as new step 12 | `OnboardingFlowScreen.js`, `notificationService.js` | M | High |
| Promote wake-time to dedicated step 11 (split from current step 11's mixed card) | `OnboardingFlowScreen.js` | S | Medium |
| Rewrite permission modal copy with D1 push preview | `NotificationPermissionModal.js`, `WelcomeScreen.js` | S | High |
| Personalize paywall benefit copy (sun/moon by name) | `OnboardingFlowScreen.js` (renderSoftPaywall, renderHardClose) | S | Medium |
| Add `haptic.success()` on Sun-sign reveal screen | `OnboardingFlowScreen.js` (renderFirstHit) | XS | Low (polish) |
| Cache last 5 city searches | `OnboardingFlowScreen.js`, `storage.js` (new key) | M | Medium |
| Bundle preset application | `notificationService.js` (new export) | S | High |
| Bundle selector at top of `NotificationSettingsScreen` | `NotificationSettingsScreen.js` | M | Medium |

### Phase 2 (week 2) — Flow restructure

These require touching the screen sequence.

| Task | Files | Effort | Impact |
|---|---|---|---|
| Consolidate paywall steps 12+13+14 → single step 13 | `OnboardingFlowScreen.js` | L | High |
| Update `TOTAL_STEPS` constant to 11 (currently 14) | `OnboardingFlowScreen.js:20` | XS | — |
| Update progress-bar logic (showProgress range 02–12) | `OnboardingFlowScreen.js:892` | XS | — |
| Add "save this insight" affordance to Today's navigator card | `HomeScreen.js`, `JournalRepository` | M | High |
| Add Day-3 in-app permission re-prompt banner | `HomeScreen.js`, `storage.js` | M | Medium |
| Add iOS-level permission-revoked banner | `HomeScreen.js` | S | Low |
| Add bundle-multiplier to dailyCap logic | `notificationService.js:625` | S | Medium |

### Phase 3 (week 3+) — Tests and instrumentation

| Task | Files | Effort |
|---|---|---|
| Add `ONBOARDING_NOTIF_BUNDLE_PICKED` event | `analytics.js` (EVENTS dict), `OnboardingFlowScreen.js` | XS |
| Add `ONBOARDING_WAKE_TIME_SET` event with `is_default` flag | `analytics.js`, `OnboardingFlowScreen.js` | XS |
| Add `D1_PUSH_OPENED` event with timing offset | `notificationService.js` (handler), `analytics.js` | M |
| Add `FIRST_INSIGHT_SAVED` event | `HomeScreen.js`, `analytics.js` | XS |
| Set up A/B-test feature flags (4 tests in 04-doc) | PostHog dashboard + `analytics.js` getFeatureFlag calls | M |
| Build retention dashboard | PostHog | L |

---

## Detailed work breakdown

### 1. Bundle-choice screen (the marquee feature)

**File:** `src/screens/OnboardingFlowScreen.js`

**Add new render function** between current renderDailyHook (step 11) and renderSoftPaywall (step 12):

```js
const BUNDLES = [
  {
    id: 'minimal',
    title: 'Just the morning.',
    desc: 'One reading at sunrise. Nothing else.',
    cadence: '1/day',
  },
  {
    id: 'balanced',
    title: 'Morning + a moment to reflect.',
    desc: 'A reading to start. A prompt to close.',
    cadence: '2/day',
  },
  {
    id: 'everything',
    title: 'Everything cosmic.',
    desc: 'Transits, retrogrades, lunations — the whole sky.',
    cadence: '5/wk',
  },
];

const [notifBundle, setNotifBundle] = useState('balanced');

const renderNotifBundle = () => (
  <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
    <Text style={s.phaseLabel}>YOUR RHYTHM</Text>
    <Text style={[s.h1, { color: colors.heading }]}>How often do you want{'\n'}the stars to reach out?</Text>
    <Text style={[s.sub, { color: colors.textSecondary }]}>You can change this anytime.</Text>

    <View style={s.optWrap}>
      {BUNDLES.map(b => (
        <OptionCard
          key={b.id}
          text={b.title}
          sub={`${b.desc}\n(${b.cadence})`}
          selected={notifBundle === b.id}
          onPress={() => setNotifBundle(b.id)}
          colors={colors}
        />
      ))}
    </View>

    <View style={{ height: 24 }} />
    <GoldButton text="Continue" onPress={async () => {
      await applyNotificationBundle(notifBundle);
      capture(EVENTS.ONBOARDING_NOTIF_BUNDLE_PICKED, { bundle: notifBundle });
      advance();
    }} />
  </ScrollView>
);
```

**File:** `src/services/notificationService.js`

Add export:
```js
const BUNDLE_PRESETS = {
  minimal: { cosmic_morning: true, evening_reflection: false, transit_alerts: false, streak_guardian: false, reactivation: true, cosmic_milestones: false, weekly_digest: false },
  balanced: { cosmic_morning: true, evening_reflection: true, transit_alerts: false, streak_guardian: true, reactivation: true, cosmic_milestones: true, weekly_digest: false },
  everything: { cosmic_morning: true, evening_reflection: true, transit_alerts: true, streak_guardian: true, reactivation: true, cosmic_milestones: true, weekly_digest: true },
};

export async function applyNotificationBundle(bundleId) {
  const preset = BUNDLE_PRESETS[bundleId] || BUNDLE_PRESETS.balanced;
  const settings = await getNotificationSettings();
  await saveNotificationSettings({
    ...settings,
    ...preset,
    notificationBundle: bundleId, // for analytics
  });
}
```

### 2. Wake-time as dedicated screen

**File:** `src/screens/OnboardingFlowScreen.js`

The current step 11 (renderDailyHook) is doing 3 jobs. Split:

**New step 11 — pure wake anchor:**

```js
const renderWakeAnchor = () => (
  <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
    <Text style={s.phaseLabel}>YOUR MORNING</Text>
    <Text style={[s.h1, { color: colors.heading }]}>When does your{'\n'}day usually start?</Text>
    <Text style={[s.sub, { color: colors.textSecondary }]}>
      Tomorrow's first reading lands 5 minutes before.{'\n'}
      First thing you see — not another alarm.
    </Text>

    {/* Big chip row, more spacious than current */}
    <View style={s.wakeChipsWrap}>
      {[
        { label: '6 AM', value: 6 },
        { label: '7 AM', value: 7 },
        { label: '8 AM', value: 8 },
        { label: '9 AM', value: 9 },
        { label: '10+ AM', value: 10 },
        { label: 'Varies', value: 'varies' },
      ].map(opt => (
        <TouchableOpacity
          key={opt.label}
          onPress={() => { haptic.light(); setWakeHour(opt.value); }}
          style={[s.wakeChip, wakeHour === opt.value && s.wakeChipOn]}
        >
          <Text style={[s.wakeChipText, wakeHour === opt.value && s.wakeChipTextOn]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    <Text style={[s.wakePromise, { color: colors.textSecondary }]}>
      We'll never wake you up. Promise.
    </Text>

    <View style={{ height: 24 }} />
    <GoldButton
      text="Set My Morning"
      onPress={async () => {
        if (typeof wakeHour === 'number') {
          const settings = await getNotificationSettings();
          await saveNotificationSettings({ ...settings, morningTime: wakeHour, morningMinute: 5 });
        }
        capture(EVENTS.ONBOARDING_WAKE_TIME_SET, {
          wake_hour: wakeHour,
          is_default: wakeHour === null,
        });
        advance();
      }}
      disabled={wakeHour === null}
    />
  </ScrollView>
);
```

The "Today in your sky" content currently bundled into step 11 — fold into the WelcomeScreen or drop entirely. WelcomeScreen already shows the user's actual chart with personality reveals; the "today's transits" preview is redundant.

### 3. Permission modal upgrade

**File:** `src/components/NotificationPermissionModal.js`

Pass in `wakeTime` and `firstRevealStatement` as props from `WelcomeScreen.js`. New render:

```jsx
<View style={styles.modal}>
  <Text style={styles.glyph}>✦</Text>
  <Text style={styles.heroTime}>
    Tomorrow at {formatWakeTime(wakeTime)}
  </Text>
  <Text style={styles.heroSub}>
    Your first reading lands.
  </Text>

  <View style={styles.previewCard}>
    <Text style={styles.previewLabel}>Tomorrow's notification:</Text>
    <Text style={styles.previewTitle}>
      Yesterday you read this about yourself:
    </Text>
    <Text style={styles.previewBody}>
      "{truncate(firstRevealStatement, 80)}" Today, watch for the second part.
    </Text>
  </View>

  <GoldButton text="Allow notifications" onPress={onEnable} />
  <TouchableOpacity onPress={onDismiss} style={styles.maybeLater}>
    <Text style={styles.maybeLaterText}>Maybe later</Text>
  </TouchableOpacity>
  <Text style={styles.promise}>We never wake you up. Promise.</Text>
</View>
```

### 4. Paywall personalization

**File:** `src/screens/OnboardingFlowScreen.js`

In `renderSoftPaywall` (or whichever paywall remains after consolidation), reference user's chart:

```js
const sunSign = sun?.sign || 'your Sun';
const moonSign = moon?.sign || 'your Moon';

const benefits = [
  {
    icon: '☉',
    title: `Daily readings from your ${sunSign} Sun & ${moonSign} Moon`,
    desc: 'Not generic horoscopes. Your actual chart, every morning.',
  },
  // ...
];
```

If `sun?.sign` is missing (shouldn't happen post-step-9), fall back to generic copy. Existing logic handles fallback.

### 5. Paywall consolidation

**File:** `src/screens/OnboardingFlowScreen.js`

Merge `renderSoftPaywall`, `renderReassurance`, `renderHardClose` into a single `renderPaywall`:

```js
const renderPaywall = () => (
  <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingTop: 40 }]}>
    {/* Header */}
    <Text style={s.paywallPre}>✦</Text>
    <Text style={[s.paywallH1, { color: colors.heading }]}>
      Your chart is cast,{'\n'}{firstName}. Now what?
    </Text>

    {/* Goal-back */}
    {motivation && MOTIVATION_GOAL_TEXT[motivation] && (
      <View style={[s.goalBackCard, { borderColor: colors.border }]}>
        <Text style={s.goalBackKicker}>YOUR INTENT</Text>
        <Text style={[s.goalBackBody, { color: colors.text }]}>
          You came here to {MOTIVATION_GOAL_TEXT[motivation]}.{'\n'}
          Pro is what gets you there.
        </Text>
      </View>
    )}

    {/* Personalized benefits */}
    <View style={s.benefitList}>
      {personalizedBenefits.map(b => (
        <View key={b.title} style={s.benefitRow}>
          <View style={[s.benefitIcon, { borderColor: colors.border }]}>
            <Text style={{ fontSize: 18 }}>{b.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.benefitTitle, { color: colors.heading }]}>{b.title}</Text>
            <Text style={[s.benefitDesc, { color: colors.textSecondary }]}>{b.desc}</Text>
          </View>
        </View>
      ))}
    </View>

    {/* Single testimonial */}
    <View style={[s.testimonial, { borderColor: colors.border }]}>
      <Text style={[s.testimonialText, { color: colors.text }]}>
        "I screenshot my chart reading and sent it to everyone. It was THAT accurate."
      </Text>
      <Text style={s.testimonialName}>— Mia, 24</Text>
    </View>

    {/* Plan select */}
    <PlanCard plan="annual" selected={selectedPlan === 'annual'} onSelect={() => setSelectedPlan('annual')} />
    <PlanCard plan="monthly" selected={selectedPlan === 'monthly'} onSelect={() => setSelectedPlan('monthly')} />

    {/* CTA */}
    <GoldButton
      text="Start My Free Trial"
      onPress={finishOnboarding}
      sub={selectedPlan === 'annual' ? 'FREE for 7 days · No charge today' : 'FREE for 3 days · No charge today'}
    />

    <TouchableOpacity onPress={finishOnboarding} style={{ marginTop: 18, alignSelf: 'center' }}>
      <Text style={[s.paywallSkip, { color: colors.textSecondary }]}>Continue with limited access</Text>
    </TouchableOpacity>

    <Text style={[s.paywallLegal, { color: colors.textSecondary }]}>
      {planLegalCopy}
    </Text>
  </ScrollView>
);
```

Then update step router:
```js
const renderStep = () => {
  switch (step) {
    case 1: return renderHook();
    case 2: return renderMotivation();
    case 3: return renderPain();
    case 4: return renderDepth();
    case 5: return renderBirthDate();
    case 6: return renderBirthTime();
    case 7: return renderBirthPlace();
    case 8: return renderCalculating();
    case 9: return renderFirstHit();
    case 10: return renderBigReveal();
    case 11: return renderWakeAnchor();      // NEW dedicated
    case 12: return renderNotifBundle();     // NEW
    case 13: return renderPaywall();         // CONSOLIDATED
    default: return null;
  }
};
```

And:
```js
const TOTAL_STEPS = 13;  // was 14
```

### 6. First-action affordance on Today

**File:** `src/screens/HomeScreen.js`

Find the Navigator Briefing card. Add at the bottom:

```jsx
<TouchableOpacity
  onPress={async () => {
    haptic.success();
    await JournalRepository.create({
      userId: userProfile.id,
      content: forecast.navigatorSummary,
      mood: 'noted',
      tags: ['from-onboarding', 'navigator'],
    });
    capture(EVENTS.FIRST_INSIGHT_SAVED, { source: 'onboarding_card' });
    setShowSavedToast(true);
  }}
  style={s.saveAffordance}
>
  <Text style={s.saveText}>☆ Save this for later</Text>
</TouchableOpacity>
```

Show only on first session (check AsyncStorage flag `FIRST_INSIGHT_SAVED_DONE`). Hide once tapped or after 3 sessions.

### 7. Bundle-aware daily cap

**File:** `src/services/notificationService.js:625`

```js
// Replace:
const dailyCap = (data.weeksSinceInstall || 0) < 1 ? 1 : 2;

// With:
const settings = await getNotificationSettings();
const bundle = settings?.notificationBundle || 'balanced';
const baseCap = (data.weeksSinceInstall || 0) < 1 ? 1 : 2;
const bundleMultiplier = bundle === 'everything' ? 1.5 : 1;
const dailyCap = Math.ceil(baseCap * bundleMultiplier);
```

### 8. Settings screen bundle selector

**File:** `src/screens/NotificationSettingsScreen.js`

Add at the top, above existing per-channel toggles:

```jsx
<Text style={s.sectionLabel}>NOTIFICATION RHYTHM</Text>
{BUNDLES.map(b => (
  <BundleRow
    key={b.id}
    bundle={b}
    selected={currentBundle === b.id}
    onSelect={() => applyNotificationBundle(b.id)}
  />
))}
<BundleRow
  bundle={{ id: 'custom', title: 'Custom', desc: 'Pick exactly which notifications you want.' }}
  selected={currentBundle === 'custom'}
  onSelect={() => setCurrentBundle('custom')}
/>

<View style={s.divider} />

{currentBundle === 'custom' && (
  <>
    {/* existing per-channel toggles */}
  </>
)}
```

When the user touches an individual toggle in the existing list, auto-set bundle to 'custom'.

---

## Analytics events to add

In `src/services/analytics.js`, extend `EVENTS`:

```js
export const EVENTS = {
  // ... existing ...

  // New onboarding events
  ONBOARDING_WAKE_TIME_SET: 'onboarding_wake_time_set',
  ONBOARDING_NOTIF_BUNDLE_PICKED: 'onboarding_notif_bundle_picked',

  // New activation events
  D1_PUSH_OPENED: 'd1_push_opened',
  FIRST_INSIGHT_SAVED: 'first_insight_saved',

  // (existing events to verify)
  POST_CHART_CTA_SHOWN: 'post_chart_cta_shown',          // ✓ exists
  POST_CHART_CTA_TAPPED: 'post_chart_cta_tapped',        // ✓ exists
  CHART_REVEALED: 'chart_revealed',                       // ✓ exists
  ONBOARDING_STARTED: 'onboarding_started',              // ✓ exists
  ONBOARDING_COMPLETED: 'onboarding_completed',          // ✓ exists
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed', // ✓ exists
  NOTIFICATION_PERMISSION_REQUESTED: '...',              // ✓ exists
  NOTIFICATION_PERMISSION_GRANTED: '...',                // ✓ exists
  NOTIFICATION_PERMISSION_DENIED: '...',                 // ✓ exists
};
```

`D1_PUSH_OPENED` instrumentation: in `handleNotificationNavigation` (`notificationService.js:700`), capture event with `time_since_fire_ms` (Date.now() − scheduled fire time, if available via notification data payload).

---

## Risk register

| Risk | Mitigation |
|---|---|
| Bundle choice screen drops conversion 2%+ (one extra tap) | A/B test gates the rollout; if material drop, fold bundle into wake screen as a secondary chip-row |
| Permission modal preview backfires (push body too revealing) | The preview text is already what user just read — psychological priming is desired |
| Paywall consolidation reduces conversion vs. 3-step | A/B test; if drop > 1.5%, restore the reassurance step as a mid-step |
| First-action save affordance gets ignored (low save rate) | Acceptable — D1 retention is the metric, not save rate. If save rate > 0% AND D1 retention up, success |
| Wake-time "Varies" maps poorly | Default to 7:30; soft branched copy in templates |
| Bundle change in Settings breaks existing schedules | `applyNotificationBundle` should re-run `scheduleAllNotifications` |
| TOTAL_STEPS change breaks progress bar | Single line change, cover with regression check |
| New onboarding screens cause iOS Notification Permission to be re-requested | Use `loadBoolean(StorageKeys.NOTIFICATION_ASKED)` guard (already exists) |

---

## Rollout plan

### Stage 1 — Internal builds (week 1)

Ship Phase 1 changes behind a feature flag `onboarding_v2_enabled`. Test:
- Bundle screen with each of 3 options.
- Wake screen with each option including "Varies."
- Permission modal preview with various reveal-statement lengths.
- Settings screen bundle selector with all transitions to/from "custom."

### Stage 2 — TestFlight 5% (week 2)

5% of new installs get the new flow. Monitor:
- Onboarding completion rate (target: parity with control or +5%).
- Notification permission grant rate (target: +10% over control).
- D1 push-driven open rate.
- D7 retention.

If metrics are flat or negative, hold rollout and diagnose. If positive, expand.

### Stage 3 — TestFlight 50% (week 3)

Confirm the lift at scale. Iterate on copy if needed.

### Stage 4 — Full rollout (week 4)

100%. Disable feature flag. Remove control-arm code.

### Stage 5 — A/B tests within new flow (week 5+)

Run the 4 A/B tests from [04-notifications-and-first-week.md](04-notifications-and-first-week.md). Each runs ~2 weeks at 50/50.

---

## What we don't do in this plan

- **No new chart data collection.** Birth date, time, place is enough.
- **No quiz funnel expansion.** 4 emotional questions stays at 4. Don't drift toward Nebula.
- **No discount-timer pressure tactics on paywall.** Trust > urgency.
- **No social-login during onboarding.** Auth happens after onboarding (existing flow). Adding a "Sign in with Apple" step pre-paywall has tested poorly in similar apps.
- **No multi-language support yet.** English only for v1 of this plan.
- **No Android-specific flow changes.** Same flow on both platforms; the bundle-choice screen works identically.

---

## Definition of done

- [ ] All Phase 1 + Phase 2 tasks shipped behind feature flag
- [ ] All Phase 3 instrumentation events firing in PostHog
- [ ] 50/50 A/B test running in production for ≥ 2 weeks
- [ ] D1 retention shows ≥ 5pp lift for new flow
- [ ] Notification permission grant rate shows ≥ 10pp lift
- [ ] Onboarding completion rate within 2pp of control (no regression)
- [ ] Trial-to-paid conversion within 1pp of control (no regression)
- [ ] Documentation updated: CLAUDE.md mentions new flow, plan/ folder archived

When all eight bullets are true, this plan is shipped. Then the new baseline becomes the next plan's "current state."
