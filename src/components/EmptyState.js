import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, RADIUS } from '../constants/tokens';
import { haptic } from '../services/hapticService';

/**
 * EmptyState — canonical empty-state component.
 *
 * Per plan/design-audit/06-voice-and-copy.md Issue 5: most screens silently
 * render nothing when empty. JournalScreen with no entries, ChatScreen
 * history with no sessions, ReportsScreen pre-generation, Circle with no
 * partners. Empty states are brand-voice opportunities.
 *
 * Pattern (per ux-writing skill methodology):
 *   1. Glyph — typographic mark, not platform emoji
 *   2. Headline — name what's empty
 *   3. Subhead — explain why it matters (one sentence)
 *   4. Action — one CTA (the "first thing to try")
 *
 * Usage:
 *   <EmptyState
 *     glyph="◌"
 *     headline="Your journal is empty"
 *     subhead="The patterns show up here. One entry to start."
 *     ctaLabel="Write your first entry"
 *     onCtaPress={() => navigation.navigate('Journal')}
 *   />
 */
export default function EmptyState({
  glyph,
  headline,
  subhead,
  ctaLabel,
  onCtaPress,
  secondaryLabel,
  onSecondaryPress,
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.glyph, { color: T.gold }]}>{glyph}</Text>
      <Text style={[styles.headline, { color: colors.heading }]}>{headline}</Text>
      {subhead ? (
        <Text style={[styles.subhead, { color: colors.textSecondary }]}>{subhead}</Text>
      ) : null}

      {ctaLabel && onCtaPress ? (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => { try { haptic.light(); } catch {} onCtaPress(); }}
          style={styles.ctaWrap}
        >
          <LinearGradient
            colors={['#E2C46A', '#C8A84B', '#A07820']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cta}
          >
            <Text style={styles.ctaText}>{ctaLabel}</Text>
          </LinearGradient>
        </TouchableOpacity>
      ) : null}

      {secondaryLabel && onSecondaryPress ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { try { haptic.light(); } catch {} onSecondaryPress(); }}
          style={styles.secondaryWrap}
        >
          <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>{secondaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,    // 48
    paddingHorizontal: SPACING.lg,   // 24
  },
  glyph: {
    fontSize: 36,
    marginBottom: SPACING.md,        // 16
  },
  headline: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: SPACING.xs,        // 8
  },
  subhead: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: SPACING.lg,        // 24
    maxWidth: 280,
  },
  ctaWrap: { marginTop: SPACING.xs },
  cta: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2, // 14
    borderRadius: RADIUS.md,
    alignItems: 'center',
    minWidth: 200,
  },
  ctaText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 15,
    color: T.navy,
  },
  secondaryWrap: { marginTop: SPACING.sm, padding: SPACING.xs },
  secondaryText: {
    fontFamily: FONTS.sansMedium,
    fontSize: 13,
  },
});
