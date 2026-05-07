// LifeAreaDetailScreen — full deep-dive view for a single life area
// (love / career / vitality / growth / social).
//
// Pushed from HomeScreenV2 when user taps "Read more" on a life-area card.
// Ports the rich content sections from V1's LIFE_AREA_DEEP_DIVE_MODAL but
// presents them as a dedicated stack screen with V2's visual language.
//
// Route params:
//   areaKey: 'love' | 'career' | 'vitality' | 'growth' | 'social'
//   areaData: forecast.lifeAreas[areaKey]    (the rich AI-generated payload)
//   forecast: full forecast object           (for related love/career fields)

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

// Per-area metadata (mirrors HomeScreenV2's LIFE_AREA_META).
const META = {
  love:     { tag: 'LOVE',      icon: '♡', title: 'Love & Relationships', sub: 'Intimacy · Romance · Self-Love',     color: '#C97D62' },
  career:   { tag: 'CAREER',    icon: '◆', title: 'Career & Finances',    sub: 'Work · Ambition · Wealth',           color: '#7E8BA6' },
  vitality: { tag: 'VITALITY',  icon: '✦', title: 'Vitality & Wellness',  sub: 'Energy · Health · Rhythm',           color: '#7E9576' },
  growth:   { tag: 'GROWTH',    icon: '◎', title: 'Growth & Inner Work',  sub: 'Learning · Wisdom · Transformation', color: '#C9A063' },
  social:   { tag: 'SOCIAL',    icon: '✧', title: 'Social & Community',   sub: 'Connection · Communication',         color: '#9C82A8' },
};

// Per-area gradient — mirrors HomeScreenV2's SLOT_GRADIENTS so the detail
// screen visually continues the card the user just tapped (cream-dominant
// with a slot-tinted top wash, not a saturated banner).
const HERO_GRADIENTS_LIGHT = {
  love:     ['#FBE5DD', '#FBF1EC', '#FAF6EE'],
  career:   ['#E6EAF2', '#F4F6F9', '#FAF6EE'],
  vitality: ['#E5F0DC', '#F4F8EE', '#FAF6EE'],
  growth:   ['#FBE3B5', '#FAF1DC', '#FAF6EE'],
  social:   ['#EDE0F0', '#F8F2FA', '#FAF6EE'],
};
const HERO_GRADIENTS_DARK = {
  love:     ['#7A2A40', '#5A2840', '#1F0F18'],
  career:   ['#2A2A40', '#3A1A28', '#1F0F18'],
  vitality: ['#2A3828', '#3A1A28', '#1F0F18'],
  growth:   ['#3A2818', '#3A1A28', '#1F0F18'],
  social:   ['#3A2840', '#3A1A28', '#1F0F18'],
};

const CTA_GRADIENT = ['#FED9B8', '#E3CDF0', '#D8C7FF'];

const ASK_PROMPTS = {
  love:     'Tell me more about my love and relationship energy today. What should I focus on?',
  career:   'What does my chart say about career opportunities right now?',
  vitality: 'How should I manage my energy and wellness today?',
  growth:   'What growth lessons is the universe showing me right now?',
  social:   'Tell me about my social and communication energy today.',
};

