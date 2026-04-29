# Privacy Policy

**Last updated:** 2026-04-28
**Effective date:** 2026-04-28

---

## Quick summary

- Celestia stores your data **on your device only**, in a local database. No cloud account, no sign-in.
- We do **not** collect your email, your name beyond the first name you choose to share, your location, your contacts, your photos, or any advertising identifier.
- We do not sell your data. We never have. We never will.
- We make outbound network calls only to two providers: **Google Gemini** (to generate AI reflections) and **Nominatim / OpenStreetMap** (to look up the birth city you type during onboarding). Both calls are anonymous — your name and any persistent ID are never sent.
- You can delete everything any time using **Profile → Reset App Data**, or by deleting the app. There is nothing on a server to delete because we do not run user-data servers.

---

## 1. Who we are

Celestia ("we", "us", "our") is operated by **P Nandini**, based in **India**.

You can reach us at **nandinipalakodeti0@gmail.com**.

We make Celestia, an iPhone app that uses birth-chart math as a starting point for written reflections about yourself and the relationships in your life.

## 2. What information we collect

### 2.1 Information you give us during onboarding

When you first set up Celestia, you provide:

- **Your first name** — used to personalize content. You may use a nickname.
- **Your birth date, birth time, and birth city** — used to compute the planetary positions that anchor the app's reflections.
- **A short set of preference choices** (e.g. what you'd like to focus on — relationships, self-understanding, decisions). These are stored as small numbers and labels, not free text.

This information is stored **locally on your device** in a SQLite database called `celestia_v1.db` and in iOS-managed AsyncStorage. It is not transmitted to a Celestia-operated server because we do not run servers that store user data.

### 2.2 Information about people you add ("partner data")

When you add a person to your **Connections** (a partner, friend, parent, sibling, child, colleague, boss, or someone else), you may enter:

- Their **first name or nickname**
- Their **birth date**
- Their **birth time** (optional)
- Their **birth city** (optional)
- A relationship label you choose (e.g. "partner", "colleague")

This information is stored **locally on your device only**.

**Important:** before saving, the app shows you a clear notice that you are entering another person's data and asks you to confirm you have their permission. Please respect that confirmation. Do not enter information about other people without their knowledge and consent.

If a person you have added asks you to remove their data, please remove them from Connections. Doing so deletes their entry from the local database immediately.

### 2.3 Information generated as you use the app

While you use Celestia, the following are saved on your device:

- **Journal entries** you write
- **Chat messages** between you and the AI ("Ask")
- **Reports** you generate
- **Preferences** (notification toggles, the optional "Discovery view" toggle, theme)
- **Counters** the app uses to pace prompts (for example, how many free chats you have used)

All of this is stored locally on your device. None of it is sent to a Celestia server.

### 2.4 Information we do **not** collect

We do not collect, request, or store any of:

- Your email address
- Your phone number
- Your real legal name (we ask only for a first name or nickname)
- Your physical or precise location at any point — we use the *birth* city you type, not your current GPS position
- Your contacts, photos, calendar, microphone, or camera
- Apple's Advertising Identifier (IDFA)
- Any persistent unique device ID
- Any payment or billing information (the app has no in-app purchases in this version)
- Any health or fitness data (we do not use HealthKit)
- Any biometric data

The app does not use any third-party analytics SDK, crash-reporting SDK, advertising SDK, or attribution SDK in this version.

## 3. How your information is used

### 3.1 On your device

Locally, your information is used to:

- Calculate your astrological chart using a public open-source library (`astronomy-engine`).
- Compare your chart with the charts of people you add, to generate compatibility reflections.
- Display personalized text inside the app (daily reading, journal prompts, "Ask" replies, reports).
- Pace gentle prompts (e.g. when to suggest reflecting on a Connection).

### 3.2 Outbound network calls — what leaves your device

The app contacts only two third-party endpoints. Neither call is linked to your real identity.

#### a) Google Gemini (AI text generation)

When you tap to generate a daily reading, send a chat message, generate a report, or run a Connection analysis, the app sends a text request to **Google's Gemini API** at `generativelanguage.googleapis.com`.

**What is sent:**
- Compact chart facts derived from the birth data (e.g. "Sun in Cancer at 12°", "Mars trine Jupiter").
- The question or journal entry you typed (when you initiated a chat or report).
- A small amount of recent conversation context so replies stay coherent.

**What is NOT sent:**
- Your name (or any name).
- Your email or device identifier.
- Any persistent ID linking the request to who you are or to other requests beyond the current session.

**What Google does with it:** Google processes the request and returns the AI text. According to Google's API terms, paid Gemini API content is not used to train Google's models. See <https://ai.google.dev/gemini-api/terms>.

#### b) Nominatim / OpenStreetMap (birth-city lookup)

When you type a birth city (yours, or a Connection's), the app queries **Nominatim**, a free public geocoding service operated by the OpenStreetMap Foundation, at `nominatim.openstreetmap.org`.

**What is sent:** the partial city string you type (e.g. "lis" → returns "Lisbon, Portugal" with latitude/longitude).

**What is NOT sent:** your name, identifier, location, or anything else about you.

This call happens once per city lookup. The latitude/longitude returned is stored locally for future chart calculations so the lookup does not need to repeat.

### 3.3 What we do **not** do

We do not:

- Sell your data.
- Share your data with advertisers, data brokers, or marketing partners.
- Use your data to retarget you on other apps or websites.
- Build behavioral profiles for marketing.
- Run analytics, crash reporting, or attribution.

## 4. Where your data lives

| Data type | Location | Encryption |
|---|---|---|
| Your chart, profile, journal, chats, Connections, preferences | Your device, SQLite + AsyncStorage | iOS Data Protection — encrypted at rest while the device is locked |
| AI request/response (transient) | Google Gemini servers | TLS in transit |
| City lookup query (transient) | OpenStreetMap / Nominatim servers | TLS in transit |

There is **no Celestia-operated server** that stores your data.

## 5. How long your data is kept

Your local data lives on your device until you:

- Open **Profile → Reset App Data**, which immediately wipes the SQLite database and clears AsyncStorage; **or**
- Delete the app from your device, which removes the database and storage entirely.

There is no server-side retention because we do not store your data on any server we operate.

Data sent to Google Gemini at AI call-time is governed by Google's retention policy at <https://ai.google.dev/gemini-api/terms>. As of writing, Gemini API requests over the paid API are not retained for model training.

Data sent to Nominatim is a public anonymous query and is governed by the [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/).

## 6. Your rights

Because all of your data lives on your device, in practice you exercise these rights yourself in the app:

- **Access** — open the app; your data is the app.
- **Correction** — edit your profile, edit any Connection, or rewrite any journal entry, anytime.
- **Deletion** — Profile → **Reset App Data** wipes everything immediately. Or delete the app.
- **Restriction** — turn off notifications in Profile, or simply close the app. Without your action the app is not generating data on its own.
- **Portability** — v1 does not offer an export bundle. We plan to add export in a future version. Email us if you need a one-off help.
- **Objection** — close or delete the app at any time.

For data sent to third parties (Google, Nominatim) please exercise your rights directly with each provider.

If you are an EU/EEA/UK resident (GDPR/UK GDPR), a California resident (CCPA/CPRA), or a resident of another jurisdiction with similar data-protection law (e.g. India's DPDP, Brazil's LGPD), the rights above apply to you and you may also have a right to lodge a complaint with your local supervisory authority. Contact us at **nandinipalakodeti0@gmail.com** and we will help where we can. Because we do not maintain a database of users, the practical answer to most requests is *"your data is on your device and you can delete it yourself"* — but please reach out and we will assist.

We do not respond to requests to "stop selling" your data because **we do not sell your data**.

## 7. Children

Celestia is rated **17+** on the App Store. It is not intended for children under 13 (or under 16 where local law sets that age). We do not knowingly collect data from children.

If you are a parent or guardian and believe a child has used Celestia and entered information you would like removed, contact us at **nandinipalakodeti0@gmail.com** and we will help — typically by walking you through Profile → Reset App Data.

## 8. International users

Celestia is offered globally via the Apple App Store. Because your data is stored on your device, the law that primarily applies is the law of your jurisdiction.

When you use AI features, requests are sent to Google's Gemini infrastructure, which is global. When you use city lookup, requests are sent to OpenStreetMap servers (typically based in the EU). By using these features you consent to the network traffic involved.

## 9. Security

We rely on the security mechanisms of the iOS platform:

- **Data Protection** — files are encrypted at rest while the device is locked.
- **Sandboxing** — apps cannot read each other's data.
- **TLS** — all outbound network calls use TLS.

We do not run a user-data server, so we have no user database that can be breached and no user passwords that can be lost.

API keys for third-party services (e.g. Gemini) are bundled into the app binary, which is the standard pattern for mobile apps. Keys can in principle be extracted by a determined party. We monitor for abuse and rotate keys as needed.

## 10. Changes to this policy

We will update this policy when the app changes (for example, when we add a new feature that touches data). Material changes will be flagged in the app's release notes and the **Last updated** date at the top of this page will move forward.

If you keep using Celestia after a material change, you accept the updated policy.

## 11. Contact

Questions about your data or this policy:

**nandinipalakodeti0@gmail.com**

