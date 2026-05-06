# Dependency Install — Manual Tasks

1 task: install `expo-store-review` then notify me to auto-wire the 5-line review prompt.

Estimated total: 5 minutes.

---

## Task 04.1 — Install expo-store-review + notify for wire-up

**Task ID:** #109
**Priority:** P1 — minor star-rating boost; not a blocker
**Estimated time:** 5 minutes

### Why this matters

App Store star rating disproportionately affects organic conversion. Users with a strong streak-7 milestone are at an emotional peak — the highest-conversion moment for an in-app review prompt. Apple's `SKStoreReviewController` shows a system modal that doesn't leave the app, doesn't disrupt the experience, and Apple handles rate limiting (max 3 prompts per 365 days per user).

### What to do

```bash
cd "/Users/apple/Documents/Expo apps/Celestia-new"
npx expo install expo-store-review
```

This will:
1. Add `expo-store-review` to package.json dependencies
2. Update package-lock.json
3. May require a build refresh if you're using EAS

### After install — notify me

Tell me the install is done. I'll then add the 5-line wire-up to `HomeScreen.js`:

```js
import * as StoreReview from 'expo-store-review';

// Inside the streak === 7 block, after streak milestone modal sets:
if (streak.current_streak === 7) {
  try {
    if (await StoreReview.isAvailableAsync()) {
      // Wait for milestone modal to be acknowledged before prompting
      setTimeout(async () => {
        await StoreReview.requestReview();
        capture('review_prompt_shown', { trigger: 'streak_milestone_7' });
      }, 4500);
    }
  } catch {}
}
```

This places the review prompt 4.5 seconds AFTER the streak milestone modal renders — gives the user a moment to feel the achievement before the prompt lands.

### Acceptance criteria

- [ ] `expo-store-review` listed in package.json dependencies
- [ ] `npm install` runs without errors
- [ ] Build refresh completed if using EAS (`eas build --profile preview` to verify)
- [ ] Notify me to add the wire-up code

### Notes / gotchas

- **Apple guideline**: max 3 prompts per 365 days per user — Apple handles this automatically; don't try to override
- **Don't prompt new users**: the streak-7 trigger naturally waits ≥7 days, which is the right minimum
- **Test on physical device**: review prompts are no-ops in Simulator/Emulator — the API call returns success but no UI shows
- **Don't call `requestReview()` after a negative event**: the existing trigger (streak-7 milestone) is positive — that's correct
- **Don't deep-link to App Store directly**: that bypasses Apple's review flow and counts against your rating less
- **Play Store**: `expo-store-review` works on Android too, using Google's In-App Review API; same rate limiting applies
