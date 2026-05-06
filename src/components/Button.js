import React, { useRef } from 'react';
import { Pressable, Text, View, Animated, StyleSheet, Platform } from 'react-native';
import { T, FONTS } from '../constants/theme';
import { RADIUS, GOLD_ALPHA, SPACING, KICKER_TRACKING } from '../constants/tokens';
import { haptic } from '../services/hapticService';

/**
 * Button — flat tiered button system.
 *
 * Replaces the gold-gradient pill pattern (which read 2017-era) with a
 * three-tier system that fits modern iOS HIG + Material 3 conventions.
 *
 * Tiers:
 *   - primary  — solid gold fill, navy text, scale-on-press, single hero CTA per screen
 *   - secondary — gold border, transparent fill, gold text, alternative actions
 *   - ghost    — text only, gold tint, tertiary / "skip" / "later"
 *
 * Press semantics:
 *   - iOS:     Pressable + Animated scale 0.97 with spring back
 *   - Android: Pressable + native Material ripple via android_ripple
 *   - Both:    haptic.light() on press
 *
 * Per plan/senior-design-critique/04-replaceable-patterns.md R-1 +
 * plan/android-status.md (Tier 1 primary modernization).
 *
 * Usage:
 *   <Button label="Stay with Pro" onPress={...} />              — primary by default
 *   <Button label="Cancel" variant="secondary" onPress={...} />
 *   <Button label="Maybe later" variant="ghost" onPress={...} />
 *   <Button label="..." disabled />                              — auto-dim + no haptic
 *   <Button label="..." loading />                                — adds spinner state
 *   <Button label="..." size="sm" />                              — compact
 *   <Button label="..." block />                                  — full-width
 */

const RIPPLE_COLOR = 'rgba(160, 120, 32, 0.18)'; // darker gold for ripple

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  loading = false,
  style,
  textStyle,
  hapticOnPress = true,
  testID,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scale, {
      toValue: 0.97,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scale, {
      toValue: 1,
      tension: 200,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (hapticOnPress) {
      try { haptic.light(); } catch {}
    }
    onPress?.();
  };

  const variantStyle = STYLES[variant] || STYLES.primary;
  const sizeStyle = SIZES[size] || SIZES.md;

  const containerStyle = [
    styles.base,
    variantStyle.container,
    sizeStyle.container,
    block && { width: '100%' },
    disabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    variantStyle.label,
    sizeStyle.label,
    textStyle,
  ];

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        testID={testID}
        android_ripple={
          // Android Material ripple — only on filled variants where ripple
          // is visible. Ghost and disabled get no ripple.
          variant === 'primary' || variant === 'secondary'
            ? { color: RIPPLE_COLOR, borderless: false }
            : undefined
        }
        style={({ pressed }) => [
          containerStyle,
          // iOS-only: subtle opacity on press to complement scale
          pressed && Platform.OS === 'ios' && variant === 'primary' && { opacity: 0.92 },
        ]}
      >
        {loading ? (
          <View style={styles.loadingDots}>
            <Text style={[labelStyle, { letterSpacing: KICKER_TRACKING }]}>•••</Text>
          </View>
        ) : (
          <Text style={labelStyle}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',     // clip ripple to the rounded shape (Android)
    flexDirection: 'row',
  },
  label: {
    fontFamily: FONTS.sansSemiBold,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,           // STATE.disabled
  },
  loadingDots: {
    paddingVertical: 2,
  },
});

const STYLES = {
  primary: {
    container: {
      backgroundColor: T.gold,
      borderRadius: RADIUS.md,    // 14
    },
    label: {
      color: T.navy,
    },
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: GOLD_ALPHA.emphasis,  // 0.32 alpha gold
      borderRadius: RADIUS.md,
    },
    label: {
      color: T.gold,
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
      borderRadius: RADIUS.md,
    },
    label: {
      color: T.gold,
    },
  },
};

const SIZES = {
  sm: {
    container: {
      paddingVertical: SPACING.xs,         // 8
      paddingHorizontal: SPACING.md,       // 16
      minHeight: 36,
    },
    label: { fontSize: 13 },
  },
  md: {
    container: {
      paddingVertical: SPACING.sm + 2,     // 14
      paddingHorizontal: SPACING.lg,       // 24
      minHeight: 48,                        // Android 48dp standard
    },
    label: { fontSize: 15 },
  },
  lg: {
    container: {
      paddingVertical: SPACING.md,         // 16
      paddingHorizontal: SPACING.xl,       // 32
      minHeight: 56,
    },
    label: { fontSize: 17 },
  },
};
