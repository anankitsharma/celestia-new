import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal,
  Platform, StatusBar, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePostHog } from 'posthog-react-native';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { useAnalytics, EVENTS, getFeatureFlag } from '../services/analytics';
import { haptic } from '../services/hapticService';
import { JournalRepository } from '../services/database/rep_journal';
import { ChatRepository } from '../services/database/rep_chats';
import { loadString, StorageKeys } from '../services/storage';
import { RevenueCatService } from '../services/revenueCatService';

// Reasons listed in the order the matrix from 04-churn-prevention.md prescribes.
// Order from most-common down. Review quarterly with PostHog data.
const REASONS = [
  { id: 'too_expensive',     label: 'Too expensive' },
  { id: 'not_using',         label: 'Not using it enough' },
  { id: 'missing_feature',   label: 'Missing a feature I need' },
  { id: 'too_generic',       label: 'The insights felt too generic' },
  { id: 'privacy',           label: 'Privacy concerns' },
  { id: 'temporary',         label: 'Just don\'t need it right now' },
  { id: 'switching',         label: 'Switching to another app' },
  { id: 'other',             label: 'Other' },
];

// Trial-cancel reasons match a different mental model: trial users cancel for
// "haven't tried it yet" / "auto-renewal anxiety" / "not what I expected" —
// not the established-subscriber reasons.
const TRIAL_REASONS = [
  { id: 'no_time',            label: 'Didn\'t have time to try it properly' },
  { id: 'not_what_hoped',     label: 'Tried it, not what I was hoping for' },
  { id: 'forgot_trial',       label: 'Forgot I had a trial — don\'t want to be charged' },
  { id: 'not_ready_commit',   label: 'Helpful, but not ready to commit' },
  { id: 'privacy',            label: 'Privacy concerns' },
  { id: 'switching',          label: 'Switching to another app' },
  { id: 'other',              label: 'Other' },
];

// Save offers for trial-cancellers. Tone: respect autonomy. Trial users that
// feel coerced refund + 1-star. Goal is informed cancellation, not coercion.
const TRIAL_SAVE_OFFERS = {
  no_time: {
    headline: 'Your trial has time left',
    body: 'The highest-leverage Pro feature is the weekly chart read — takes 30 seconds, written from your real transits. Try it before you decide.',
    primaryCta: 'Try the weekly read',
    declineCta: 'Continue cancelling',
    target: 'Reports',
  },
  not_what_hoped: {
    headline: 'What were you hoping for?',
    body: 'A quick line — what would have made it click? We\'ll keep your trial active until you decide.',
    primaryCta: 'Keep trial open',
    declineCta: 'Continue cancelling',
  },
  forgot_trial: {
    headline: 'That\'s on us',
    body: 'We sent a heads-up notification 2 days before your trial charges. You can decide then, on your own time. No need to cancel now.',
    primaryCta: 'Got it — keep trial',
    declineCta: 'Continue cancelling',
  },
  not_ready_commit: {
    headline: 'Take the rest of your trial',
    body: 'Your trial runs until the end. Cancel any time before then — no charge. Your chart, journals, and Circle stay forever either way.',
    primaryCta: 'Keep using until trial ends',
    declineCta: 'Continue cancelling',
  },
  privacy: {
    headline: 'Your data is yours',
    body: 'Manage or delete everything from Profile → Privacy. Or export a copy first. We don\'t share your chart with anyone.',
    primaryCta: 'Manage my data',
    declineCta: 'Continue cancelling',
  },
  switching: {
    headline: 'What does the other app do?',
    body: 'Quick line — what does it do that Celestia should? Even one sentence helps us improve.',
    primaryCta: 'Keep trial open',
    declineCta: 'Continue cancelling',
  },
  other: {
    headline: 'Before you go',
    body: 'You\'ve started something. Your chart, journals, and any Circle entries stay forever — but the depth keeps building if you let it.',
    primaryCta: 'Keep trial open',
    declineCta: 'Continue cancelling',
  },
};

