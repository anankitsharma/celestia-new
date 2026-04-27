# 04 — Privacy Policy

This is the **public privacy policy text** to host at `https://celestia.app/privacy` (or wherever you choose to host it). The URL goes into App Store Connect's required Privacy Policy URL field.

The text below is in the form of a hostable HTML/Markdown document. It is calibrated for:
- Apple Guideline 5.1.1 (data collection, storage)
- Apple Guideline 5.1.2 (data use & sharing)
- GDPR (Article 13 — info to data subjects)
- CCPA (basic disclosure rights)
- Apple's Privacy Nutrition Label categories

This document is not legal advice. Have a lawyer review before publishing if you have one. The text below is calibrated to be clear, accurate, and unlikely to attract a 5.1.1 reject.

---

# Hostable Document

**Title:** Privacy Policy
**Last updated:** [INSERT DATE BEFORE PUBLISHING]
**Effective date:** [INSERT DATE BEFORE PUBLISHING]

---

## Quick summary (TL;DR)

- Celestia stores your data **on your device only**, in a local SQLite database.
- We do **not** require sign-in. We do not collect your email, your name, or your real identity.
- We do not sell your data. We never have. We never will.
- The only outbound network calls we make are to: (a) **Google Gemini** to generate AI insights, (b) **Nominatim** (OpenStreetMap) to look up your birth city, and (c) **PostHog** for anonymous usage statistics if you have not opted out.
- You can delete everything ("Reset App Data") from the Profile screen at any time. There is nothing on our servers to delete because we do not have your data.

---

## 1. Who we are

Celestia ("we", "us") is operated by [YOUR LEGAL ENTITY / YOUR NAME], based in [COUNTRY]. You can reach us at **support@celestia.app**.

We make Celestia, an iPhone app that helps people understand the relationships in their lives using birth-chart data.

## 2. What information we collect

### 2.1 Information you give us during onboarding

When you set up Celestia, you provide:

- **Your first name** (used to personalize the app)
- **Your birth date, birth time, and birth city** (used to calculate your astrological chart)
- **Optional choices** about what you'd like the app to focus on (relationship clarity, self-understanding, etc.)

This information is stored **locally on your device** in a SQLite database (`celestia_v1.db`). It is not transmitted to our servers because we do not run servers that store user data.

### 2.2 Information about people you add ("Other Users' Data")

When you add a person to your Circle (a partner, friend, family member, colleague, or other), you may enter:

- Their name
- Their birth date
- Their birth time (optional)
- Their birth city (optional)

This information is stored **locally on your device only**. It is not transmitted to our servers.

**Important:** by adding a person to your Circle, you confirm that they have shared this information with you for this purpose. Do not enter information about other people without their knowledge and consent. Celestia will display a confirmation prompt the first time you add someone other than yourself.

### 2.3 Information generated as you use the app

The app stores locally:

- Your journal entries (if you write any)
- Your chat history with the AI advisor
- Your engagement data (streaks, badges, levels)
- Your preferences (notification toggles, voice preference, theme)

All of this is stored locally on your device.

### 2.4 Information we do **not** collect

We do not collect or store:
- Your email address (we do not have sign-in)
- Your phone number
- Your real name (only the first name you choose to provide)
- Your physical location at any point after onboarding (we use your *birth* city for chart math, not your current location)
- Your contacts
- Your photos
- Your calendar
- Your microphone or camera
- Your IDFA (Apple advertising identifier)
- Your device's unique hardware identifiers

## 3. How your data is used

### 3.1 On your device

Your local data is used to:
- Calculate your astrological chart (using a public open-source library called `astronomy-engine`)
- Compare your chart with the charts of people you add (to generate insights)
- Display personalized content in the app
- Power your AI conversations (we send relevant chart data — not your name or any account ID — to Google Gemini)

### 3.2 Outbound network calls

The app makes the following types of outbound network calls. None of them are linked to your real identity.

#### a) Google Gemini (AI insights)

When you tap to generate a daily reading, ask the AI a question, generate a report, or run a relationship analysis, we send relevant chart data to **Google's Gemini API** at `generativelanguage.googleapis.com`.

What gets sent: planetary positions (e.g. "Sun in Cancer at 12°"), aspects (e.g. "Mars trine Jupiter"), the question you asked, and a small amount of conversation context.

What does NOT get sent: your name, your email, your device ID, any persistent identifier of who you are.

What Google does with it: Google processes the request and returns the AI response. According to Google's terms, Gemini API data is not used to train Google's models when accessed via the standard API. See https://ai.google.dev/gemini-api/terms for Google's terms.

#### b) Nominatim / OpenStreetMap (city lookup)

