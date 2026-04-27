# 01 — Code Changes (file-by-file)

**Branch:** `ios-v1-resubmission`
**Working dir:** `/Users/apple/Documents/Expo apps/Celestia-new/iOS-version/`
**Approach:** stub the providers, hide the UI paths, leave the dependencies installed. v1.1 reactivates by re-wiring.

Each section: **goal → files → current state → exact change → verify**.

---

## Block A — Stub the providers (so screens calling `useRevenueCat` / `useAuth` don't crash)

### A.1 `src/contexts/RevenueCatContext.js` — make it a no-op stub

**Why:** current file already has the try/require shim for Expo Go. Now make the provider unconditionally return `isPro: true` and offerings `null`, so every premium gate across the app silently unlocks.

Replace the entire `RevenueCatProvider` body with:

```jsx
export const RevenueCatProvider = ({ children }) => {
  // V1 stub — payments removed for first App Store submission.
  // Returns "pro" to unlock all features without an IAP path.
  // Re-enable real RevenueCat in v1.1.
  const value = {
    customerInfo: null,
    offerings: null,
    isPro: true,
    isLoading: false,
    debugOverridePro: null,
    setDebugOverridePro: () => {},
    purchasePackage: async () => null,
    restorePurchases: async () => null,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
};
```

Keep `useRevenueCat` export as-is. Keep the file. Don't delete imports of `Purchases` (the try/require wrapper is harmless when the provider isn't using it).

**Verify:** `node -c src/contexts/RevenueCatContext.js`

### A.2 `src/contexts/AuthContext.js` — stub to anonymous

Replace the provider body with:

```jsx
export const AuthProvider = ({ children }) => {
  // V1 stub — auth removed for first App Store submission.
  // No sign-in, no Sign in with Apple requirement (4.8), no third-party identity.
  // Re-enable real auth in v1.1 alongside Sign in with Apple.
  const value = {
    user: null,
    session: null,
    isLoading: false,
    onSignIn: async () => null,
    signOut: async () => {},
    deleteAccount: async () => {
      // Reset app data — wipes local SQLite + AsyncStorage.
      const { resetAllAppData } = await import('../services/storage');
      await resetAllAppData();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

Keep the named exports. The `deleteAccount` becomes a local-data wipe (5.1.1(v) compliant for non-authed apps).

### A.3 Add `resetAllAppData` to `src/services/storage.js`

Append at the end of the file:

```js
import * as SQLite from 'expo-sqlite';

