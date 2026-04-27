# 07 — Compliance Matrix

Every Apple App Review guideline this app touches, with our current state, the change required, and where it lives.

**Legend**
- ✅ Pass already
- 🔧 Fix required (action specified)
- 🛡️ Risk-mitigated (already addressed in v1 strip-down)
- ⚠️ Watch — could be flagged but unlikely to reject

---

## 1. Safety

### 1.1 Objectionable Content
**Current:** AI may generate edgy content if pushed.
**State:** ⚠️ Watch
**Mitigation:** Gemini's default safety settings filter most. Add a "Report" affordance in chat for v1.1.

### 1.2 User-Generated Content
**Current:** No public UGC. Chat is private to the user.
**State:** ✅ Pass

### 1.4 Physical Harm
**Current:** App could give relationship "advice" interpreted as guidance.
**State:** 🔧 Fix
**Action:** AI disclaimer line in Chat + Today (`Block F` of `01-code-changes.md`). Terms of Service §3 ("Not advice") (`05-terms-of-service.md`).

### 1.5 Developer Information
**Current:** App Store Connect contact info exists.
**State:** ✅ Pass — verify monitored email in `06-app-store-connect-fields.md`.

---

## 2. Performance

### 2.1 App Completeness
**Current:** All screens render. No placeholder content.
**State:** ✅ Pass — verified during build sanity check (`08-pre-submission-checklist.md`).

### 2.2 Beta Testing
**Current:** Use TestFlight before submitting.
**State:** ✅ Pass

### 2.3.1 Accurate Metadata
**Current:** Old listing had fabricated testimonials ("Mia, 24" etc.) and "$83.88 value" strikethrough.
**State:** 🔧 Fix
**Action:**
- Removed fabricated testimonials when stripping onboarding step 13 (`Block D.1` of `01-code-changes.md`)
- Removed strikethrough pricing when stripping onboarding step 14
- New listing copy contains no unverifiable testimonials (`02-listing-copy.md`)

### 2.3.7 Misleading Metadata
**Current:** "Join thousands who stopped settling…" type claims.
**State:** 🔧 Fix
**Action:** Removed in onboarding strip-down. New description (`02-listing-copy.md`) makes no user-volume claims.

### 2.3.10 Promotional Imagery
**Current:** Screenshots may have contained "FREE" / "Best" overlays.
**State:** 🔧 Fix
**Action:** New screenshot spec forbids these overlays (`03-screenshot-spec.md`).

### 2.5.1 Public APIs Only
**Current:** Uses public APIs (Gemini, Nominatim, astronomy-engine).
**State:** ✅ Pass

### 2.5.2 Self-Contained Code
**Current:** No remote code download.
**State:** ✅ Pass

---

## 3. Business

### 3.1.1 In-App Purchase
**Current (v1.0.6):** Hardcoded prices in onboarding paywall ($49.99, $6.99, $83.88 strikethrough).
**State:** 🔧 Fix
**Action:** No IAP in v1. PaywallScreen unreachable, onboarding step 14 deleted (`Block D.1`, `Block B.1` of `01-code-changes.md`).

### 3.1.2 Subscriptions
**Current (v1.0.6):** Subscription paywall on onboarding lacked auto-renewal disclosure, EULA link, functional Privacy/Terms links.
**State:** 🔧 Fix
**Action:** No subscription in v1. Eliminates the entire 3.1.2 surface. v1.1 will add subscription with proper disclosure block.

### 3.1.3 Other Purchase Methods
**Current:** No external purchase prompts.
**State:** ✅ Pass

### 3.2 Other Business Model Issues
**Current:** Free app, no monetization.
**State:** ✅ Pass

---

## 4. Design

### 4.0 Design Quality
**Current (v1.0.6):** Non-functional Terms / Privacy links in AuthScreen + PaywallScreen (styled as links, no `onPress`).
**State:** 🔧 Fix
**Action:**
- AuthScreen unreachable (`Block B.1` of `01-code-changes.md`)
- PaywallScreen unreachable
- Profile gets functional Privacy/Terms links (`Block H.1` of `01-code-changes.md`)

### 4.1 Copycats
**Current:** Original brand and design.
**State:** ✅ Pass

