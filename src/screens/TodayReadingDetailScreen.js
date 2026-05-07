// TodayReadingDetailScreen — full deep-dive view for the daily Anchor card.
//
// Pushed from HomeScreenV2 when user taps "Read more" on the Anchor card.
// Shows the navigator headline + summary, full horoscope, navigate
// toward/around lists, mantra, and an "Ask about today" CTA.
//
// Route params:
//   forecast: full forecast object (or null — we render fallback)

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Share, Platform, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { haptic } from '../services/hapticService';
import CelestiaMotif from '../components/CelestiaMotif';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Hero gradient — mirrors HomeScreenV2's anchor card gradient so the detail
// screen visually continues the card the user just tapped (cream-dominant
// with a peach top wash, not a saturated banner).
const HERO_GRADIENT_LIGHT = ['#FFEFD9', '#FBF5EE', '#FAF6EE'];
const HERO_GRADIENT_DARK  = ['#7A2840', '#3A1A28', '#1F0F18'];

const CTA_GRADIENT = ['#FED9B8', '#E3CDF0', '#D8C7FF'];

const formatDate = (date = new Date()) => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${days[date.getDay()]} · ${months[date.getMonth()]} ${date.getDate()}`;
};

export default function TodayReadingDetailScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const forecast = route.params?.forecast || null;

  const gradient = isDark ? HERO_GRADIENT_DARK : HERO_GRADIENT_LIGHT;
  const heroFg = isDark ? T.cream : '#1A1410';
  const heroFgMuted = isDark ? 'rgba(250,248,242,0.65)' : 'rgba(26,20,16,0.62)';
  const heroFgSoft = isDark ? 'rgba(250,248,242,0.45)' : 'rgba(26,20,16,0.45)';

  const headline = forecast?.navigatorHeadline || "Today's reading is brewing.";
  const summary = forecast?.navigatorSummary || '';
  const fullReading = forecast?.detailedHoroscope || '';
  const navigateToward = Array.isArray(forecast?.navigateToward) ? forecast.navigateToward : [];
  const navigateAround = Array.isArray(forecast?.navigateAround) ? forecast.navigateAround : [];
  const mantra = forecast?.mantra || '';

  const onShare = async () => {
    haptic.light();
    try {
      await Share.share({
        message: `${headline}${summary ? `\n\n${summary}` : ''}\n\n— Celestia`,
      });
    } catch (e) {}
  };

  const onAsk = () => {
    haptic.light();
    navigation.navigate('AskAI', {
      seedPrompt: `About today: ${headline}`,
    });
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={true}>

        {/* ── HERO ───────────────────────────────────── */}
        <LinearGradient colors={gradient} locations={[0, 0.55, 1]} style={styles.hero}>
          {/* Sheen */}
          <LinearGradient
            colors={isDark
              ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)']
              : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
            locations={[0, 0.5]}
            style={styles.sheen}
            pointerEvents="none"
          />

          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(250,248,242,0.10)' : '#FFFFFF', borderColor: isDark ? 'transparent' : 'rgba(26,20,16,0.06)', borderWidth: isDark ? 0 : 1 }]}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
              <Text style={[styles.iconBtnText, { color: heroFg }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.dateLabel, { color: heroFgSoft }]}>{formatDate()}</Text>
            <TouchableOpacity
              onPress={onShare}
              style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(250,248,242,0.10)' : '#FFFFFF', borderColor: isDark ? 'transparent' : 'rgba(26,20,16,0.06)', borderWidth: isDark ? 0 : 1 }]}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
              <Text style={[styles.iconBtnText, { color: heroFg, fontSize: 16 }]}>↗</Text>
            </TouchableOpacity>
          </View>

          {/* Motif badge — solid white on cream (matches anchor card) */}
          <View style={[
            styles.motifBadge,
            {
              backgroundColor: isDark ? 'rgba(250,248,242,0.10)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(250,248,242,0.16)' : '#FED9B8',
            },
          ]}>
            <CelestiaMotif kind="today" size={48} color={heroFg} />
          </View>

          {/* Tag pill — peach treatment matches anchor card's tagPillAnchor */}
          <View style={[
            styles.tagPill,
            {
              backgroundColor: isDark ? 'rgba(254,217,184,0.20)' : 'rgba(254,217,184,0.5)',
              borderColor: isDark ? 'rgba(254,217,184,0.35)' : '#FED9B8',
            },
          ]}>
            <Text style={[styles.tagLabel, { color: heroFg }]}>TODAY</Text>
          </View>

          <Text style={[styles.heroTitle, { color: heroFg }]}>{headline}</Text>

          {!!summary && (
            <Text style={[styles.heroSub, { color: heroFgMuted }]}>{summary}</Text>
          )}
        </LinearGradient>

        {/* ── BODY ───────────────────────────────────── */}
        <View style={styles.body}>

          {/* Full reading */}
          {!!fullReading && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>THE READING</Text>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{fullReading}</Text>
            </View>
          )}

          {/* Navigate toward */}
          {navigateToward.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: T.brass }]}>NAVIGATE TOWARD</Text>
              {navigateToward.slice(0, 6).map((it, i) => {
                const text = typeof it === 'string' ? it : (it?.action || it?.text || '');
                const reason = typeof it === 'object' ? (it?.reason || '') : '';
                return text ? (
                  <View key={i} style={styles.itemRow}>
                    <Text style={[styles.itemNum, { color: T.brass }]}>{i + 1}.</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bodyText, { color: colors.text }]}>{text}</Text>
                      {!!reason && (
                        <Text style={[styles.itemReason, { color: colors.textMuted }]}>{reason}</Text>
                      )}
                    </View>
                  </View>
                ) : null;
              })}
            </View>
          )}

          {/* Navigate around */}
          {navigateAround.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: '#B85050' }]}>NAVIGATE AROUND</Text>
              {navigateAround.slice(0, 5).map((it, i) => {
                const text = typeof it === 'string' ? it : (it?.action || it?.text || '');
                const reason = typeof it === 'object' ? (it?.reason || '') : '';
                const alt = typeof it === 'object' ? (it?.alternative || '') : '';
                return text ? (
                  <View key={i} style={styles.itemRow}>
                    <Text style={[styles.itemArrow, { color: '#B85050' }]}>⊘</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{text}</Text>
                      {!!reason && (
                        <Text style={[styles.itemReason, { color: colors.textMuted }]}>{reason}</Text>
                      )}
                      {!!alt && (
                        <Text style={[styles.itemReason, { color: colors.textMuted, fontStyle: 'italic' }]}>
                          Try instead: {alt}
                        </Text>
                      )}
                    </View>
                  </View>
                ) : null;
              })}
            </View>
          )}

          {/* Mantra — pull-quote with curly quote marks */}
          {!!mantra && (
            <View style={[
              styles.mantraBox,
              {
                backgroundColor: isDark ? colors.card : '#FBE6CC',
                borderColor: isDark ? colors.border : 'rgba(216,140,106,0.25)',
              },
            ]}>
              <Text style={[styles.mantraLabel, { color: '#D88C6A' }]}>TODAY'S MANTRA</Text>
              <Text style={[styles.mantraQuoteOpen, { color: '#D88C6A' }]}>“</Text>
              <Text style={[styles.mantraText, { color: colors.heading }]}>{mantra}</Text>
              <Text style={[styles.mantraQuoteClose, { color: '#D88C6A' }]}>”</Text>
            </View>
          )}

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>

      {/* Bottom-fixed gradient CTA */}
      <View style={styles.ctaWrap} pointerEvents="box-none">
        <TouchableOpacity activeOpacity={0.85} onPress={onAsk} style={styles.ctaShadow}>
          <LinearGradient
            colors={CTA_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}>
            <Text style={styles.ctaText}>Ask Celestia about today  →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const TOP_PAD = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + 10;
const BOTTOM_PAD = 100;

const styles = StyleSheet.create({
  page: { flex: 1 },
  scroll: { paddingBottom: BOTTOM_PAD + 28 },

  hero: {
    paddingTop: TOP_PAD,
    paddingHorizontal: 22,
    paddingBottom: 34,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
  },
  sheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '50%',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnText: { fontSize: 20, fontFamily: FONTS.editorial },
  dateLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10, letterSpacing: 2.2,
  },
  motifBadge: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 6, marginBottom: 14,
  },
  motifGlyph: { fontSize: 30, lineHeight: 32 },
  tagPill: {
    paddingVertical: 5, paddingHorizontal: 14,
    borderRadius: 100, borderWidth: 1,
    marginBottom: 18,
  },
  tagLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10, letterSpacing: 2.5,
  },
  heroTitle: {
    fontFamily: FONTS.editorial,
    fontSize: 32, lineHeight: 40,
    textAlign: 'center', marginBottom: 14,
  },
  heroSub: {
    fontFamily: FONTS.sans,
    fontSize: 14, lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
    fontStyle: 'italic',
  },

  body: { padding: 20 },

  section: { marginBottom: 28 },
  sectionLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10, letterSpacing: 2,
    marginBottom: 12,
  },

  bodyText: {
    fontFamily: FONTS.sans,
    fontSize: 14, lineHeight: 23,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  itemNum: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 14, minWidth: 22,
  },
  itemArrow: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 14, minWidth: 18,
  },
  itemReason: {
    fontFamily: FONTS.sans,
    fontSize: 12, lineHeight: 19,
    marginTop: 4,
  },

  mantraBox: {
    padding: 24, borderRadius: 18,
    borderWidth: 1,
    marginBottom: 26,
    alignItems: 'center',
    position: 'relative',
  },
  mantraLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10, letterSpacing: 2,
    marginBottom: 14,
  },
  mantraQuoteOpen: {
    fontFamily: FONTS.editorial,
    fontSize: 56, lineHeight: 56,
    marginBottom: -8,
    opacity: 0.7,
  },
  mantraText: {
    fontFamily: FONTS.editorialItalic,
    fontSize: 19, lineHeight: 28,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  mantraQuoteClose: {
    fontFamily: FONTS.editorial,
    fontSize: 56, lineHeight: 56,
    marginTop: -10,
    opacity: 0.7,
  },

  // CTA
  ctaWrap: {
    position: 'absolute',
    left: 22, right: 22,
    bottom: Platform.OS === 'ios' ? 30 : 22,
    alignItems: 'center',
  },
  ctaShadow: {
    width: '100%',
    borderRadius: 100,
    shadowColor: '#5C2434',
    shadowOpacity: 0.30,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  ctaGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 14, letterSpacing: 0.4,
    color: '#3A1A28',
  },
});