export async function resetAllAppData() {
  // Clear AsyncStorage
  try { await AsyncStorage.clear(); } catch (e) { console.warn(e); }
  // Drop and recreate SQLite tables
  try {
    const db = await SQLite.openDatabaseAsync('celestia_v1.db');
    const { initSchema } = await import('./database/schema');
    // Drop known tables
    const tables = ['profiles', 'chats', 'reports', 'forecasts', 'journal', 'partners', 'badges', 'quests'];
    for (const t of tables) {
      try { await db.execAsync(`DROP TABLE IF EXISTS ${t};`); } catch (e) {}
    }
    await initSchema();
  } catch (e) { console.warn('reset failed', e); }
}
```

Verify the table list matches what's in `src/services/database/schema.js`.

---

## Block B — Remove the navigation paths

### B.1 `src/navigation/AppNavigator.js` — drop AuthScreen + PaywallScreen, reorder tabs

Replace the file with:

```jsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SplashScreen from '../screens/SplashScreen';
import OnboardingFlowScreen from '../screens/OnboardingFlowScreen';
import HomeScreen from '../screens/HomeScreen';
import ChartScreen from '../screens/ChartScreen';
import TransitsScreen from '../screens/TransitsScreen';
import CompatibilityScreen from '../screens/CompatibilityScreen';
import ChatScreen from '../screens/ChatScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import JourneyScreen from '../screens/JourneyScreen';
import JournalHistoryScreen from '../screens/JournalHistoryScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import QuickChartScreen from '../screens/QuickChartScreen';
import JournalScreen from '../screens/JournalScreen';
import TabBar from '../components/TabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Circle"
    >
      <Tab.Screen name="Circle" component={CompatibilityScreen} />
      <Tab.Screen name="Today" component={HomeScreen} />
      <Tab.Screen name="Chart" component={ChartScreen} />
      <Tab.Screen name="Ask" component={ChatScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="OnboardingFlow" component={OnboardingFlowScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Journey" component={JourneyScreen} />
      <Stack.Screen name="JournalHistory" component={JournalHistoryScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="QuickChart" component={QuickChartScreen} />
      <Stack.Screen name="TodaysSky" component={TransitsScreen} />
      <Stack.Screen name="Journal" component={JournalScreen} />
    </Stack.Navigator>
  );
}
```

**Removed:** `AuthScreen` import + screen, `PaywallScreen` import + screen.
**Changed:** `initialRouteName="Circle"`, tab order, "AskAI" renamed to "Ask".

### B.2 `src/components/TabBar.js` — update labels for new order

Open the file and find the `TABS` array (or equivalent label map). Update:

| Old name → New name | Old label → New label | Order index |
|---|---|---|
| Today | Today | 2 |
| AskAI → **Ask** | Ask AI → Ask | 4 |
| Chart | Chart | 3 |
| Circle | Circle | **1** (first) |
| Reports | Reports | 5 |

Make sure Circle's icon is the most prominent visual (the relationship metaphor).

---

## Block C — Strip the splash sign-in link

### C.1 `src/screens/SplashScreen.js`

Find lines ~91–95:
```jsx
<TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Auth')}>
  <Text style={styles.loginText}>
    Already exploring? <Text style={styles.loginLink}>Sign in</Text>
  </Text>
</TouchableOpacity>
```

Delete entirely. Also delete the related styles `loginText` and `loginLink` from the StyleSheet at the bottom.

### C.2 Update tagline + CTA copy on splash

Line ~82 — tagline:
```jsx
// Before
<Animated.Text style={[styles.tagline, ...]}>NAVIGATE YOUR COSMOS</Animated.Text>

// After
<Animated.Text style={[styles.tagline, ...]}>UNDERSTAND THE PEOPLE YOU LOVE</Animated.Text>
```

Line ~88 — CTA:
```jsx
// Before
<Text style={styles.ctaText}>Begin Your Journey ✦</Text>

// After
<Text style={styles.ctaText}>Map My People</Text>
```

---

## Block D — Strip the onboarding paywall (steps 12–14)

### D.1 `src/screens/OnboardingFlowScreen.js`

#### Step count

Line 19:
```js
// Before
const TOTAL_STEPS = 14;

// After
const TOTAL_STEPS = 11;
```

#### Step router (~line 745)

Drop cases 12–14:

```jsx
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
    case 11: return renderDailyHook();
    default: return null;
  }
};
```

#### Step 11 — daily hook → finishOnboarding

Find `renderDailyHook` (~line 588). The current `Continue` button calls `advance()`. Replace with `finishOnboarding`:

```jsx
<GoldButton text="Map My People" onPress={finishOnboarding} />
```

#### `finishOnboarding` body (~line 226)

Remove the auth branch. Final state:

```js
const finishOnboarding = async () => {
  try {
    const dateStr = `${birthDate.getFullYear()}-${(birthDate.getMonth() + 1).toString().padStart(2, '0')}-${birthDate.getDate().toString().padStart(2, '0')}`;
    const timeStr = (isTimeUnknown || !birthTime) ? '12:00' : `${birthTime.getHours().toString().padStart(2, '0')}:${birthTime.getMinutes().toString().padStart(2, '0')}`;
    const profile = {
      id: Crypto.randomUUID(),
      name: firstName.trim(),
      gender: 'unknown',
      birthDate: dateStr,
      birthTime: timeStr,
      birthLocation: { name: selectedCity.name, lat: selectedCity.lat, lng: selectedCity.lng },
      isTimeUnknown,
      chart,
      type: 'self',
      motivation,
      painPoint,
      depth,
    };
    await setUserProfile(profile);
    try {
      const { saveObject } = require('../services/storage');
      await saveObject('celestia_persona_prefs', { motivation, painPoint, depth });
    } catch (e) {}
    capture(EVENTS.ONBOARDING_COMPLETED, { sun_sign: chart?.sun?.sign, motivation, pain_point: painPoint });
    navigation.replace('Main');
  } catch (e) {
    console.error('Save error:', e);
  }
};
```

**Removed:** `useAuth` usage, `identify(...)`, conditional `navigation.replace('Auth' | 'Main')`.

#### Delete the three render functions

Delete entirely (in the file body):
- `renderSoftPaywall` (~line 614)
- `renderReassurance` (~line 647)
- `renderHardClose` (~line 679)

#### Delete the `selectedPlan` state

Remove `const [selectedPlan, setSelectedPlan] = useState('annual');` (~line 147).

#### Delete the `useAuth` import

Top of file: remove `import { useAuth } from '../contexts/AuthContext';` and the destructured `const { user } = useAuth();` (~line 117).

#### Step 1 hook copy update (Section 6.3 of master plan)

`renderHook()` (~line 274):
```jsx
// Before
<Text style={[s.hookH1, { color: colors.heading }]}>The stars remember{'\n'}when you were born</Text>
<Text style={[s.hookSub, { color: colors.textSecondary }]}>Your birth chart is a fingerprint.{'\n'}No two are alike. Let's read yours.</Text>

