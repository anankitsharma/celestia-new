import React, { useEffect, useState, useRef } from 'react';
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
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
} from '@expo-google-fonts/dm-sans';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { UserProfileProvider } from './src/contexts/UserProfileContext';

import { AuthProvider } from './src/contexts/AuthContext';
import { initSchema } from './src/services/database/schema';
import { initNotificationChannels, handleNotificationNavigation } from './src/services/notificationService';
import { initDeepLinks, registerDeepLinkHandler } from './src/services/deepLinkService';
import { lookupInvite } from './src/services/inviteService';
import { recordReferral } from './src/services/referralService';
// V1: RevenueCatProvider import removed — context is now a provider-free no-op stub.
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { KeyboardProvider } from 'react-native-keyboard-controller';
// V1: PostHog analytics stripped for minimal-approval submission. Cleaner
// privacy story for App Review (no third-party tracking SDK, no Diagnostics
// rows on Privacy Nutrition Label, no network requests on launch).

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

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const notifResponseListener = useRef();

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
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
        // V1: Match tab renamed to Circle.
        setTimeout(() => {
          navigationRef.current?.navigate('Connections', { inviteCode: code, inviteData: invite });
        }, 1000);
      }
    });
    registerDeepLinkHandler('referral', async ({ code }) => {
      if (!code) return;
      await recordReferral(code, null); // userId set after profile load
    });
    const cleanupLinks = initDeepLinks();

    // Notification tap handler (background/foreground)
    notifResponseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      handleNotificationNavigation(navigationRef, data);
    });

    // Cold-start: check last notification that opened the app
    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        const data = response.notification.request.content.data;
        setTimeout(() => handleNotificationNavigation(navigationRef, data), 1500);
      }
    });

    return () => {
      if (notifResponseListener.current) {
        notifResponseListener.current.remove();
      }
      if (cleanupLinks) cleanupLinks();
    };
  }, []);

  if (!fontsLoaded || !dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF8F2', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#5C2434" />
      </View>
    );
  }

  return (
    <KeyboardProvider>
      <ThemeProvider>
        <AuthProvider>
          <UserProfileProvider>
            <ThemedNavigationContainer navigationRef={navigationRef}>
              <StatusBar style="dark" />
              <AppNavigator />
            </ThemedNavigationContainer>
          </UserProfileProvider>
        </AuthProvider>
      </ThemeProvider>
    </KeyboardProvider>
  );
}
