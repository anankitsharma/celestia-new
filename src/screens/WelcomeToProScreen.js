import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Easing,
  Platform, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics, EVENTS, getFeatureFlag } from '../services/analytics';
import { haptic } from '../services/hapticService';
import { RevenueCatService } from '../services/revenueCatService';
import Stars from '../components/Stars';
import Button from '../components/Button';
import PressableCard from '../components/PressableCard';

// Replaces the post-purchase native Alert. Shown right after PURCHASE_COMPLETED.
// Goal: convert "I subscribed" → "I tried 3 paid features in the first session"
// by giving the user one-tap paths INTO the most valuable Pro unlocks instead
// of dropping them back to the screen they came from.

const HERO_CARDS = [
  {
    id: 'weekly_report',
    icon: '✦',
    title: 'Generate your weekly chart reading',
    subtitle: 'Your transits for the next 7 days, written for your chart.',
    nav: { stack: 'Main', screen: 'Reports' },
  },
  {
    id: 'circle',
    icon: '♡',
    title: 'Add the people who matter to your Circle',
    subtitle: 'Up to 3 partners is free. Pro is unlimited — start with your closest 5.',
    nav: { stack: 'Main', screen: 'Circle' },
  },
  {
    id: 'chat',
    icon: '💬',
    title: 'Ask Celestia anything — no daily limit',
    subtitle: 'The cap is gone. Sit with a real question for a while.',
    nav: { stack: 'Main', screen: 'AskAI' },
  },
];