// After
<Text style={[s.hookH1, { color: colors.heading }]}>Every relationship{'\n'}has a pattern.</Text>
<Text style={[s.hookSub, { color: colors.textSecondary }]}>Add the people who matter.{'\n'}See how each connection actually works.</Text>
```

CTA on step 1:
```jsx
// Before
<GoldButton text="Show Me ✦" onPress={() => advance()} />

// After
<GoldButton text="Begin" onPress={() => advance()} />
```

Drop the disclaimer line `2 minutes · completely free` if it conflicts with new tone (optional).

#### Step 11 ("Daily Hook") copy update

The current step 11 sells "AI-powered readings from your real transits. Not sun-sign garbage." Reframe as a relationship hook:

```jsx
// In renderDailyHook
<Text style={s.dailyCardLabel}>NEXT</Text>
<Text style={[s.dailyCardTitle, { color: colors.heading }]}>Add the people who matter</Text>
<Text style={[s.dailyCardDesc, { color: colors.textSecondary }]}>
  Partner, friend, parent, sibling, colleague — each connection has its own pattern. Celestia helps you see it.
</Text>
```

---

## Block E — Strip RevenueCat references from screens

The provider stub from Block A.1 already silently unlocks "premium" features. These screen-level edits remove the **visible** premium UI.

### E.1 `src/screens/ChatScreen.js`

Find the free-quota gate (search for `FREE_LIMIT`, `messageCount`, or `isPro`). Delete the early-return / paywall navigation. Chat is unlimited in v1.

Specifically: any code that does `if (!isPro && messageCount >= 10) navigation.navigate('Paywall')` — remove the entire branch. Keep the message send.

Also remove any "Upgrade to continue" UI block in the render output.

### E.2 `src/screens/CompatibilityScreen.js`

Search for `isPro`, `Paywall`. Remove gates that block adding partners after the first.

### E.3 `src/screens/ReportsScreen.js`

Search for purchase calls (`purchasePackage`, `Paywall navigation`). Make all reports free:
- Remove "Buy" / "Unlock" buttons
- Remove price labels
- Remove the purchase modal
- All reports become directly viewable

### E.4 `src/screens/HomeScreen.js`

Search for `isPro` and `LockedFeatureOverlay`. Remove premium overlays from any cards.

### E.5 `src/screens/ProfileScreen.js`

Find rows referencing "Manage Subscription," "Upgrade," "Pro Status" — remove those rows entirely. Specifically:
- Remove `customerInfo` consumption
- Remove debug Pro toggle (it's only `__DEV__`-gated, but cleaner to remove)
- Rename "Delete Account" → **"Reset App Data"** (the row label and the alert title)

Search for the alert (~line 413):
```js
'Delete Account',
'This will permanently delete...',
```
Replace with:
```js
'Reset App Data',
'This will erase your profile, partners, journal, and all local data. Your device will return to a fresh state. This action cannot be undone.',
```

---

## Block F — Add the AI disclaimer

### F.1 `src/screens/ChatScreen.js`

Just above the input bar (or at the top of the messages list), add:

```jsx
<Text style={{
  fontSize: 11,
  color: colors.textSecondary,
  textAlign: 'center',
  paddingVertical: 6,
  opacity: 0.6,
}}>
  AI-generated · for reflection, not advice