const formatDate = (date = new Date()) => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${days[date.getDay()]} · ${months[date.getMonth()]} ${date.getDate()}`;
};

export default function LifeAreaDetailScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { areaKey, areaData, forecast } = route.params || {};

  const meta = META[areaKey];
  if (!meta) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Text style={{ color: colors.heading }}>No data for this area.</Text>
        <TouchableOpacity style={styles.backFallback} onPress={() => navigation.goBack()}>
          <Text style={{ color: T.clay }}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const gradient = isDark ? HERO_GRADIENTS_DARK[areaKey] : HERO_GRADIENTS_LIGHT[areaKey];
  const heroFg = isDark ? T.cream : '#1A1410';
  const heroFgMuted = isDark ? 'rgba(250,248,242,0.65)' : 'rgba(26,20,16,0.62)';
  const heroFgSoft = isDark ? 'rgba(250,248,242,0.45)' : 'rgba(26,20,16,0.45)';
  const intensity = Math.min(10, Math.max(1, areaData?.intensity || 3));

  // Related top-level data for love/career
  const relatedHoroscope = areaKey === 'love' ? forecast?.loveHoroscope
    : areaKey === 'career' ? forecast?.careerHoroscope : null;
  const relatedActions = areaKey === 'love' ? forecast?.loveActions
    : areaKey === 'career' ? forecast?.careerActions : null;
  const relatedVibe = areaKey === 'love' ? forecast?.loveVibe
    : areaKey === 'career' ? forecast?.careerVibe : null;
  const careerPower = areaKey === 'career' ? forecast?.careerPowerSource : null;
  const wealthFlow = areaKey === 'career' ? forecast?.wealthFlow : null;
  const marketTiming = areaKey === 'career' ? forecast?.marketTiming : null;

  const fullReading = areaData?.horoscope || areaData?.fullHoroscope || relatedHoroscope || '';
  const doItems = Array.isArray(areaData?.doItems) ? areaData.doItems : [];
  const avoidItems = Array.isArray(areaData?.avoidItems) ? areaData.avoidItems : [];
  const filteredAvoid = avoidItems.filter(it => !((typeof it === 'string' ? it : it?.action || '').includes?.('Steady skies')));

  const onShare = async () => {
    haptic.light();
    const headline = areaData?.headline || areaData?.energy || meta.title;
    const reason = areaData?.planetaryReason || '';
    try {
      await Share.share({
        message: `${meta.tag} · ${headline}\n\n${reason}\n\n— Celestia`,
      });
    } catch (e) {}
  };

  const onAsk = () => {
    haptic.light();
    const msg = ASK_PROMPTS[areaKey] || `Tell me more about my ${meta.title.toLowerCase()} today.`;
    navigation.navigate('AskAI', { seedPrompt: msg });
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

          {/* Motif badge — solid white on cream (matches card pattern) */}
          <View style={[
            styles.motifBadge,
            {
              backgroundColor: isDark ? 'rgba(250,248,242,0.10)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(250,248,242,0.16)' : 'rgba(26,20,16,0.06)',
            },
          ]}>
            <CelestiaMotif kind={areaKey} size={48} color={heroFg} />
          </View>

          {/* Tag pill — peach treatment matches card's tagPillAnchor */}
          <View style={[
            styles.tagPill,
            {
              backgroundColor: isDark ? 'rgba(254,217,184,0.20)' : 'rgba(254,217,184,0.5)',
              borderColor: isDark ? 'rgba(254,217,184,0.35)' : '#FED9B8',
            },
          ]}>
            <Text style={[styles.tagLabel, { color: heroFg }]}>{meta.tag}</Text>
          </View>

          <Text style={[styles.heroTitle, { color: heroFg }]}>{meta.title}</Text>
          <Text style={[styles.heroSub, { color: heroFgMuted }]}>{meta.sub}</Text>

          {/* Energy + Intensity */}
          {(areaData?.energy || areaData?.intensity) && (
            <View style={[
              styles.statCard,
              {
                backgroundColor: isDark ? 'rgba(250,248,242,0.08)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(250,248,242,0.12)' : 'rgba(26,20,16,0.06)',
              },
            ]}>
              {areaData?.energy && (
                <View style={[styles.energyPill, { backgroundColor: meta.color + '30' }]}>
                  <Text style={[styles.energyText, { color: heroFg }]}>{areaData.energy}</Text>
                </View>
              )}
              <View style={styles.intensityWrap}>
                <Text style={[styles.intensityLabel, { color: heroFgSoft }]}>INTENSITY</Text>
                <View style={styles.intensityDots}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.intensityDot,
                        {
                          backgroundColor: i < intensity
                            ? meta.color
                            : (isDark ? 'rgba(250,248,242,0.18)' : 'rgba(26,20,16,0.14)'),
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.intensityNum, { color: heroFg }]}>{intensity}/10</Text>
              </View>
            </View>
          )}

          {/* Planetary reason */}
          {!!areaData?.planetaryReason && (
            <Text style={[styles.heroReason, { color: heroFgMuted }]}>
              {areaData.planetaryReason}
            </Text>
          )}
        </LinearGradient>

        {/* ── BODY ───────────────────────────────────── */}
        <View style={styles.body}>

          {/* Full Reading */}
          {!!fullReading && (
            <Section label="THE READING" colors={colors}>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{fullReading}</Text>
              {!!relatedHoroscope && relatedHoroscope !== fullReading && (
                <Text style={[styles.bodyText, { color: colors.textSecondary, marginTop: 12 }]}>{relatedHoroscope}</Text>
              )}
            </Section>
          )}

          {/* Vibe (love/career only) — peach callout pull-quote */}
          {!!relatedVibe && (
            <View style={[
              styles.vibeBox,
              { backgroundColor: isDark ? colors.card : '#FBE6CC' },
            ]}>
              <Text style={[styles.vibeLabel, { color: '#C97D62' }]}>TODAY'S VIBE</Text>
              <Text style={[styles.vibeText, { color: colors.heading }]}>“{relatedVibe}”</Text>
            </View>
          )}

          {/* Navigate Toward */}
          {doItems.length > 0 && (
            <Section label="NAVIGATE TOWARD" colors={colors} accent={meta.color}>
              {doItems.map((item, i) => {
                const text = typeof item === 'string' ? item : (item?.action || '');
                return text ? (
                  <View key={i} style={styles.itemRow}>
                    <View style={[styles.itemDot, { backgroundColor: meta.color }]} />
                    <Text style={[styles.bodyText, { color: colors.text, flex: 1 }]}>{text}</Text>
                  </View>
                ) : null;
              })}
            </Section>
          )}

          {/* Related Actions */}
          {Array.isArray(relatedActions) && relatedActions.length > 0 && (
            <Section label="POWER ACTIONS" colors={colors} accent={meta.color}>
              {relatedActions.map((it, i) => {
                const text = typeof it === 'string' ? it : (it?.action || '');
                return text ? (
                  <View key={i} style={styles.itemRow}>
                    <Text style={[styles.itemArrow, { color: meta.color }]}>→</Text>
                    <Text style={[styles.bodyText, { color: colors.text, flex: 1 }]}>{text}</Text>
                  </View>
                ) : null;
              })}
            </Section>
          )}

          {/* Navigate Around */}
          {filteredAvoid.length > 0 && (
            <Section label="NAVIGATE AROUND" colors={colors} accent="#B85050">
              {filteredAvoid.map((item, i) => {
                const text = typeof item === 'string' ? item : (item?.action || '');
                return text ? (
                  <View key={i} style={styles.itemRow}>
                    <Text style={[styles.itemArrow, { color: '#B85050' }]}>⊘</Text>
                    <Text style={[styles.bodyText, { color: colors.textSecondary, flex: 1 }]}>{text}</Text>
                  </View>
                ) : null;
              })}
            </Section>
          )}

          {/* Career extras */}
          {(careerPower || wealthFlow || marketTiming) && (
            <View style={[styles.careerExtras, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {!!careerPower && (
                <View style={styles.careerRow}>
                  <Text style={[styles.careerLabel, { color: colors.textSecondary }]}>POWER SOURCE</Text>
                  <Text style={[styles.bodyText, { color: colors.text, marginTop: 4 }]}>{careerPower}</Text>
                </View>
              )}
              {!!wealthFlow && (
                <View style={styles.careerRow}>
                  <Text style={[styles.careerLabel, { color: colors.textSecondary }]}>WEALTH FLOW</Text>
                  <Text style={[styles.bodyText, { color: colors.text, marginTop: 4 }]}>{wealthFlow}</Text>
                </View>
              )}
              {!!marketTiming && (
                <View style={styles.careerRow}>
                  <Text style={[styles.careerLabel, { color: colors.textSecondary }]}>TIMING</Text>
                  <Text style={[styles.bodyText, { color: colors.text, marginTop: 4 }]}>{marketTiming}</Text>
                </View>
              )}
            </View>
          )}

          {/* Best Window */}
          {!!areaData?.timing && (
            <View style={[styles.timingBox, { backgroundColor: colors.cardAlt }]}>
              <Text style={styles.timingIcon}>◷</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>BEST WINDOW</Text>
                <Text style={[styles.bodyText, { color: colors.text, marginTop: 4 }]}>{areaData.timing}</Text>
              </View>
            </View>
          )}

          {/* Today's Practice / Ritual */}
          {!!areaData?.ritual && (
            <View style={[styles.ritualBox, { borderLeftColor: meta.color, backgroundColor: colors.cardAlt }]}>
              <Text style={[styles.sectionLabel, { color: meta.color }]}>TODAY'S PRACTICE</Text>
              <Text style={[styles.bodyText, { color: colors.text, marginTop: 6 }]}>{areaData.ritual}</Text>
            </View>
          )}

          {/* Affirmation */}
          {!!areaData?.affirmation && (
            <View style={[
              styles.affirmationBox,
              {
                backgroundColor: isDark ? colors.card : '#FBF9F3',
                borderColor: isDark ? colors.border : 'rgba(200,168,75,0.18)',
              },
            ]}>
              <Text style={[styles.affirmationText, { color: colors.heading }]}>
                "{areaData.affirmation}"
              </Text>
            </View>
          )}

          {/* Navigator Note */}
          {!!areaData?.navigatorNote && (
            <Text style={[styles.navNote, { color: colors.textSecondary }]}>
              — {areaData.navigatorNote}
            </Text>
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
            <Text style={styles.ctaText}>Ask about your {meta.tag.toLowerCase()} today  →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Section helper ────────────────────────────────────
function Section({ label, accent, colors, children }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: accent || colors.textSecondary }]}>{label}</Text>
      {children}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────
const TOP_PAD = Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + 10;
const BOTTOM_PAD = 100;

const styles = StyleSheet.create({
  page: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backFallback: { marginTop: 16 },
  scroll: { paddingBottom: BOTTOM_PAD + 28 },

  // Hero
  hero: {
    paddingTop: TOP_PAD,
    paddingHorizontal: 22,
    paddingBottom: 28,
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
    marginBottom: 18,
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
    marginBottom: 14,
  },
  tagLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10, letterSpacing: 2.5,
  },
  heroTitle: {
    fontFamily: FONTS.editorial,
    fontSize: 30, lineHeight: 36,
    textAlign: 'center', marginBottom: 6,
  },
  heroSub: {
    fontFamily: FONTS.sans,
    fontSize: 13, lineHeight: 19,
    textAlign: 'center', marginBottom: 18,
  },
  statCard: {
    width: '100%',
    padding: 14, borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  energyPill: {
    alignSelf: 'flex-start',
    paddingVertical: 4, paddingHorizontal: 12,
    borderRadius: 100,
    marginBottom: 10,
  },
  energyText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 11, letterSpacing: 1,
  },
  intensityWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  intensityLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 9, letterSpacing: 1.5,
  },
  intensityDots: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  intensityDot: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    maxWidth: 14,
  },
  intensityNum: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 11,
  },
  heroReason: {
    fontFamily: FONTS.sans,
    fontSize: 14, lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: 320,
  },

  // Body
  body: { padding: 20 },

  section: { marginBottom: 26 },
  sectionLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10, letterSpacing: 2,
    marginBottom: 10,
  },

  bodyText: {
    fontFamily: FONTS.sans,
    fontSize: 14, lineHeight: 23,
  },

  vibeBox: {
    paddingVertical: 20, paddingHorizontal: 22,
    borderRadius: 18,
    marginBottom: 26,
  },
  vibeLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10, letterSpacing: 2,
    marginBottom: 10,
  },
  vibeText: {
    fontFamily: FONTS.editorialItalic,
    fontSize: 17, lineHeight: 26,
  },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  itemDot: {
    width: 6, height: 6, borderRadius: 3,
    marginTop: 9,
  },
  itemArrow: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 14, minWidth: 16,
  },

  careerExtras: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 26,
  },
  careerRow: { marginBottom: 12 },
  careerLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10, letterSpacing: 1.8,
  },

  timingBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 26,
  },
  timingIcon: { fontSize: 20, color: T.brass, marginTop: 1 },

  ritualBox: {
    paddingVertical: 14, paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderRadius: 12,
    marginBottom: 26,
  },

  affirmationBox: {
    padding: 18, borderRadius: 14,
    borderWidth: 1,
    marginBottom: 26,
  },
  affirmationText: {
    fontFamily: FONTS.editorialItalic,
    fontSize: 16, lineHeight: 25,
    textAlign: 'center',
  },

  navNote: {
    fontFamily: FONTS.sans,
    fontSize: 13, lineHeight: 21,
    fontStyle: 'italic',
    marginBottom: 8,
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
