import React, { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
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
      <View style={{ flex: 1, backgroundColor: '#0E0E22', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#C8A84B" />
      </View>
    );
  }

  return (
    <AuthProvider>
      <UserProfileProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="light" />
          <AppNavigator />
        </NavigationContainer>
      </UserProfileProvider>
    </AuthProvider>
  );
}