</Text>
```

### F.2 `src/screens/HomeScreen.js`

In the daily insight card (`navigatorBriefing`), add a small footer:

```jsx
<Text style={{
  fontSize: 10,
  color: colors.textSecondary,
  marginTop: 8,
  opacity: 0.5,
}}>
  AI-generated for reflection · not predictive
</Text>
```

---

## Block G — Partner consent modal (CompatibilityScreen)

### G.1 `src/screens/CompatibilityScreen.js`

Add a modal that appears the first time a user adds a non-self profile.

Top of file:
```js
import { saveBoolean, loadBoolean, StorageKeys } from '../services/storage';
```

State + check:
```js
const [showPartnerConsent, setShowPartnerConsent] = useState(false);
const [pendingPartnerSave, setPendingPartnerSave] = useState(null);

const checkConsentAndSave = async (partnerData) => {
  const consented = await loadBoolean('celestia_partner_consent_v1');
  if (consented) {
    return doSavePartner(partnerData);
  }
  setPendingPartnerSave(partnerData);
  setShowPartnerConsent(true);
};
```

Replace existing direct save calls with `checkConsentAndSave(partnerData)`.

Add modal in render:
```jsx
{showPartnerConsent && (
  <Modal transparent animationType="fade" visible>
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 22, maxWidth: 360 }}>
        <Text style={{ fontFamily: FONTS.serif, fontSize: 22, color: colors.heading, marginBottom: 12 }}>
          Adding someone else
        </Text>
        <Text style={{ fontSize: 14, color: colors.text, lineHeight: 20, marginBottom: 18 }}>
          By adding this person you confirm they have shared their birth details with you for this purpose. Their information stays on your device.
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
            onPress={() => { setShowPartnerConsent(false); setPendingPartnerSave(null); }}
          >
            <Text style={{ color: colors.text }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: T.gold, alignItems: 'center' }}
            onPress={async () => {
              await saveBoolean('celestia_partner_consent_v1', true);
              setShowPartnerConsent(false);
              if (pendingPartnerSave) {
                await doSavePartner(pendingPartnerSave);
                setPendingPartnerSave(null);
              }
            }}
          >
            <Text style={{ color: T.navy, fontWeight: '600' }}>I confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
)}
```

---

## Block H — Privacy / Terms links in Profile

### H.1 `src/screens/ProfileScreen.js`

Add at top:
```js
import { Linking } from 'react-native';
```

Replace `PRIVACY_URL` and `TERMS_URL` placeholders with the actual hosted URLs once they exist (see `04-privacy-policy.md` and `05-terms-of-service.md`).

Add a "Legal" section near the bottom of Profile, above "Reset App Data":

```jsx
<View style={styles.section}>
  <Text style={styles.sectionLabel}>LEGAL</Text>
  <TouchableOpacity style={styles.prow} onPress={() => Linking.openURL(PRIVACY_URL)}>
    <Text style={styles.prowLabel}>Privacy Policy</Text>
    <Text style={styles.prowArrow}>›</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.prow} onPress={() => Linking.openURL(TERMS_URL)}>
    <Text style={styles.prowLabel}>Terms of Service</Text>
    <Text style={styles.prowArrow}>›</Text>
  </TouchableOpacity>
  <TouchableOpacity style={styles.prow} onPress={() => Linking.openURL('mailto:support@celestia.app')}>
    <Text style={styles.prowLabel}>Support</Text>
    <Text style={styles.prowArrow}>›</Text>
  </TouchableOpacity>
