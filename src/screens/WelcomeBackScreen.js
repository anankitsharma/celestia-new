import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, Easing,
  Platform, StatusBar, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useAnalytics } from '../services/analytics';
import { haptic } from '../services/hapticService';
import { JournalRepository } from '../services/database/rep_journal';
import { ProfileRepository } from '../services/database/rep_profiles';
import { StreakRepository } from '../services/database/rep_streaks';
import Stars from '../components/Stars';
import Button from '../components/Button';

// Reactivation surface — visible when user opens the app via a win-back
// deep-link (?source=winback&campaign=d30/d60/d90). Restores context:
// "your chart, journals, and Circle are all still here."
//
// Wired but currently unreachable until email integration ships (Sprint 4).
// Deep-link handler in deepLinkService routes ?source=winback to this screen.

export default function WelcomeBackScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { userProfile } = useUserProfile();
  const { capture } = useAnalytics();

  const campaign = route?.params?.campaign || 'unknown';
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  const [stats, setStats] = useState({
    streak: 0,
    longestStreak: 0,
    journalCount: 0,
    partnerCount: 0,
  });

  useEffect(() => {
    capture('winback_returned', { campaign });
    try { haptic.success(); } catch {}
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    (async () => {
      try {
        const profileId = userProfile?.id || 'default';
        const [streak, journalCount, partners] = await Promise.all([
          StreakRepository.getStreak(profileId).catch(() => null),
          JournalRepository.getEntryCount(profileId).catch(() => 0),
          ProfileRepository.getAllProfiles().catch(() => []),
        ]);
        setStats({
          streak: streak?.current_streak || 0,
          longestStreak: streak?.longest_streak || 0,
          journalCount,
          partnerCount: (partners || []).filter(p => p.id !== profileId && p.type !== 'self').length,
        });
      } catch {}
    })();
  }, []);

  const continueToToday = () => {
    haptic.light();
    navigation.replace('Main', { screen: 'Today' });
  };

  return (
    <LinearGradient colors={['#5A2840', '#3A1A28', '#1F0F18']} locations={[0, 0.5, 1]} style={styles.container}>
      <Stars count={28} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }], alignItems: 'center', width: '100%' }}>
          <Text style={styles.kicker}>WELCOME BACK</Text>
          <Text style={styles.headline}>
            {userProfile?.name ? `${userProfile.name}, your` : 'Your'} chart, journals,
            {'\n'}and Circle are still here.
          </Text>
          <Text style={styles.sub}>Right where you left them.</Text>

          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statNum}>{stats.longestStreak}</Text>
                <Text style={styles.statLabel}>longest streak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statNum}>{stats.journalCount}</Text>
                <Text style={styles.statLabel}>journal{stats.journalCount === 1 ? '' : 's'}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statNum}>{stats.partnerCount}</Text>
                <Text style={styles.statLabel}>in your Circle</Text>
              </View>
            </View>
          </View>

          <Text style={styles.message}>
            We don't expect you to start a streak today. Just know — the chart hasn't moved much,
            and there's a read waiting whenever you want it.
          </Text>

          <View style={{ width: '100%', marginTop: 28 }}>
            <Button label="Take me to Today" variant="primary" size="md" onPress={continueToToday} />
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: Platform.OS === 'ios' ? 90 : (StatusBar.currentHeight || 24) + 50, paddingHorizontal: 24, paddingBottom: 60, alignItems: 'center' },
  kicker: { fontSize: 11, letterSpacing: 2, fontFamily: FONTS.sansSemiBold, color: T.gold, marginBottom: 14, textTransform: 'uppercase' },
  headline: { fontFamily: FONTS.serif, fontSize: 26, color: T.cream, textAlign: 'center', lineHeight: 34, marginBottom: 8 },
  sub: { fontSize: 14, fontFamily: FONTS.serif, fontStyle: 'italic', color: 'rgba(250,248,242,0.55)', textAlign: 'center', marginBottom: 32 },
  statsCard: { width: '100%', backgroundColor: 'rgba(200,168,75,0.07)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.22)', borderRadius: 18, paddingVertical: 22, paddingHorizontal: 14, marginBottom: 28 },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  statCell: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(200,168,75,0.25)' },
  statNum: { fontSize: 28, fontFamily: FONTS.serifSemiBold, color: T.gold, marginBottom: 4 },
  statLabel: { fontSize: 11, fontFamily: FONTS.sans, color: 'rgba(250,248,242,0.55)', textAlign: 'center', paddingHorizontal: 4 },
  message: { fontSize: 14, fontFamily: FONTS.serif, color: 'rgba(250,248,242,0.72)', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8 },
});