When you type your birth city (or a partner's birth city) during onboarding, we query **Nominatim**, a free public geocoding service operated by the OpenStreetMap Foundation, at `nominatim.openstreetmap.org`. The query contains only the partial city name you've typed (e.g. "Lis" → returns "Lisbon, Portugal"). No identifier of who you are is sent.

#### c) PostHog (anonymous usage analytics, optional)

If you have not opted out, the app sends anonymous usage events (e.g. "screen_viewed", "onboarding_completed") to **PostHog** at `us.i.posthog.com`. PostHog assigns a random anonymous ID per device install, not linked to any real identity. We use this to understand which screens are useful and where people get stuck.

You can disable PostHog at any time from the Profile → Privacy section of the app.

[**If PostHog is removed for v1, delete this entire section (c) before publishing.**]

#### d) Supabase (currently unused in this version)

A Supabase client is included in the app for potential future cloud-backup features, but it is not used in the current version. No data is sent to Supabase from this version of the app.

### 3.3 What we don't do with your data

We don't:
- Sell your data
- Share your data with advertisers
- Use your data to retarget you on other platforms
- Build a profile of you for marketing

## 4. Where your data lives

| Data type | Location | Encryption |
|---|---|---|
| Your chart, journal, partners, preferences | Your device, SQLite | Protected by iOS Data Protection (encrypted when device is locked) |
| AI request/response context | Sent to Google Gemini, transient | TLS in transit |
| City lookup queries | Sent to Nominatim, transient | TLS in transit |
| Usage analytics | Sent to PostHog (if enabled) | TLS in transit |
| Birth-data of people you add | Your device, SQLite | Same as your own data |

There is no Celestia-operated server that stores your data.

## 5. How long your data is kept

Your local data lives on your device until you:
- Tap "Reset App Data" in Profile → which immediately wipes the local SQLite database and AsyncStorage
- Uninstall the app → which removes the database and storage entirely

There is no server-side retention because we do not store your data on a server.

Data sent to Google Gemini is governed by Google's retention policy at https://ai.google.dev/gemini-api/terms.

Data sent to PostHog is retained per PostHog's policy. PostHog supports user-deletion requests at https://posthog.com/privacy.

## 6. Your rights

Because all of your data lives on your device:

- **Access:** open the app — your data is the app
- **Correction:** edit your profile or any partner anytime in the app
- **Deletion:** Profile → "Reset App Data" wipes everything immediately. Or uninstall the app.
- **Portability:** v1 does not include export tooling. We plan to add a data-export feature in a future version.

For data sent to third parties (Google, Nominatim, PostHog), exercise rights directly with each provider.

If you are an EU/EEA/UK or California resident, you may have additional rights under GDPR, UK GDPR, or CCPA. Contact us at support@celestia.app and we will assist where possible. Because we don't operate a database of users, the practical answer to most requests is "your data is on your device and you can delete it yourself" — but reach out and we will help.

## 7. Children

Celestia is rated 17+ on the App Store and is not intended for children under 13. We do not knowingly collect data from children. If you are a parent and believe your child has used Celestia, contact us and we will assist.

## 8. International users

Celestia is offered globally via the App Store. Because data is stored on your device, the application of any country's data laws is determined primarily by your jurisdiction.

When you use AI features, requests are sent to Google's Gemini API, which routes traffic through Google's global infrastructure. When you use city lookup, requests are sent to OpenStreetMap servers (typically EU-located).

## 9. Security

We rely on iOS's built-in security:
- Data Protection (file encryption when the device is locked)
- TLS for all outbound network calls
- App sandboxing (apps can't read each other's data)

We do not run a server, so we don't have credentials to lose or a database to be breached.

API keys for third-party services (Gemini, Supabase) are bundled with the app. As is standard practice for mobile apps, these keys can be extracted from the binary by a determined party. We monitor for abuse of these keys and rotate as needed.

## 10. Changes to this policy

We may update this policy when we add features. Material changes will be flagged in the app's release notes.

The "Last updated" date at the top reflects the most recent change.

## 11. Contact

Questions about your data or this policy: **support@celestia.app**

---

# Editor's notes (delete before publishing)

## Required substitutions before going live

| Placeholder | Replace with |
|---|---|
| `[YOUR LEGAL ENTITY / YOUR NAME]` | The actual entity submitting to Apple |
| `[COUNTRY]` | Your country |
| `[INSERT DATE BEFORE PUBLISHING]` | Today's date (YYYY-MM-DD) |
| `https://celestia.app/privacy` | Your actual hosted URL |
| `support@celestia.app` | Your actual contact email — must be a working address |

## If PostHog is removed for v1

Delete:
- Section 3.2(c) entirely
- The PostHog row in Section 4
- The PostHog reference in Section 5

## If Supabase is removed for v1

Delete Section 3.2(d).

## App Store Connect Privacy Nutrition Label

When filling the privacy disclosure in App Store Connect, the answers must align with this policy. Reference table:

| ASC question | Answer | Reasoning |
|---|---|---|
| Do you collect data? | YES | We collect locally and pass minimal data to Gemini/PostHog/Nominatim |
| Identifiers > User ID? | YES (random local UUID) | Generated for the local profile |
| Identifiers > Device ID? | NO (assuming PostHog opt-out or removal) | iOS IDFA not used |
| Location > Coarse Location? | YES | Birth city via Nominatim |
| Location > Precise Location? | NO | We don't read GPS |
| User Content > Other User Content? | YES | Chart data, journal entries, partners stored locally |
| Diagnostics > Crash Data? | YES if PostHog kept; NO otherwise | |
| Diagnostics > Performance Data? | YES if PostHog kept; NO otherwise | |
| Other Data? | YES | Birth data of the people the user adds |
| Used for tracking? | NO | We don't track across apps/sites |

## Hosting

The cheapest path:
1. GitHub Pages (free, custom domain optional)
2. Notion publish-to-web (free, ugly URL)
3. Vercel/Cloudflare static hosting (free, custom domain)

The URL must work, return 200, and serve text — not a redirect to a blank page or a "coming soon" placeholder. Apple checks the URL.