// Save-offer copy keyed by REASON × VARIANT.
//
// Variants (set up the matching feature flag `cancel_flow_variant` in PostHog):
//   - `control`        — default copy (deeper-product framing).
//   - `data-loss`      — emphasizes what they keep + what they lose access to.
//   - `value-deepening`— emphasizes that staying makes Celestia smarter over time.
//
// PostHog feature-flag setup:
//   1. Create a flag named `cancel_flow_variant`.
//   2. Multivariate with three keys: control, data-loss, value-deepening.
//   3. Roll out 33/33/33 over your audience (or hold-out a control %).
//   4. Cohort on CANCEL_SAVE_OFFER_DECLINED + CANCEL_CONFIRMED to compare save rates.
//
// Note: iOS IAP can't apply discounts in-app. Discount variants would require
// App Store Connect promo offer codes — out of scope for MVP.
const SAVE_OFFERS = {
  too_expensive: {
    control: {
      headline: 'What if your subscription kept getting deeper?',
      body: 'Pro unlocks weekly + monthly reports, unlimited Circle entries, and deeper synastry. The longer you stay, the more it learns about you.',
      primaryCta: 'Stay with Pro',
      declineCta: 'Continue cancelling',
    },
    'data-loss': {
      headline: 'You\'d lose access to a lot you\'ve built',
      body: 'Cancelling means losing access to weekly reports, deep partner reads, and unlimited chats. Your data stays — but the depth stops.',
      primaryCta: 'Keep my access',
      declineCta: 'Continue cancelling',
    },
    'value-deepening': {
      headline: 'Celestia gets smarter the longer you stay',
      body: 'Each chat, journal, and Circle entry trains a sharper read of you. Cancelling now resets that depth. Staying makes the next month better than this one.',
      primaryCta: 'Let it deepen',
      declineCta: 'Continue cancelling',
    },
  },
  not_using: {
    control: {
      headline: 'Want to take a break instead?',
      body: 'Your chart, journals, and Circle stay exactly where they are. You can pick up where you left off — your patterns will be more visible by then, not less.',
      primaryCta: 'Stay — I\'ll come back',
      declineCta: 'Continue cancelling',
    },
    'data-loss': {
      headline: 'Your patterns won\'t pause',
      body: 'You\'ve built data Celestia can analyze for years. Cancelling cuts off the read — you keep the entries but lose the lens.',
      primaryCta: 'Keep my access',
      declineCta: 'Continue cancelling',
    },
    'value-deepening': {
      headline: 'The patterns become more visible after week 4',
      body: 'Many users feel the same in week 2-3. Week 4+ is where Celestia\'s reads sharpen because the data is there. Try one more week.',
      primaryCta: 'Stay one more week',
      declineCta: 'Continue cancelling',
    },
  },
  missing_feature: {
    control: {
      headline: 'Tell us what would have changed your mind',
      body: 'We\'re shipping new features regularly. If you let us know what was missing, we can email you when it lands.',
      primaryCta: 'Stay with Pro',
      declineCta: 'Continue cancelling',
    },
    'data-loss': {
      headline: 'Cancel later if it\'s still missing',
      body: 'You\'ll keep full Pro access until your billing period ends. If we don\'t ship what you wanted by then, you can still cancel.',
      primaryCta: 'Wait it out',
      declineCta: 'Continue cancelling',
    },
    'value-deepening': {
      headline: 'What would have made it land?',
      body: 'A line of feedback from you is worth more than any roadmap doc. Tell us what\'s missing — we\'ll prioritize it.',
      primaryCta: 'Stay with Pro',
      declineCta: 'Continue cancelling',
    },
  },
  too_generic: {
    control: {
      headline: 'Your chart has more in it than you\'ve seen',
      body: 'Most users only explore 20% of what their chart reveals. Try a deep-dive report on one placement before you go — your read will feel different.',
      primaryCta: 'Try a deep-dive read',
      declineCta: 'Continue cancelling',
    },
    'data-loss': {
      headline: 'The deeper reads are behind Pro',
      body: 'Standard daily briefings are intentionally light. The actual depth — placement deep-dives, synastry reports, transit forecasts — is where your chart starts speaking.',
      primaryCta: 'Try a deep read',
      declineCta: 'Continue cancelling',
    },
    'value-deepening': {
      headline: 'It gets specific after the data accumulates',
      body: 'Generic reads happen when the model has no context. After 14 days of journals + chats, briefings shift to "I noticed about you" voice. You\'re close to that point.',
      primaryCta: 'Stay another week',
      declineCta: 'Continue cancelling',
    },
  },
  privacy: {
    control: {
      headline: 'Your data is yours',
      body: 'You can delete everything from Profile → Privacy. Or export a copy first. We don\'t share your chart with anyone.',
      primaryCta: 'Manage my data',
      declineCta: 'Continue cancelling',
    },
    'data-loss': {
      headline: 'Your data is yours',
      body: 'You can delete everything from Profile → Privacy. Or export a copy first. We don\'t share your chart with anyone.',
      primaryCta: 'Manage my data',
      declineCta: 'Continue cancelling',
    },
    'value-deepening': {
      headline: 'Your data is yours',
      body: 'You can delete everything from Profile → Privacy. Or export a copy first. We don\'t share your chart with anyone.',
      primaryCta: 'Manage my data',
      declineCta: 'Continue cancelling',
    },
  },
  temporary: {
    control: {
      headline: 'When you come back, your data will be here',
      body: 'Pause is the same as cancel for our system — your chart, journals, partners, and streak history all stay. Resubscribing picks up where you left off.',
      primaryCta: 'Stay with Pro',
      declineCta: 'Continue cancelling',
    },
    'data-loss': {
      headline: 'You keep everything, but lose access',
      body: 'Charts, journals, Circle, badges, streak — all preserved. But Pro features (weekly reports, deep dives) lock until you resubscribe.',
      primaryCta: 'Stay subscribed',
      declineCta: 'Continue cancelling',
    },
    'value-deepening': {
      headline: 'The longer you stay, the better the reads',
      body: 'Coming back later means starting from the depth you have today. Staying means each week adds context the AI uses next time.',
      primaryCta: 'Stay subscribed',
      declineCta: 'Continue cancelling',
    },
  },
  switching: {
    control: {
      headline: 'What would have kept you here?',
      body: 'Quick free-text — what does the other app do that we should? Even one line helps us improve.',
      primaryCta: 'Stay with Pro',
      declineCta: 'Continue cancelling',
    },
    'data-loss': {
      headline: 'You\'ll lose your built history',
      body: 'Other apps don\'t have your chart, journals, or Circle. You\'d be starting over there. We can\'t move that for you.',
      primaryCta: 'Keep what I\'ve built',
      declineCta: 'Continue cancelling',
    },
    'value-deepening': {
      headline: 'No app reads you the same way',
      body: 'The other app doesn\'t know your patterns. Celestia does — at least until you cancel. That context is hard to rebuild elsewhere.',
      primaryCta: 'Stay with Pro',
      declineCta: 'Continue cancelling',
    },
  },
  other: {
    control: {
      headline: 'Before you go',
      body: 'You\'ve built something meaningful here. Your chart, journals, Circle, and streak history will stay forever — but the longer you stay, the deeper Celestia learns about you.',
      primaryCta: 'Stay with Pro',
      declineCta: 'Continue cancelling',
    },
    'data-loss': {
      headline: 'Before you go',
      body: 'Your data stays. Your access locks. You can resubscribe any time, but Pro features pause at the end of your billing period.',
      primaryCta: 'Keep my access',
      declineCta: 'Continue cancelling',
    },
    'value-deepening': {
      headline: 'Before you go',
      body: 'Each week of usage trains a sharper read of you. Cancelling now means restarting that curve when you come back. Staying lets it compound.',
      primaryCta: 'Stay with Pro',
      declineCta: 'Continue cancelling',
    },
  },
};

