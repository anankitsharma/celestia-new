# Android — Designer-Required Tasks

Items that can't be implemented in code alone. Hand to a designer.

## DESIGNER-1 — Monochrome themed-icon asset

**What's needed:** A single-color PNG (alpha channel only) version of the Celestia icon for Material You themed-icon support on Android 13+.

**Spec:**
- Format: PNG with alpha channel
- Size: 432×432 (or 1024×1024 for crispness)
- Color: pure white at full opacity, transparent elsewhere (Android renders the silhouette in the user's wallpaper-derived color)
- Path: `assets/android-icon-monochrome.png`
- Should match the existing `android-icon-foreground.png` shape

**Once asset exists, add to `app.json`:**

```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/android-icon-foreground.png",
    "backgroundColor": "#0E0E22",
    "monochromeImage": "./assets/android-icon-monochrome.png"
  }
}
```

**Why it matters:** Users who enable themed icons in Android 13+ see all installed apps in their wallpaper-extracted color. Apps without `monochromeImage` fall back to the regular icon, which looks visually inconsistent on a themed home screen. ~30 minutes of designer work + 1 line of config.

## DESIGNER-2 — Animated splash screen (Android 12+)

**What's needed:** An iconic animated entry — fade-in or scale-up on the central glyph during cold-start, replacing the current static splash.

**Spec:**
- Add `expo-splash-screen` plugin to app.json plugins array
- Configure animated icon: `image` (the brand glyph), `imageWidth`, `backgroundColor`
- Optional: `branding` image (logotype) below

**Why it matters:** Android 12+ has the official Splash Screen API. Apps that don't use it look "old" on launch. Fast win once the asset + config are added.

---

These are not blocking the rest of the Android Week 1 work — code-only items continue without these.
