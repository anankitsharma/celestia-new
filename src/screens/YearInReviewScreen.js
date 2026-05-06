import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, Easing,
  Platform, StatusBar, TouchableOpacity, Linking,
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
import { loadString, StorageKeys } from '../services/storage';
import Stars from '../components/Stars';
import Button from '../components/Button';

// Annual-renewal year-in-review surface.
// Triggered when annual subscriber is within 30 days of auto-renewal.
// Spotify-Wrapped pattern: celebrate what they built; CTA to continue.
//
// Reciprocity-anchored: the user is reminded what the app gave them
// over a year. Renewal becomes a continuation, not a charge.

export default function YearInReviewScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { userProfile, partnerProfiles } = useUserProfile();
  const { capture } = useAnalytics();

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(20)).current;

  const [stats, setStats] = useState({
    longestStreak: 0,
    totalCheckIns: 0,
    journalCount: 0,
    partnerCount: 0,
    firstReveal: null,
  });

  useEffect(() => {
    capture('year_in_review_shown', {});
    try { haptic.success(); } catch {}
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    (async () => {
      try {
        const profileId = userProfile?.id || 'default';
        const [streak, journalCount, partners, firstReveal] = await Promise.all([
          StreakRepository.getStreak(profileId).catch(() => null),
          JournalRepository.getEntryCount(profileId).catch(() => 0),
          ProfileRepository.getAllProfiles().catch(() => []),
          loadString(StorageKeys.FIRST_REVEAL_STATEMENT).catch(() => null),
        ]);
        setStats({
          longestStreak: streak?.longest_streak || 0,
          totalCheckIns: streak?.total_check_ins || 0,
          journalCount,
          partnerCount: (partners || []).filter(p => p.id !== profileId && p.type !== 'self').length,
          firstReveal,
        });
      } catch {}
    })();
  }, []);

  const continueAnotherYear = () => {
    haptic.light();
    capture('year_in_review_continue', {});
    navigation.replace('Main', { screen: 'Today' });
  };

  const manageSubscription = () => {
    haptic.light();
    capture('year_in_review_manage', {});
    // iOS App Store subscription management
    Linking.openURL('https://apps.apple.com/account/subscriptions').catch(() => {});
  };

  return (
    <LinearGradient colors={['#5A2840', '#3A1A28', '#1F0F18']} locations={[0, 0.5, 1]} style={styles.container}>
      <Stars count={42} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }], alignItems: 'center', width: '100%' }}>
          <Text style={styles.kicker}>YOUR YEAR WITH CELESTIA</Text>
          <Text style={styles.headline}>
            What {userProfile?.name || 'you'} built.
          </Text>
          <Text style={styles.sub}>365 days of inner work.</Text>

          <View style={styles.statBlock}>
            <Text style={styles.statBigNum}>{stats.totalCheckIns}</Text>
            <Text style={styles.statBigLabel}>days you checked in</Text>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridNum}>{stats.longestStreak}</Text>
              <Text style={styles.gridLabel}>longest streak</Text>
            </View>
            <View style={styles.gridDivider} />
            <View style={styles.gridCell}>
              <Text style={styles.gridNum}>{stats.journalCount}</Text>
              <Text style={styles.gridLabel}>journal entries</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.gridNum}>{stats.partnerCount}</Text>
              <Text style={styles.gridLabel}>in your Circle</Text>
            </View>
            <View style={styles.gridDivider} />
            <View style={styles.gridCell}>
              <Text style={styles.gridNum}>52+</Text>
              <Text style={styles.gridLabel}>weekly reads</Text>
            </View>
          </View>

          {stats.firstReveal && (
            <View style={styles.revealCard}>
              <Text style={styles.revealKicker}>WHAT WE TOLD YOU AT THE START</Text>
              <Text style={styles.revealText}>"{stats.firstReveal}"</Text>
              <Text style={styles.revealFooter}>Was it true?</Text>
            </View>
          )}

          <View style={{ width: '100%', marginTop: 32 }}>
            <Button label="Continue another year" variant="primary" size="md" onPress={continueAnotherYear} />
          </View>

          <TouchableOpacity onPress={manageSubscription} style={{ marginTop: 18, padding: 12 }}>
            <Text style={styles.manageLink}>Manage subscription</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: Platform.OS === 'ios' ? 80 : (StatusBar.currentHeight || 24) + 40, paddingHorizontal: 22, paddingBottom: 60, alignItems: 'center' },
  kicker: { fontSize: 11, letterSpacing: 2, fontFamily: FONTS.sansSemiBold, color: T.gold, marginBottom: 12, textTransform: 'uppercase' },
  headline: { fontFamily: FONTS.serif, fontSize: 32, color: T.cream, textAlign: 'center', lineHeight: 38, marginBottom: 6 },
  sub: { fontSize: 14, fontFamily: FONTS.serif, fontStyle: 'italic', color: 'rgba(250,248,242,0.55)', textAlign: 'center', marginBottom: 32 },
  statBlock: { alignItems: 'center', marginBottom: 24 },
  statBigNum: { fontSize: 84, fontFamily: FONTS.serifSemiBold, color: T.gold, lineHeight: 84 },
  statBigLabel: { fontSize: 13, fontFamily: FONTS.sans, color: 'rgba(250,248,242,0.65)', marginTop: 4 },
  gridRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', width: '100%', backgroundColor: 'rgba(200,168,75,0.06)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.18)', borderRadius: 16, paddingVertical: 18, marginBottom: 10 },
  gridCell: { alignItems: 'center', flex: 1 },
  gridDivider: { width: 1, height: 36, backgroundColor: 'rgba(200,168,75,0.22)' },
  gridNum: { fontSize: 32, fontFamily: FONTS.serifSemiBold, color: T.cream, marginBottom: 4 },
  gridLabel: { fontSize: 11, fontFamily: FONTS.sans, color: 'rgba(250,248,242,0.5)', textAlign: 'center' },
  revealCard: { width: '100%', marginTop: 24, padding: 20, borderLeftWidth: 3, borderLeftColor: T.gold, backgroundColor: 'rgba(200,168,75,0.05)', borderRadius: 12 },
  revealKicker: { fontSize: 9, letterSpacing: 1.6, fontFamily: FONTS.sansSemiBold, color: T.gold, marginBottom: 8 },
  revealText: { fontSize: 16, fontFamily: FONTS.serif, fontStyle: 'italic', color: T.cream, lineHeight: 23, marginBottom: 8 },
  revealFooter: { fontSize: 13, fontFamily: FONTS.serif, color: 'rgba(250,248,242,0.55)' },
  manageLink: { fontSize: 13, color: 'rgba(250,248,242,0.45)', textAlign: 'center', fontFamily: FONTS.sansLight },
});
