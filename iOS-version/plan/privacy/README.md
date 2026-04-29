# Celestia — Legal Pages (v1.1 Resubmission)

Hostable Markdown for the public-facing legal documents the App Store and v1 of the app reference.

## Files in this directory

| File | What it is | Hosted at (suggested) |
|---|---|---|
| `privacy-policy.md` | Public privacy policy — required by Apple Guideline 5.1.1 + GDPR/CCPA/DPDP | `https://celestia.app/privacy` |
| `terms-of-service.md` | Public terms of service — required as user-facing terms | `https://celestia.app/terms` |
| `eula.md` | End User License Agreement — required by Apple if not using Apple's Standard EULA | `https://celestia.app/eula` |
| `ai-disclaimer.md` | Standalone AI safety + reflection-not-advice page (Apple Guideline 4.3 / 5.5 defense) | `https://celestia.app/ai-disclaimer` |
| `data-deletion.md` | Account/data deletion instructions — required by Apple 5.1.1(v) | `https://celestia.app/delete-data` |
| `support.md` | Public support / FAQ / troubleshooting page — fills ASC's Support URL field | `https://celestia.app/support` |
| `about.md` | Public brand / story / features page — fills ASC's Marketing URL field | `https://celestia.app/about` (or `/`) |
| `index.md` | Public legal landing page that links the docs above | `https://celestia.app/legal` |

## State of the app these pages reflect

This v1 build (version 1.1.0, buildNumber 1) deliberately ships a minimal surface to clear App Review:

- **No analytics SDK** — PostHog removed.
- **No in-app purchases** — RevenueCat removed.
- **No sign-in / no accounts** — Supabase auth not used in v1; no Sign in with Apple.
- **No advertising / no tracking.**
- **Local-first** — all user data lives in `celestia_v1.db` (SQLite) on device + AsyncStorage.
- **AI** — Google Gemini API for reflective text generation only.
- **Geocoding** — Nominatim (OpenStreetMap) for one-time birth-city lookup.

If a future version reintroduces auth, IAP, or analytics, the relevant sections of these documents must be uncommented or rewritten — see the `Editor's notes` block at the bottom of each file.

## Substitutions before publishing

Each document contains a small set of `[BRACKETED]` placeholders. Find-and-replace before pushing to your host:

| Placeholder | Replace with |
|---|---|
| `[YOUR LEGAL ENTITY / YOUR NAME]` | The legal entity submitting to Apple (e.g. an LLC, sole-proprietor name) |
| `[YOUR COUNTRY]` | Country of that entity (e.g. "India", "United States") |
| `[YOUR COUNTRY / STATE]` | Jurisdiction for governing law (e.g. "Delaware, USA", "Karnataka, India") |
| `[INSERT DATE BEFORE PUBLISHING]` | Today's date in ISO form, e.g. `2026-04-28` |
| `support@celestia.app` | Your actual reachable support inbox |
| `https://celestia.app/...` | The actual URL once you've decided on a host |

## Hosting checklist

Apple's App Review checks that the privacy URL returns a real page. A "coming soon" or 404 page is a guaranteed reject.

The cheapest no-server paths:

1. **GitHub Pages** — push these `.md` files to a public repo, enable Pages, point `celestia.app` at it via DNS. Free, custom domain supported.
2. **Vercel / Cloudflare Pages** — drop a static site, free tier, custom domain.
3. **Notion publish-to-web** — quickest, but the URL is ugly and the design is generic. Acceptable for App Review but feels off-brand.

Recommended URLs:

```
https://celestia.app/privacy        → privacy-policy.md
https://celestia.app/terms          → terms-of-service.md
https://celestia.app/eula           → eula.md
https://celestia.app/ai-disclaimer  → ai-disclaimer.md
https://celestia.app/delete-data    → data-deletion.md
https://celestia.app/support        → support.md
https://celestia.app/about          → about.md
https://celestia.app/legal          → index.md
```

The two URLs `src/screens/ProfileScreen.js` already references are `/privacy` and `/terms`. If you change the paths, update `PRIVACY_URL` and `TERMS_URL` in that file before building.

## Apple App Store Connect — what these unlock

| ASC field | Source |
|---|---|
| **App Privacy → Privacy Policy URL** | `privacy-policy.md` URL |
| **App Information → License Agreement** | Either keep Apple's Standard EULA (recommended for v1) or upload `eula.md` content |
| **App Information → Privacy Policy URL** | Same as above |
| **App Information → Description** (optional links) | Can link `/terms` and `/ai-disclaimer` |
| **Account Deletion (Guideline 5.1.1(v))** | `data-deletion.md` URL — instructions for the in-app Reset App Data flow |

## Privacy Nutrition Label — answers that match these documents

When filling **App Privacy** in App Store Connect, use these answers (they must match `privacy-policy.md`):

| ASC question | Answer | Reasoning |
|---|---|---|
| Do you collect data? | **YES** | Birth data + journal sent to Gemini at AI call-time |
| Identifiers → User ID | **NO** | No account, no persistent ID across installs |
| Identifiers → Device ID / IDFA | **NO** | Not used |
| Location → Coarse Location | **YES** (linked to user, used for App Functionality) | Birth city is geocoded via Nominatim |
| Location → Precise Location | **NO** | We never read GPS |
| Contact Info → Email | **NO** | No email collected by the app (`mailto:` from Profile uses the iOS mail app — not us) |
| Contact Info → Name | **YES** (linked to user, App Functionality) | First name only, entered in onboarding |
| Health & Fitness | **NO** | No HealthKit |
| Sensitive Info | **NO** | Birth date is not "sensitive" by ASC definition |
| User Content → Other User Content | **YES** (linked, App Functionality) | Journal entries, chat messages, partner data |
| Diagnostics → Crash Data | **NO** | No analytics SDK |
| Diagnostics → Performance Data | **NO** | No analytics SDK |
| Used for Tracking | **NO** | We do not track across apps/sites |

If any answer above flips in a future version (e.g. you add Crashlytics, or add Sign in with Apple), update both this table and the privacy policy.

## Not legal advice

These documents are written to be accurate to the app and clear to a reviewer. They are **not** a substitute for review by a qualified attorney. If your jurisdiction or business model requires bespoke clauses (e.g. EU establishment, B2B contracts, GDPR DPA), have a lawyer review before you publish.