</View>
```

---

## Block I — App.js cleanup

### I.1 Remove unused providers

Current App.js wraps the navigator in `RevenueCatProvider` and `AuthProvider`. Both are now stubs (Block A) but **keep them in the tree** — many screens call `useRevenueCat()` and `useAuth()` and would otherwise throw.

So no change to App.js's provider wrapping. It already works.

### I.2 (Optional) Remove PostHog

If PostHog is being removed for v1 (recommended for cleaner privacy nutrition label), strip:

```js
// Remove these
import { PostHogProvider, usePostHog } from 'posthog-react-native';
function AppOpenTracker() { ... }
<PostHogProvider apiKey="..." options={...}>
  <AppOpenTracker />
  ...
</PostHogProvider>
```

Reduce to:
```jsx
return (
  <KeyboardProvider>
    <ThemeProvider>
      <AuthProvider>
        <UserProfileProvider>
          <RevenueCatProvider>
            <ThemedNavigationContainer navigationRef={navigationRef}>
              <StatusBar style="light" />
              <AppNavigator />
            </ThemedNavigationContainer>
          </RevenueCatProvider>
        </UserProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  </KeyboardProvider>
);
```

Also remove `posthog-react-native` from `package.json` (then `npm install` to update lockfile).

### I.3 Deep-link handlers

In App.js, the deep-link handler currently navigates to `'Match'`. The tab is now `'Circle'`. Update:

```js
registerDeepLinkHandler('invite', async ({ code }) => {
  if (!code) return;
  const invite = await lookupInvite(code);
  if (invite) {
    setTimeout(() => {
      navigationRef.current?.navigate('Circle', { inviteCode: code, inviteData: invite });
    }, 1000);
  }
});
```

---

## Block J — `app.json` updates

### J.1 Update name + iPad off

```json
{
  "expo": {
    "name": "Celestia",
    "slug": "celestia",
    "version": "1.1.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": { ... },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.celestia.app",
      "buildNumber": "1",
      "infoPlist": {
        "CFBundleDisplayName": "Celestia",
        "ITSAppUsesNonExemptEncryption": false
      }
    },
    ...
  }
}
```

**Changes:**
- `version` bumped to `1.1.0` (must be > previous rejected `1.0.6`)
- `ios.supportsTablet: false`
- `ios.buildNumber: "1"` — fresh build counter for the new version
- `ITSAppUsesNonExemptEncryption: false` — saves an export-compliance question at submission

App Store *display name* (what shows under the icon) stays "Celestia." App Store *product name* (Section 02 of plan) is the relationship-led name.

### J.2 Remove unused config plugins (optional)

If we're stripping Google Sign-in entirely from the bundle (post v1 we re-add), remove the plugin:
```json
// Remove
["@react-native-google-signin/google-signin", { "iosUrlScheme": "..." }]
```

This requires running `npx expo prebuild --clean` before EAS build.

---

## Block K — Language sweep

Search-and-replace across these files. Be careful not to break astrology terminology that's needed inside the app (the engine still uses planets, signs, houses) — only replace category-trigger words in **user-visible copy**.

| Old term | New term | Files to scan |
|---|---|---|
| "horoscope" | "briefing" or "reading" | HomeScreen, ChatScreen, ReportsScreen, OnboardingFlowScreen, ProfileScreen |
| "fortune" | (delete) | All screens |
| "destiny" | "patterns" | HomeScreen, ChatScreen, ReportsScreen |
| "predict" / "prediction" | "look ahead" / "outlook" | HomeScreen, ChatScreen |
| "manifest" | "shape" or "build" | HomeScreen, PaywallScreen (deleted anyway) |

Specific lines:

| File | Old | New |
|---|---|---|
| OnboardingFlowScreen.js | `"Not sun-sign garbage"` | `"Real, personal — based on your actual chart"` |
| ChatScreen.js Q_INITIAL | `"Will this situationship actually go anywhere?"` | `"Why do I keep ending up in situationships?"` |
| ChatScreen.js Q_INITIAL | `"What signs should I avoid dating?"` | `"What relationship patterns trip me up?"` |
| ChatScreen.js Q_INITIAL | `"Is Mercury retrograde messing with me right now?"` | `"Why does communication feel off lately?"` |
| ReportsScreen | `"Lunar Cycle Report"` | `"Cycles & Energy Report"` |
| ReportsScreen | `"Year Ahead"` | `"Year of Patterns"` |

---

## Block L — Verify no broken imports

After all edits, run:

```bash
cd "/Users/apple/Documents/Expo apps/Celestia-new/iOS-version"

