import React, { useRef } from 'react';
import { Pressable, Animated, StyleSheet, Platform } from 'react-native';
import { GOLD_ALPHA } from '../constants/tokens';
import { haptic } from '../services/hapticService';

/**
 * PressableCard — drop-in replacement for TouchableOpacity card wrappers.
 *
 * Adds modern press feedback that's missing from TouchableOpacity's
 * activeOpacity-only behavior:
 *   - Scale animation: 1 → 0.97 with spring back (iOS native feel)
 *   - Material ripple on Android (only for surfaces that should have one)
 *   - Optional haptic.light() on press
 *
 * Per plan/senior-design-critique/02-modern-patterns-checklist.md #13 +
 * plan/android-status.md (Tier 1 polish).
 *
 * Usage:
 *   <PressableCard onPress={...} style={styles.card}>
 *     ...content...
 *   </PressableCard>
 *
 *   <PressableCard onPress={...} style={styles.card} ripple={false}>
 *     ...for surfaces where Material ripple would clash visually...
 *   </PressableCard>
 *
 *   <PressableCard onPress={...} style={styles.card} pressScale={0.99}>
 *     ...for very large cards where 0.97 looks too dramatic...
 *   </PressableCard>
 */

const RIPPLE_COLOR = GOLD_ALPHA.subtle;

export default function PressableCard({
  onPress,
  onLongPress,
  children,
  style,
  pressScale = 0.97,
  ripple = true,
  hapticOnPress = false,
  disabled = false,
  testID,
  hitSlop,
  ...rest
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: pressScale,
      tension: 200,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 1,
      tension: 200,
      friction: 6,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    if (hapticOnPress) {
      try { haptic.light(); } catch {}
    }
    onPress?.();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID={testID}
        hitSlop={hitSlop}
        android_ripple={
          ripple && Platform.OS === 'android'
            ? { color: RIPPLE_COLOR, borderless: false }
            : undefined
        }
        style={({ pressed }) => [
          styles.base,
          style,
          // iOS: subtle opacity tweak in addition to the scale spring
          pressed && Platform.OS === 'ios' && { opacity: 0.96 },
        ]}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',  // ensures Android ripple is clipped to rounded shape
  },
});