// Pick the variant offer; falls back to control on missing keys.
// When isTrial is true, uses TRIAL_SAVE_OFFERS (flat shape — no variants;
// trial copy is opinionated enough that A/B-testing offer copy isn't worth
// the per-cell sample-size hit).
function pickOffer(reasonId, variant, isTrial) {
  if (isTrial) return TRIAL_SAVE_OFFERS[reasonId] || null;
  const reasonOffers = SAVE_OFFERS[reasonId];
  if (!reasonOffers) return null;
  return reasonOffers[variant] || reasonOffers.control;
}

const STEPS = { SURVEY: 'survey', SAVE: 'save', CONFIRM: 'confirm' };

export default function CancelFlowScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { userProfile, partnerProfiles } = useUserProfile();
  const { capture } = useAnalytics();
  const posthog = usePostHog();

  const [step, setStep] = useState(STEPS.SURVEY);
  const [selectedReason, setSelectedReason] = useState(null);
  const [stickyCounts, setStickyCounts] = useState(null);
  const [isTrial, setIsTrial] = useState(false);
  const flowFinalizedRef = useRef(false);
  // Variant assigned by PostHog feature flag — empty until flag fetched.
  const variantRef = useRef('control');

  // Load investment counts to surface in confirm step
  useEffect(() => {
    (async () => {
      try {
        const profileId = userProfile?.id || 'default';
        const [journalCount, chatSessions, firstUse] = await Promise.all([
          JournalRepository.getEntryCount(profileId).catch(() => 0),
          ChatRepository.getSessions(100).catch(() => []),
          loadString(StorageKeys.FIRST_USE_DATE).catch(() => null),
        ]);
        let daysWithUs = 0;
        if (firstUse) {
          const start = new Date(firstUse + 'T00:00:00');
          const today = new Date(); today.setHours(0, 0, 0, 0);
          daysWithUs = Math.max(1, Math.floor((today - start) / 86400000) + 1);
        }
        setStickyCounts({
          daysWithUs,
          journalCount: journalCount || 0,
          chatCount: (chatSessions || []).length,
          partnerCount: partnerProfiles?.length || 0,
        });
      } catch {}
    })();
  }, []);

  // Fetch feature-flag variant. PostHog's getFeatureFlag is sync once flags
  // are loaded; we read it lazily and cache.
  // Also detect if user is in trial — switches the entire reason set + offers.
  useEffect(() => {
    capture(EVENTS.CANCEL_FLOW_STARTED);
    try {
      const v = posthog?.getFeatureFlag?.('cancel_flow_variant');
      if (typeof v === 'string') {
        variantRef.current = v;
        capture(EVENTS.CANCEL_VARIANT_ASSIGNED, { variant: v });
      }
    } catch {}
    (async () => {
      try {
        const customerInfo = await RevenueCatService.getCustomerInfo();
        const entitlement = customerInfo?.entitlements?.active?.['Celestia Pro'];
        const trial = entitlement?.periodType === 'TRIAL';
        setIsTrial(trial);
        capture(EVENTS.CANCEL_FLOW_VARIANT_DETECTED, { is_trial: trial });
      } catch {}
    })();
  }, []);

  // If user closes the screen mid-flow, mark abandoned
  useEffect(() => {
    return () => {
      if (!flowFinalizedRef.current) {
        capture(EVENTS.CANCEL_FLOW_ABANDONED, { last_step: step, reason: selectedReason });
      }
    };
  }, [step, selectedReason]);

  const handleReasonSelect = (reasonId) => {
    haptic.light();
    setSelectedReason(reasonId);
    capture(EVENTS.CANCEL_REASON_SELECTED, { reason: reasonId, variant: variantRef.current, is_trial: isTrial });
    setStep(STEPS.SAVE);
    capture(EVENTS.CANCEL_SAVE_OFFER_SHOWN, { reason: reasonId, variant: variantRef.current, is_trial: isTrial });
  };

  const handleAcceptSaveOffer = () => {
    haptic.success();
    flowFinalizedRef.current = true;
    capture(EVENTS.CANCEL_SAVE_OFFER_ACCEPTED, { reason: selectedReason, variant: variantRef.current });
    navigation.goBack();
  };

  const handleDeclineSaveOffer = () => {
    haptic.medium();
    capture(EVENTS.CANCEL_SAVE_OFFER_DECLINED, { reason: selectedReason, variant: variantRef.current });
    setStep(STEPS.CONFIRM);
  };

  const handleConfirmCancel = async () => {
    haptic.medium();
    flowFinalizedRef.current = true;
    capture(EVENTS.CANCEL_CONFIRMED, { reason: selectedReason, variant: variantRef.current });
    // Deep-link to iOS subscription management. Android: Google Play.
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('itms-apps://apps.apple.com/account/subscriptions');
      } else {
        await Linking.openURL('https://play.google.com/store/account/subscriptions');
      }
    } catch {}
    navigation.goBack();
  };

  const offer = selectedReason ? pickOffer(selectedReason, variantRef.current, isTrial) : null;
  const reasonSet = isTrial ? TRIAL_REASONS : REASONS;

  // ── Render ──
  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Text style={[styles.closeTxt, { color: colors.textSecondary }]}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.heading }]}>
          {step === STEPS.SURVEY
            ? (isTrial ? 'Cancel trial' : 'We\'re sorry to see you go')
            : step === STEPS.SAVE ? 'One thing first' : (isTrial ? 'Cancel trial' : 'Confirm cancellation')}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === STEPS.SURVEY && (
          <>
            <Text style={[styles.h1, { color: colors.heading }]}>What's the main reason?</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>One question — your answer helps us improve.</Text>
            <View style={{ marginTop: 18, gap: 8 }}>
              {reasonSet.map(r => (
                <TouchableOpacity
                  key={r.id}
                  activeOpacity={0.7}
                  onPress={() => handleReasonSelect(r.id)}
                  style={[styles.reasonRow, { borderColor: colors.border, backgroundColor: colors.card }]}
                >
                  <Text style={[styles.reasonText, { color: colors.text }]}>{r.label}</Text>
                  <Text style={[styles.reasonChev, { color: colors.textSecondary }]}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={{ marginTop: 22, padding: 12 }}>
              <Text style={{ textAlign: 'center', fontSize: 13, color: T.gold, fontFamily: FONTS.sansMedium }}>
                Never mind, keep my subscription
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === STEPS.SAVE && offer && (
          <>
            <Text style={[styles.h1, { color: colors.heading }]}>{offer.headline}</Text>
            <Text style={[styles.bodyTxt, { color: colors.textSecondary }]}>{offer.body}</Text>

            {/* Social-proof retention stat — flag-gated. Flip the flag in
                PostHog with payload like { stat: '67', tenure: '14_day' }
                once N≥1000 paid members have ≥6 months of tenure. */}
            {(() => {
              const sproofFlag = getFeatureFlag('cancel_save_social_proof', null);
              if (!sproofFlag?.stat) return null;
              return (
                <View style={[styles.socialProofCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Text style={[styles.socialProofText, { color: colors.text }]}>
                    Members who used Pro for 14+ days have a {sproofFlag.stat}% retention rate at month 6.
                  </Text>
                </View>
              );
            })()}

            {stickyCounts && (
              <View style={[styles.statCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>WHAT YOU'VE BUILT</Text>
                <View style={styles.statGrid}>
                  <View style={styles.statCell}>
                    <Text style={[styles.statNum, { color: colors.heading }]}>{stickyCounts.daysWithUs}</Text>
                    <Text style={[styles.statSub, { color: colors.textSecondary }]}>days with us</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={[styles.statNum, { color: colors.heading }]}>{stickyCounts.journalCount}</Text>
                    <Text style={[styles.statSub, { color: colors.textSecondary }]}>journals</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={[styles.statNum, { color: colors.heading }]}>{stickyCounts.chatCount}</Text>
                    <Text style={[styles.statSub, { color: colors.textSecondary }]}>chats saved</Text>
                  </View>
                  <View style={styles.statCell}>
                    <Text style={[styles.statNum, { color: colors.heading }]}>{stickyCounts.partnerCount}</Text>
                    <Text style={[styles.statSub, { color: colors.textSecondary }]}>in your Circle</Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity activeOpacity={0.85} onPress={handleAcceptSaveOffer} style={{ marginTop: 24 }}>
              <LinearGradient colors={['#E2C46A', '#C8A84B', '#A07820']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                <Text style={styles.ctaText}>{offer.primaryCta}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={handleDeclineSaveOffer} style={{ marginTop: 14, padding: 10 }}>
              <Text style={{ textAlign: 'center', fontSize: 13, color: colors.textSecondary }}>{offer.declineCta}</Text>
            </TouchableOpacity>
          </>
        )}

        {step === STEPS.CONFIRM && (
          <>
            <Text style={[styles.h1, { color: colors.heading }]}>Your data stays</Text>
            <Text style={[styles.bodyTxt, { color: colors.textSecondary }]}>
              {isTrial
                ? 'Cancelling your trial doesn\'t delete anything. Your chart, journals, Circle entries, badges, and streak history all stay exactly where they are.'
                : 'Cancelling Pro doesn\'t delete anything. Your chart, journals, Circle entries, badges, and streak history all stay exactly where they are.'}
            </Text>
            <Text style={[styles.bodyTxt, { color: colors.textSecondary, marginTop: 14 }]}>
              {isTrial
                ? 'You\'ll keep full access until your trial ends — no charge if you cancel before then.'
                : 'You\'ll keep full access until the end of your billing period. Sign back in any time and pick up where you left off.'}
            </Text>

            <View style={[styles.confirmCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.confirmText, { color: colors.text }]}>
                On the next screen, {Platform.OS === 'ios' ? 'iOS' : 'Google Play'} settings will open. Tap your Celestia subscription, then "Cancel".
              </Text>
            </View>

            <TouchableOpacity activeOpacity={0.85} onPress={handleConfirmCancel} style={{ marginTop: 22 }}>
              <View style={[styles.cta, { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border }]}>
                <Text style={[styles.ctaText, { color: colors.text }]}>Continue to subscription settings</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.goBack()} style={{ marginTop: 14, padding: 10 }}>
              <Text style={{ textAlign: 'center', fontSize: 13, color: T.gold, fontFamily: FONTS.sansMedium }}>
                Keep my subscription
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 22, fontWeight: '300' },
  headerTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 14 },
  scroll: { padding: 22, paddingBottom: 60 },
  h1: { fontFamily: FONTS.serif, fontSize: 26, lineHeight: 32, marginBottom: 8, marginTop: 12 },
  sub: { fontSize: 14, lineHeight: 20 },
  bodyTxt: { fontSize: 14, lineHeight: 22, marginTop: 8 },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 16,
  },
  reasonText: { fontSize: 14, fontFamily: FONTS.sansMedium, flex: 1 },
  reasonChev: { fontSize: 18, marginLeft: 8 },
  statCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 22 },
  socialProofCard: { borderRadius: 12, borderWidth: 1, borderLeftWidth: 3, borderLeftColor: T.gold, padding: 14, marginTop: 16 },
  socialProofText: { fontSize: 13, fontFamily: FONTS.serif, fontStyle: 'italic', lineHeight: 18 },
  statLabel: { fontSize: 10, letterSpacing: 1.6, fontFamily: FONTS.sansSemiBold, marginBottom: 12, textTransform: 'uppercase' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCell: { width: '50%', paddingVertical: 6 },
  statNum: { fontFamily: FONTS.serif, fontSize: 22, lineHeight: 26 },
  statSub: { fontSize: 11, marginTop: 2 },
  confirmCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 18 },
  confirmText: { fontSize: 13, lineHeight: 19 },
  cta: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: T.navy },
});