# Syntax-check every screen
for f in src/screens/*.js src/contexts/*.js src/navigation/*.js App.js; do
  node -c "$f" || echo "SYNTAX ERROR: $f"
done

# Look for orphaned imports
grep -rn "from '../screens/AuthScreen'" src/ App.js
grep -rn "from '../screens/PaywallScreen'" src/ App.js
grep -rn "navigation.navigate('Auth')" src/
grep -rn "navigation.navigate('Paywall')" src/

# These should ALL be empty after the strip-down
```

Then start the dev server and walk the app:
```bash
npx expo start --go --port 8082 --clear
```

Open in Expo Go → walk through every tab, every nav action, every modal. If any premium gate / sign-in button / paywall appears, the strip wasn't clean.

---

## Block M — Build + smoke test

```bash
# In iOS-version/
npx expo prebuild --clean   # (only if config changed; else skip)
eas build --profile production --platform ios
```

Once the build completes:
- Download to TestFlight
- Run the pre-submission checklist in `08-pre-submission-checklist.md`
- Submit when checklist is 100%

---

## Summary of files touched

| File | Block(s) | Change type |
|---|---|---|
| `App.js` | I | Optional PostHog removal, deep-link target |
| `app.json` | J | name, iPad off, version bump |
| `src/contexts/RevenueCatContext.js` | A.1 | Stub provider |
| `src/contexts/AuthContext.js` | A.2 | Stub provider |
| `src/services/storage.js` | A.3 | Add resetAllAppData |
| `src/navigation/AppNavigator.js` | B.1 | Drop AuthScreen + PaywallScreen, reorder tabs |
| `src/components/TabBar.js` | B.2 | Update labels |
| `src/screens/SplashScreen.js` | C.1, C.2 | Drop sign-in link, update copy |
| `src/screens/OnboardingFlowScreen.js` | D.1, K | Strip 3 steps, copy updates |
| `src/screens/ChatScreen.js` | E.1, F.1, K | Strip quota, AI disclaimer, copy sweep |
| `src/screens/CompatibilityScreen.js` | E.2, G.1 | Strip gates, partner consent modal |
| `src/screens/ReportsScreen.js` | E.3, K | All reports free, rename reports |
| `src/screens/HomeScreen.js` | E.4, F.2, K | Strip overlays, AI disclaimer, copy sweep |
| `src/screens/ProfileScreen.js` | E.5, H.1 | Strip subscription rows, Reset App Data, Legal section |

**Files to delete:** none (we keep stubs for v1.1).

**Files left untouched:** all components, services other than storage.js, all constants.
