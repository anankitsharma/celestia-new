import React, { useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { RADIUS, SPACING } from '../constants/tokens';

/**
 * BrandSheet — lightweight bottom-sheet using react-native-gesture-handler
 * and react-native-reanimated. Built without @gorhom/bottom-sheet to avoid
 * a new dependency.
 *
 * Material Design preference on Android. Modern iOS preference too. Use for
 * secondary surfaces (NPS prompt, share preview, journal entry composition,
 * filters, settings) where BrandModal's fullscreen takeover is too heavy.
 *
 * Per plan/senior-design-critique/04-replaceable-patterns.md R-2 +
 * plan/android-status.md AND-8.
 *
 * Features:
 *   - Slides up from bottom on open
 *   - Drag-down to dismiss with momentum threshold (200pt or velocity > 600)
 *   - Backdrop fades with sheet position
 *   - Tap backdrop to dismiss
 *   - Configurable height (default ~60% of screen)
 *
 * Usage:
 *   <BrandSheet visible={open} onDismiss={() => setOpen(false)}>
 *     <Text>...content...</Text>
 *   </BrandSheet>
 */

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD_DISTANCE = 200;     // px
const DISMISS_THRESHOLD_VELOCITY = 600;      // px/s
const SPRING_CONFIG = { damping: 22, stiffness: 220, mass: 1 };

export default function BrandSheet({
  visible,
  onDismiss,
  children,
  height = SCREEN_HEIGHT * 0.6,
  backgroundColor,
  brandedGradient = false,
}) {
  const { colors } = useTheme();
  // Sheet starts off-screen at +height, animates to 0 (open)
  const translateY = useSharedValue(height);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, SPRING_CONFIG);
    } else {
      translateY.value = withTiming(height, { duration: 200 });
    }
  }, [visible, height, translateY]);

  // Backdrop opacity tracks the sheet's position — fades as user drags down
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, height],
      [0.6, 0],
      Extrapolate.CLAMP
    ),
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleClose = () => {
    if (onDismiss) {
      // animate out, then call onDismiss after animation
      translateY.value = withTiming(height, { duration: 200 }, (finished) => {
        if (finished) runOnJS(onDismiss)();
      });
    }
  };

  // Pan gesture — drag-down to dismiss. Only allows downward drag (clamps at 0).
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      const newY = Math.max(0, e.translationY);
      translateY.value = newY;
    })
    .onEnd((e) => {
      const shouldDismiss =
        e.translationY > DISMISS_THRESHOLD_DISTANCE ||
        e.velocityY > DISMISS_THRESHOLD_VELOCITY;
      if (shouldDismiss) {
        translateY.value = withTiming(height, { duration: 220 }, (finished) => {
          if (finished && onDismiss) runOnJS(onDismiss)();
        });
      } else {
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    });

  // Sheet uses a brand-gradient by default if requested, else a flat
  // theme-aware background.
  const sheetBg = backgroundColor || colors.modalBg || colors.card;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop — tap to dismiss; opacity ties to sheet position */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} pointerEvents={visible ? 'auto' : 'none'}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      {/* Sheet container with gesture detector for drag */}
      <View style={styles.container} pointerEvents="box-none">
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.sheet, { height, backgroundColor: brandedGradient ? 'transparent' : sheetBg }, sheetStyle]}>
            {brandedGradient ? (
              <LinearGradient
                colors={['#5A2840', '#3A1A28', '#1F0F18']}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            {/* Drag handle — visual affordance + tactile target */}
            <View style={styles.handleWrap} pointerEvents="none">
              <View style={[styles.handle, { backgroundColor: brandedGradient ? 'rgba(250,248,242,0.3)' : colors.textMuted }]} />
            </View>
            {/* Content */}
            <View style={styles.content}>
              {children}
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: '#000',
  },
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    overflow: 'hidden',
    // soft shadow / elevation for the sheet edge
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  handleWrap: {
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xs,
    alignItems: 'center',
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
});