### 4.2 Minimum Functionality
**Current:** App has substantial functionality (chart, AI, relationships, reports).
**State:** ✅ Pass

### 4.3(a) Spam — Repeated Submission
**Current:** This is a re-submission of the same app.
**State:** ✅ Pass — same bundle ID, same Team. Apple expects iteration on rejected submissions.

### 4.3(b) Spam — Saturated Category ⚠️ THE BIG ONE ⚠️
**Current (v1.0.6):** Title `Celestia Astrology & Horoscope`, daily-horoscope-led UX, listing copy is the canonical category bundle.
**State:** 🔧 Fix — primary rejection cause
**Action:**
- Rename: `Celestia: Relationship Compass` (`02-listing-copy.md`)
- Reposition: lead with Circle tab, demote Today (`Block B.1` of `01-code-changes.md`)
- Rewrite listing: 0 instances of horoscope/zodiac/fortune (`02-listing-copy.md`)
- Re-screenshot: lead with Circle (`03-screenshot-spec.md`)
- Reviewer note explains the repositioning (`02-listing-copy.md` §13)

### 4.4 Extensions
**Current:** No extensions / widgets / app clips.
**State:** ✅ Pass

### 4.5 Apple Sites and Services
**Current:** No misuse of Apple services.
**State:** ✅ Pass

### 4.5.4 Push Notifications — Promotion
**Current:** Streak / transit / morning briefing notifications. None purely promotional.
**State:** ⚠️ Watch
**Mitigation:** Notifications must be informational, not "Try premium for free!" type marketing. Verify content templates in `notificationContentEngine.js` are all informational.

### 4.7 HTML5 Games / Mini-apps / Bots
**Current:** N/A.
**State:** ✅ Pass

### 4.8 Sign in with Apple
**Current (v1.0.6):** Google sign-in offered without Sign in with Apple. **HARD REJECT TRIGGER.**
**State:** 🔧 Fix
**Action:** No third-party sign-in in v1 → 4.8 not triggered (`Block B.1`, `Block C.1` of `01-code-changes.md`). v1.1 adds Sign in with Apple alongside Google.

---

## 5. Legal

### 5.1.1 Privacy — Data Collection and Storage
**Current (v1.0.6):** Privacy Policy URL was non-functional in some surfaces; partner data collection undisclosed.
**State:** 🔧 Fix
**Action:**
- Privacy Policy hosted at public URL (`04-privacy-policy.md`)
- Privacy URL set in App Store Connect (`06-app-store-connect-fields.md`)
- Privacy / Terms / Support links functional in Profile (`Block H.1` of `01-code-changes.md`)
- Partner data disclosed in Privacy Policy §2.2 + nutrition label (`04-privacy-policy.md`)
- Partner consent modal added in CompatibilityScreen (`Block G.1` of `01-code-changes.md`)
- Privacy Nutrition Label correctly answered (`06-app-store-connect-fields.md`)

### 5.1.1(v) Account Deletion
**Current:** Original DeleteAccount existed but auth-tied. Without auth, the equivalent is a local-data wipe.
**State:** 🔧 Fix
**Action:** "Reset App Data" in Profile (`Block A.3`, `Block E.5` of `01-code-changes.md`).

### 5.1.2 Data Use & Sharing
**Current (v1.0.6):** Partner birth data sent to Gemini without disclosure or consent.
**State:** 🔧 Fix
**Action:**
- Disclosed in Privacy Policy §3.2(a) (`04-privacy-policy.md`)
- User informed in partner-consent modal (`Block G.1` of `01-code-changes.md`)
- No PII sent to Gemini — only chart data (planetary positions) (`04-privacy-policy.md` §3.2(a))

### 5.1.3 Health and Health Research
**Current:** Not a health app.
**State:** ✅ Pass

### 5.1.4 Kids
**Current:** Not aimed at kids. 17+ rating.
**State:** ✅ Pass

### 5.2 Intellectual Property
**Current:** Original code, original brand.
**State:** ✅ Pass

### 5.3 Gaming / Gambling / Contests
**Current:** N/A.
**State:** ✅ Pass

### 5.4 VPN
**Current:** N/A.
**State:** ✅ Pass

