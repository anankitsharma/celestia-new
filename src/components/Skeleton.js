import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { RADIUS } from '../constants/tokens';

/**
 * Skeleton — pulsing placeholder shape used while content loads.
 *
 * Replaces ActivityIndicator spinners across the app. Communicates
 * "the thing you're about to see" rather than "loading something undefined."
 * Eliminates layout shift when real content arrives.
 *
 * Per plan/senior-design-critique/04-replaceable-patterns.md R-3 +
 * plan/android-status.md (Tier 1 polish on both platforms).
 *
 * Usage:
 *   <Skeleton width={200} height={20} />                 — single rectangle
 *   <Skeleton width="100%" height={14} radius={4} />     — full-width line
 *   <SkeletonGroup gap={12}>                              — stack of skeletons
 *     <Skeleton width="80%" height={20} />
 *     <Skeleton width="60%" height={14} />
 *   </SkeletonGroup>
 */

export default function Skeleton({
  width = '100%',
  height = 14,
  radius = 6,
  style,
}) {
  const { colors, isDark } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Subtle pulse — 1.2s cycle. Loop forever.
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  // Subtle base color: warm-stone in light mode, plum in dark — matches
  // brand palette so skeletons don't feel like generic system loaders.
  const baseColor = isDark
    ? 'rgba(155, 142, 196, 0.18)'  // soft lavender on navy-plum
    : 'rgba(151, 144, 127, 0.18)'; // soft stone on cream

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: baseColor,
          borderRadius: radius,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * SkeletonGroup — convenience wrapper for stacked skeletons with consistent gap.
 */
export function SkeletonGroup({ gap = 8, children, style }) {
  const items = React.Children.toArray(children);
  return (
    <View style={style}>
      {items.map((child, i) => (
        <View key={i} style={{ marginBottom: i < items.length - 1 ? gap : 0 }}>
          {child}
        </View>
      ))}
    </View>
  );
}

// Common shape: a briefing card skeleton (headline + 4 lines + tag row).
// Use as: <SkeletonBriefingCard /> instead of inline composing every time.
export function SkeletonBriefingCard() {
  return (
    <View style={styles.card}>
      <Skeleton width="40%" height={11} radius={4} style={{ marginBottom: 14 }} />
      <Skeleton width="85%" height={28} radius={6} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={14} radius={4} style={{ marginBottom: 8 }} />
      <Skeleton width="92%" height={14} radius={4} style={{ marginBottom: 8 }} />
      <Skeleton width="78%" height={14} radius={4} style={{ marginBottom: 14 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton width={60} height={22} radius={11} />
        <Skeleton width={80} height={22} radius={11} />
        <Skeleton width={50} height={22} radius={11} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.lg,
    padding: 24,
  },
});
