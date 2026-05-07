import React, { useEffect, useState, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigationContainerRef, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
} from '@expo-google-fonts/playfair-display';
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
  Newsreader_600SemiBold,
} from '@expo-google-fonts/newsreader';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { View, ActivityIndicator, AppState } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProfileProvider } from './src/contexts/UserProfileContext';

import { AuthProvider } from './src/contexts/AuthContext';
import { initSchema } from './src/services/database/schema';
import { initNotificationChannels, handleNotificationNavigation } from './src/services/notificationService';
import { initDeepLinks, registerDeepLinkHandler } from './src/services/deepLinkService';
import { lookupInvite } from './src/services/inviteService';
import { recordReferral } from './src/services/referralService';
import { RevenueCatProvider } from './src/contexts/RevenueCatContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { captureEvent, EVENTS } from './src/services/analytics';
import { markActive, clearPendingPushOfType } from './src/services/engagementSignals';
import { cancelNotificationById } from './src/services/notificationService';

function AppOpenTracker() {
  const posthog = usePostHog();
  useEffect(() => {
    (async () => {
      let launch_source = 'cold';
      try {
        const response = await Notifications.getLastNotificationResponseAsync();
        if (response) launch_source = 'push';
      } catch {}
      posthog?.capture('app_opened', { launch_source });
    })();
  }, []);
  return null;
}

// Navigation themes — controls safe area bg color (the area below tab bar)
const CelestiaLightNav = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#FAF8F2', card: '#FAF8F2', border: '#EAE3D6' },
};
const CelestiaDarkNav = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: '#0F0E1A', card: '#0F0E1A', border: 'rgba(200,168,75,0.08)' },
};

function ThemedNavigationContainer({ navigationRef, children }) {
  const { isDark } = useTheme();
  return (
    <NavigationContainer ref={navigationRef} theme={isDark ? CelestiaDarkNav : CelestiaLightNav}>
      {children}
    </NavigationContainer>
  );
}

// Drives the system status bar from theme. Currently both modes resolve to
// 'light', so this is a no-op until phase 3 flips LIGHT.statusBarStyle to 'dark'.
function ThemedStatusBar() {
  const { colors } = useTheme();
  return <StatusBar style={colors.statusBarStyle || 'light'} />;
}

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const notifResponseListener = useRef();
  const notifReceivedListener = useRef();
  const sessionStartRef = useRef(Date.now());

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    Newsreader_400Regular,
    Newsreader_400Regular_Italic,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initSchema()
      .then(() => setDbReady(true))
      .catch(e => {
        console.error('DB init failed:', e);
        setDbReady(true); // Still render even if DB fails
      });

    // Android notification channels
    initNotificationChannels();

    // Deep link handlers
    registerDeepLinkHandler('invite', async ({ code }) => {
      if (!code) return;
      const invite = await lookupInvite(code);
      if (invite) {
        // Navigate to compatibility with invite data
        setTimeout(() => {
          navigationRef.current?.navigate('Match', { inviteCode: code, inviteData: invite });
        }, 1000);
      }
    });
    registerDeepLinkHandler('referral', async ({ code }) => {
      if (!code) return;
      await recordReferral(code, null); // userId set after profile load
    });
    // Win-back surface — opened from email/push deep-link
    // (celestia://winback or celestia://winback/d30 / d60 / d90).
    registerDeepLinkHandler('winback', ({ code }) => {
      setTimeout(() => {
        navigationRef.current?.navigate('WelcomeBack', { campaign: code || 'unknown' });
      }, 800);
    });
    const cleanupLinks = initDeepLinks();

    // Notification tap handler (background/foreground)
    notifResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      captureEvent(EVENTS.PUSH_OPENED, {
        template_id: data?.template_id || null,
        category: data?.category || null,
        channel: data?.channel || null,
        cold_start: false,
      });
      handleNotificationNavigation(navigationRef, data);
    });

    // Notification delivered (received in foreground OR shown in tray)
    notifReceivedListener.current = Notifications.addNotificationReceivedListener(notif => {
      const data = notif?.request?.content?.data;
      captureEvent(EVENTS.PUSH_DELIVERED, {
        template_id: data?.template_id || null,
        category: data?.category || null,
        channel: data?.channel || null,
      });
    });

    // App lifecycle — fire APP_BACKGROUNDED with session_duration on each
    // foreground→background transition. Reset session timer on resume.
    // Also: cancel any pending chat-followup pushes since the user has returned.
    const appStateSub = AppState.addEventListener('change', async (next) => {
      if (next === 'background' || next === 'inactive') {
        const durationMs = Date.now() - sessionStartRef.current;
        captureEvent(EVENTS.APP_BACKGROUNDED, { session_duration_ms: durationMs });
      } else if (next === 'active') {
        sessionStartRef.current = Date.now();
        // Foreground transition without a fresh push trigger = organic open.
        // Lets us measure internal-trigger graduation (push vs. organic) over time.
        captureEvent(EVENTS.APP_OPENED, { launch_source: 'organic' });
        try { await markActive(); } catch {}
        try {
          const ids = await clearPendingPushOfType('event_chat_followup');
          for (const id of ids) await cancelNotificationById(id);
        } catch {}
      }
    });

    // Initial mark-active + cancel chat-followups on cold start
    (async () => {
      try { await markActive(); } catch {}
      try {
        const ids = await clearPendingPushOfType('event_chat_followup');
        for (const id of ids) await cancelNotificationById(id);
      } catch {}
    })();

    // Cold-start: check last notification that opened the app
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        const data = response.notification.request.content.data;
        captureEvent(EVENTS.PUSH_OPENED, {
          template_id: data?.template_id || null,
          category: data?.category || null,
          channel: data?.channel || null,
          cold_start: true,
        });
        setTimeout(() => handleNotificationNavigation(navigationRef, data), 1500);
      }
    });

    return () => {
      if (notifResponseListener.current) {
        notifResponseListener.current.remove();
      }
      if (notifReceivedListener.current) {
        notifReceivedListener.current.remove();
      }
      if (appStateSub) appStateSub.remove();
      if (cleanupLinks) cleanupLinks();
    };
  }, []);

  if (!fontsLoaded || !dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0E0E22', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#C8A84B" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <PostHogProvider
      apiKey="phc_bPp0sgaFIhPbZaqU6613cEiy0sJbJd5C20Vk8TgN3Zd"
      options={{ host: 'https://us.i.posthog.com' }}
      autocapture={{ captureScreens: false }}
    >
      <AppOpenTracker />
      <KeyboardProvider>
        <ThemeProvider>
          <AuthProvider>
            <UserProfileProvider>
              <RevenueCatProvider>
                <ThemedNavigationContainer navigationRef={navigationRef}>
                  <ThemedStatusBar />
                  <AppNavigator />
                </ThemedNavigationContainer>
              </RevenueCatProvider>
            </UserProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </KeyboardProvider>
    </PostHogProvider>
    </GestureHandlerRootView>
  );
}