### 5.5 Mobile Provider / Fortune-Telling
**Current:** Astrology content present.
**State:** ⚠️ Watch
**Mitigation:**
- Content framed as "reflection" not "prediction"
- AI disclaimer present (`Block F` of `01-code-changes.md`)
- Terms §3 "Not advice" + §5 "Astrology disclaimer" (`05-terms-of-service.md`)
- App rated 17+

### 5.6 Developer Code of Conduct
**Current:** Compliant.
**State:** ✅ Pass

---

## Privacy Manifests (iOS 17+ requirement)

### Required SDK privacy manifests
Apps submitted to App Store Connect after May 1, 2024 must include privacy manifests for several "commonly required reason" APIs and for any third-party SDK that uses them.

**Action items:**
- [ ] Verify Expo SDK 54 includes a privacy manifest (`PrivacyInfo.xcprivacy`) — expected behavior; verify in EAS build logs
- [ ] Verify `posthog-react-native` ships a privacy manifest (if PostHog is kept)
- [ ] Verify `@supabase/supabase-js` ships a privacy manifest (file is in the bundle but unused — should be ok)
- [ ] Verify `react-native-purchases` ships a privacy manifest (file is in the bundle but unused — should be ok)
- [ ] Verify `@react-native-google-signin/google-signin` ships a privacy manifest (file is in the bundle but unused)

If any third-party SDK doesn't ship a privacy manifest, App Store Connect will reject the binary at upload with an explicit error message. Fix by:
- Updating the SDK to a version that includes one
- Or removing the SDK if unused

For v1, the simplest path: `npm update` everything once before final build, and let the EAS build log surface any manifest errors.

---

## App Tracking Transparency (ATT)

**Required if:** the app accesses IDFA or correlates user behavior across apps/sites.

**v1 status:**
- IDFA NOT accessed (we don't import `expo-tracking-transparency`)
- PostHog default config does not access IDFA
- No cross-app correlation

**Conclusion:** No `NSUserTrackingUsageDescription` needed in `Info.plist`, no ATT prompt shown.

If PostHog config is changed in the future to enable IDFA, this changes — verify in code before re-enabling.

---

## Encryption export compliance

`app.json` includes `"ITSAppUsesNonExemptEncryption": false`.

This is correct because the app uses standard HTTPS (TLS) for Gemini, Nominatim, PostHog, and Supabase calls — all of which are exempt under the export-compliance rules. We do not implement custom cryptography.

The App Store Connect submission flow will skip the "encryption questionnaire" with this flag set.

---

## Generative AI rating policy (2024+)

Apple now expects generative-AI features to:
1. Be visibly labeled
2. Have age rating ≥ 17+
3. Show appropriate content filtering / safety

**v1 status:**
- AI labeled in Chat and Today screens (`Block F`)
- 17+ rating set (`06-app-store-connect-fields.md`)
- Gemini default safety filters active

**State:** ✅ Pass

---

## Summary table

| # | Guideline | v1.0.6 state | v1.1.0 state |
|---|---|---|---|
| 1.4 | Physical harm risk | ⚠️ | ✅ Disclaimer added |
| 2.3.1 | Accurate metadata | ❌ | ✅ Testimonials & strikethrough removed |
| 2.3.7 | Misleading marketing | ❌ | ✅ Listing rewrite |
| 3.1.1 | IAP rules | ❌ | ✅ No IAP |
| 3.1.2 | Subscriptions | ❌ | ✅ No subscription |
| 4.0 | Design quality | ❌ | ✅ Functional links |
| 4.3(b) | Saturated category | ❌ THE REJECTION | 🔧 Repositioning lands |
| 4.5.4 | Push notifications | ⚠️ | ✅ Informational only |
| 4.8 | Sign in with Apple | ❌ | ✅ No third-party sign-in |
| 5.1.1 | Data collection | ❌ | ✅ Privacy Policy live |
| 5.1.1(v) | Account deletion | ✅ | ✅ Reset App Data |
| 5.1.2 | Data sharing | ⚠️ | ✅ Disclosed |
| 5.5 | Fortune-telling | ⚠️ | ✅ Disclaimers + 17+ |

**Net change from v1.0.6 to v1.1.0:** 9 hard reject vectors closed, 4 watches mitigated. The remaining live question is whether 4.3(b) repositioning lands in the reviewer's read — that depends on listing copy + screenshots more than code.
