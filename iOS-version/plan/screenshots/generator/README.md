# Celestia — Screenshot Generator

Next.js page that renders the 7 App Store marketing screenshots and exports them at Apple's required iPhone resolutions.

Built per `plan/03-screenshot-spec.md`. All hero captions are pre-audited against the v1 banned-word list.

## Run

```bash
cd plan/screenshots/generator
npm run dev
```

Open http://localhost:3000.

## What you'll see

A grid of 7 preview cards — one per frame. Each card has a scaled live preview, an export button, and a frame ID. A toolbar lets you pick which Apple iPhone size to export.

| Size | Use for |
|---|---|
| **6.9"** (1320×2868) | iPhone 16 Pro Max — required primary submission |
| 6.5" (1284×2778) | iPhone XS Max |
| 6.3" (1206×2622) | iPhone 16 Pro |
| 6.1" (1125×2436) | iPhone XR |

**Submit at 6.9".** Apple auto-scales for other devices.

The "Export all (7)" button downloads the entire set at the currently-selected size.

## Editing captions

All hero captions are inline in `src/app/page.tsx`. If you change one, re-run the banned-word audit per `plan/03-screenshot-spec.md` before exporting:

`horoscope · zodiac · fortune · tarot · destiny · predict · cosmic · divine · sacred · oracle · crystal · numerology · Mercury retrograde · the universe · the stars · soulmate · soul-level · karmic · manifest`

Required count: **0** in any caption.

## Re-capturing simulator screenshots

If the in-app UI changes, re-capture in the iPhone 15/16 Pro Max simulator after running **Profile → DEVELOPER → Fill Demo Data**, then convert and replace:

```bash
sips -s format png /path/to/new-capture.jpg --out public/screenshots/en/0X_xxx.png
```

The dev server hot-reloads.

## Final upload order (per SELECTION.md)

1. `01_hero` — brand hook
2. `02_connections` — multi-relationship breadth
3. `03_ask-ai` — AI advisor + compliance
4. `04_compat` — depth proof
5. `05_today` — Mindfulness alignment
6. `06_blueprint` — self-discovery payoff
7. `07_privacy` — trust closer
