// V1.2 — Shared empty state shown when the user skipped onboarding via the ×
// close button. Any tab that shows personalized content (Today, Ask, Connections,
// Profile) early-returns this when `celestia_profile_is_placeholder` is true,
// instead of rendering UI based on the placeholder profile (Friend / Jan 1 1990).
//
// Visual language matches Splash + Onboarding step 1: cream canvas, clay
// hairline, serif title, sans subtitle, clay CTA. Reads as part of the
// onboarding family, not a broken main screen.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

const SetupRequiredState = ({ subtitle, onAddDetails }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <View style={styles.center}>
        <View style={styles.hairline} />
        <Text style={[styles.title, { color: colors.heading }]}>Personalize Celestia</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          {subtitle || 'Add your birth details to unlock your full Celestia experience.'}
        </Text>
        <View style={{ height: 28 }} />
        <TouchableOpacity
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add birth details"
          onPress={onAddDetails}
          style={styles.cta}>
          <Text style={styles.ctaText}>Add my birth details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 48) + 16,
    paddingHorizontal: 32,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: '12%' },
  hairline: { width: 36, height: 1, backgroundColor: 'rgba(92,36,52,0.35)', marginBottom: 22 },
  title: { fontFamily: FONTS.serif, fontSize: 32, color: T.navy, textAlign: 'center', lineHeight: 42, marginBottom: 14 },
  sub: { fontSize: 15, fontFamily: FONTS.sansLight, color: T.stone, textAlign: 'center', lineHeight: 24 },
  cta: { width: 292, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: T.clay, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 4 },
  ctaText: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: T.cream, letterSpacing: 0.4 },
});

export default SetupRequiredState;
