import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T } from '../constants/theme';
import { RADIUS, SPACING } from '../constants/tokens';

/**
 * BrandModal — the canonical Celestia modal pattern.
 *
 * The 7+ modals across HomeScreen (freeze offer, NPS, streak restore,
 * D30 callback, Pro week-1 recap, surprise insight, wake-time backfill)
 * share the same structure:
 *   1. Modal with transparent background + fade animation
 *   2. Full-screen overlay tap-zone (bg rgba(0,0,0,0.6))
 *   3. Centered card (max-width 340, RADIUS.lg = 24, overflow hidden)
 *   4. Navy-plum gradient inside the card
 *   5. Padded content slot (default padding 28 / paddingTop 32)
 *
 * Use this component to lock in modal consistency. New modals automatically
 * inherit the brand language without per-modal restyling.
 *
 * Usage:
 *   <BrandModal visible={open} onRequestClose={close}>
 *     <Text>...content...</Text>
 *     <CTA />
 *   </BrandModal>
 *
 * Props:
 *   - visible (bool, required) — controls modal presentation
 *   - onRequestClose (fn) — Android back button handler
 *   - children (node) — modal content; rendered inside the gradient
 *   - cardWidth (number) — override max width (default 340)
 *   - dim ('soft' | 'standard' | 'strong') — overlay opacity (default 'standard' = 0.6)
 */
const DIM = {
  soft:     'rgba(0,0,0,0.4)',
  standard: 'rgba(0,0,0,0.6)',
  strong:   'rgba(0,0,0,0.75)',
};

export default function BrandModal({
  visible,
  onRequestClose,
  children,
  cardWidth = 340,
  dim = 'standard',
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={[styles.overlay, { backgroundColor: DIM[dim] || DIM.standard }]}>
        <View style={[styles.card, { maxWidth: cardWidth }]}>
          <LinearGradient
            colors={['#5A2840', '#3A1A28', '#1F0F18']}
            style={styles.gradient}
          >
            {children}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl, // 32 — keeps card off the screen edges
  },
  card: {
    width: '100%',
    borderRadius: RADIUS.lg, // 24
    overflow: 'hidden',
  },
  gradient: {
    paddingHorizontal: SPACING.xl,    // 32
    paddingTop: SPACING.xl,           // 32
    paddingBottom: SPACING.lg,        // 24
    alignItems: 'center',
  },
});
