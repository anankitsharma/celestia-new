import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import { T, FONTS } from '../constants/theme';

// Format a 24h hour into a readable wake time. Honors a 'minute' offset so
// the body matches the actual scheduled fire time (settings.morningTime
// + settings.morningMinute, persisted at onboarding step 11).
function formatWakeTime(hour, minute = 0) {
  if (typeof hour !== 'number') return '7:00am';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? 'am' : 'pm';
  const m = minute > 0 ? `:${String(minute).padStart(2, '0')}` : ':00';
  return `${h}${m}${ampm}`;
}

function truncate(str, max = 110) {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max - 1).trim()}…` : str;
}

/**
 * Permission modal shown post-chart-reveal at peak motivation.
 * Editorial bottom-sheet: cream surface, grab handle, sparkle, Playfair
 * hero ("Tomorrow at 6:55am"), faithful preview of the actual D1 push,
 * italic Newsreader body, pill CTA, "Maybe later" link.
 *
 * Props:
 *   visible              — modal visibility
 *   onEnable / onDismiss — handlers
 *   wakeTime             — { hour, minute } from notification settings
 *   firstRevealStatement — string saved during onboarding's first reveal
 */
export default function NotificationPermissionModal({
  visible,
  onEnable,
  onDismiss,
  wakeTime,
  firstRevealStatement,
}) {
  const timeLabel = formatWakeTime(wakeTime?.hour, wakeTime?.minute);
  const reveal = (firstRevealStatement || '').trim().replace(/^["'""]|["'""]$/g, '');
  const previewBody = reveal
    ? truncate(`Your real chart, not your sun sign. ${reveal}`)
    : 'Your real chart, not your sun sign. Your reading is grounded in the chart you just cast — not generic horoscope copy.';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={s.overlay} onPress={onDismiss}>
        {/* Inner pressable swallow keeps taps inside the sheet from dismissing */}
        <Pressable style={s.sheet} onPress={() => {}}>
          {/* Grab handle */}
          <View style={s.handle} />

          {/* Sparkle ornament */}
          <Text style={s.sparkle}>✦</Text>

          {/* Hero — Tomorrow at 6:55am */}
          <Text style={s.hero}>Tomorrow at {timeLabel}</Text>

          {/* Preview of the actual D1 push the user will receive tomorrow */}
          <View style={s.previewCard}>
            <View style={s.previewIcon}>
              <Text style={s.previewIconLetter}>C</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.previewMetaRow}>
                <Text style={s.previewAppName}>Celestia</Text>
                <Text style={s.previewWhen}>Now</Text>
              </View>
              <Text style={s.previewBody} numberOfLines={3}>{previewBody}</Text>
            </View>
          </View>

          {/* Italic body — anchors why we're asking */}
          <Text style={s.body}>
            Your real chart, not your sun sign. Allow notifications and we'll start with this — first thing tomorrow.
          </Text>

          <View style={{ flex: 1, minHeight: 8 }} />

          {/* Primary pill CTA */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={onEnable}
            style={s.cta}
            accessibilityRole="button"
            accessibilityLabel="Allow notifications">
            <Text style={s.ctaText}>Allow Notifications</Text>
          </TouchableOpacity>

          {/* Secondary link */}
          <TouchableOpacity
            onPress={onDismiss}
            style={s.dismiss}
            accessibilityRole="button"
            accessibilityLabel="Maybe later">
            <Text style={s.dismissText}>Maybe later</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const SURFACE = '#FBF9F8';           // cream
const SURFACE_HIGHEST = '#E4E2E2';   // warm grey for preview bubble
const PRIMARY = '#3A1A28';           // T.navy — deep burgundy
const PRIMARY_CONTAINER = '#4A0E0E'; // app-icon container + CTA fill
const ON_SURFACE = '#1B1C1C';
const ON_SURFACE_VARIANT = '#544341';
const OUTLINE_VARIANT = '#DAC1BF';
const SECONDARY_GOLD = '#B89968';    // T.brass

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 12, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: 'center',
    minHeight: 560,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: OUTLINE_VARIANT,
    marginBottom: 28,
  },
  sparkle: {
    fontSize: 24,
    color: SECONDARY_GOLD,
    marginBottom: 24,
  },
  hero: {
    fontFamily: FONTS.serif,
    fontSize: 30,
    lineHeight: 38,
    color: PRIMARY,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },

  previewCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: SURFACE_HIGHEST,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(135,114,112,0.18)',
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 9,
    backgroundColor: PRIMARY_CONTAINER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewIconLetter: {
    fontFamily: FONTS.serif,
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 26,
  },
  previewMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  previewAppName: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 14,
    color: ON_SURFACE,
    letterSpacing: 0.2,
  },
  previewWhen: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: ON_SURFACE_VARIANT,
    opacity: 0.7,
  },
  previewBody: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    lineHeight: 18,
    color: ON_SURFACE,
  },

  body: {
    fontFamily: FONTS.serifItalic || FONTS.serif,
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
    color: ON_SURFACE_VARIANT,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: 24,
  },

  cta: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: PRIMARY_CONTAINER,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  ctaText: {
    fontFamily: FONTS.sansMedium || FONTS.sansSemiBold,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  dismiss: { marginTop: 12, paddingVertical: 10, paddingHorizontal: 16 },
  dismissText: {
    fontFamily: FONTS.sansMedium || FONTS.sans,
    fontSize: 14,
    color: ON_SURFACE_VARIANT,
  },
});