export default function WelcomeToProScreen({ navigation, route }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { capture } = useAnalytics();

  const firstTime = !!route?.params?.firstTime;
  const iconScale = useRef(new Animated.Value(0.8)).current;
  const iconShimmer = useRef(new Animated.Value(0)).current;
  const cardsFade = useRef(new Animated.Value(0)).current;
  const [trialLengthDays, setTrialLengthDays] = useState(null);

  useEffect(() => {
    capture(EVENTS.WELCOME_TO_PRO_SHOWN, { first_time: firstTime });
    try { haptic.success(); } catch {}
    RevenueCatService.getCustomerInfo()
      .then((info) => {
        const days = RevenueCatService.getTrialLengthDays(info);
        setTrialLengthDays(days);
      })
      .catch(() => {});
    Animated.parallel([
      Animated.spring(iconScale, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }),
      Animated.timing(cardsFade, { toValue: 1, duration: 600, delay: 250, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(iconShimmer, { toValue: 1, duration: 900, delay: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(iconShimmer, { toValue: 0, duration: 1400, easing: Easing.in(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, []);

  const trialSubLine = trialLengthDays === 3
    ? "You've got 3 days. Pick the one read that matters most."
    : trialLengthDays === 7
    ? "You've got 7 days. Most members find their first read in the first 24 hours."
    : null;

  // Social-proof subtext per hero card — flag-gated.
  // Flip the flag in PostHog with payload like:
  //   { weekly_report: "Most Pros generate their first weekly read in 24 hours.",
  //     circle: "Most Pros add their first partner within week 1.",
  //     chat: "Most Pros ask their first question within an hour." }
  // Until then this stays silent.
  const socialProofByCard = getFeatureFlag('welcome_to_pro_social_proof', null) || {};

  // First-time purchasers without an account: route through Auth before opening
  // the feature, so they don't lose access if they reinstall. Same protection
  // PaywallScreen used to do via Alert.
  const goToFeature = (card) => {
    haptic.light();
    capture(EVENTS.WELCOME_TO_PRO_CARD_TAPPED, { card: card.id, first_time: firstTime });
    if (firstTime && !user) {
      navigation.replace('Auth', { mode: 'pro_purchase', returnTo: card.nav });
      return;
    }
    if (card.nav.stack === 'Main') {
      navigation.replace('Main', { screen: card.nav.screen });
    } else {
      navigation.replace(card.nav.screen);
    }
  };

  const exploreOnOwn = () => {
    haptic.light();
    capture(EVENTS.WELCOME_TO_PRO_DISMISSED, { first_time: firstTime });
    if (firstTime && !user) {
      navigation.replace('Auth', { mode: 'pro_purchase' });
      return;
    }
    navigation.replace('Main', { screen: 'Today' });
  };

  return (
    <LinearGradient colors={['#5A2840', '#3A1A28', '#1F0F18']} locations={[0, 0.5, 1]} style={styles.container}>
      <Stars count={28} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.iconWrap}>
          <Animated.Text style={[styles.icon, { transform: [{ scale: iconScale }] }]}>✦</Animated.Text>
          <Animated.View pointerEvents="none" style={[styles.iconHalo, { opacity: iconShimmer }]} />
        </View>

        <Text style={styles.kicker}>WELCOME TO PRO</Text>
        <Text style={styles.headline}>You've unlocked everything.</Text>
        {trialSubLine && <Text style={styles.trialSub}>{trialSubLine}</Text>}
        <Text style={styles.sub}>Three places to start:</Text>

        <Animated.View style={{ width: '100%', opacity: cardsFade }}>
          {HERO_CARDS.map((card) => (
            <PressableCard
              key={card.id}
              onPress={() => goToFeature(card)}
              style={styles.heroCard}
              pressScale={0.98}
            >
              <Text style={styles.heroIcon}>{card.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>{card.title}</Text>
                <Text style={styles.heroSub}>{card.subtitle}</Text>
                {socialProofByCard[card.id] && (
                  <Text style={styles.heroSocialProof}>{socialProofByCard[card.id]}</Text>
                )}
              </View>
              <Text style={styles.heroChev}>→</Text>
            </PressableCard>
          ))}
        </Animated.View>

        <Text style={styles.unityLine}>For people who do their inner work.</Text>

        <Button
          label="I'll explore on my own →"
          variant="ghost"
          size="sm"
          onPress={exploreOnOwn}
          style={{ marginTop: 22 }}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: Platform.OS === 'ios' ? 80 : (StatusBar.currentHeight || 24) + 40, paddingHorizontal: 22, paddingBottom: 50, alignItems: 'center' },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 18, position: 'relative',
  },
  icon: { fontSize: 38, color: T.gold },
  iconHalo: {
    position: 'absolute',
    top: -8, left: -8, right: -8, bottom: -8,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: 'rgba(200,168,75,0.55)',
    shadowColor: T.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
  },
  kicker: { fontSize: 11, letterSpacing: 2, fontFamily: FONTS.sansSemiBold, color: T.gold, marginBottom: 12, textTransform: 'uppercase' },
  headline: { fontFamily: FONTS.serif, fontSize: 28, color: T.cream, textAlign: 'center', lineHeight: 34, marginBottom: 8 },
  trialSub: { fontSize: 13, color: T.gold, textAlign: 'center', marginBottom: 14, fontFamily: FONTS.sansMedium, paddingHorizontal: 8 },
  sub: { fontSize: 14, color: 'rgba(250,248,242,0.55)', textAlign: 'center', marginBottom: 28 },

  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(200,168,75,0.07)',
    borderWidth: 1, borderColor: 'rgba(200,168,75,0.22)',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    gap: 14,
  },
  heroIcon: { fontSize: 22, color: T.gold, width: 28, textAlign: 'center' },
  heroTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 14, color: T.cream, marginBottom: 4, lineHeight: 19 },
  heroSub: { fontSize: 12, color: 'rgba(250,248,242,0.58)', lineHeight: 17 },
  heroSocialProof: { fontSize: 11, color: 'rgba(200,168,75,0.75)', lineHeight: 15, marginTop: 6, fontStyle: 'italic' },
  heroChev: { fontSize: 18, color: T.gold, marginLeft: 6 },
  unityLine: { fontSize: 13, fontFamily: FONTS.serif, fontStyle: 'italic', color: 'rgba(250,248,242,0.55)', textAlign: 'center', marginTop: 10 },

  dismissBtn: { marginTop: 22, padding: 12 },
  dismissText: { fontSize: 13, color: 'rgba(250,248,242,0.45)', textAlign: 'center', fontFamily: FONTS.sansLight },
});
