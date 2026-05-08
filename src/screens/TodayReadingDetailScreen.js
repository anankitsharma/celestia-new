// TodayReadingDetailScreen — full deep-dive view for the daily Anchor card.
//
// Pushed from HomeScreenV2 when user taps "Read more" on the Anchor card.
// Shows the navigator headline + summary, full horoscope, navigate
// toward/around lists, mantra, and an "Ask about today" CTA.
//
// Route params:
//   forecast: full forecast object (or null — we render fallback)

import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Share, Platform, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { haptic } from '../services/hapticService';
import { getMoonDataForDate } from '../services/astrologyService';
import CelestiaMotif from '../components/CelestiaMotif';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Hero gradient — mirrors HomeScreenV2's anchor card gradient so the detail
// screen visually continues the card the user just tapped (cream-dominant
// with a peach top wash, not a saturated banner).
const HERO_GRADIENT_LIGHT = ['#FFEFD9', '#FBF5EE', '#FAF6EE'];
const HERO_GRADIENT_DARK  = ['#7A2840', '#3A1A28', '#1F0F18'];

const CTA_GRADIENT = ['#FED9B8', '#E3CDF0', '#D8C7FF'];

const SHORT_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const SHORT_MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const LONG_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const LONG_MONTHS_TITLE = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const LONG_MONTHS = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

// Magazine-style long date — "Thursday, May 7" — used in hero on today period.
const formatLongDate = (date = new Date()) =>
  `${LONG_DAYS[date.getDay()]}, ${LONG_MONTHS_TITLE[date.getMonth()]} ${date.getDate()}`;

const weekStartMonday = (date) => {
  const d = new Date(date);
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d;
};

const formatDate = (date = new Date(), period = 'today') => {
  if (period === 'weekly') {
    const ws = weekStartMonday(date);
    return `WEEK OF ${SHORT_MONTHS[ws.getMonth()]} ${ws.getDate()}`;
  }
  if (period === 'monthly') {
    return `${LONG_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }
  return `${SHORT_DAYS[date.getDay()]} · ${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
};

const PERIOD_LABEL = { today: 'TODAY', weekly: 'THIS WEEK', monthly: 'THIS MONTH' };
const PERIOD_LOWER = { today: 'today', weekly: 'this week', monthly: 'this month' };

export default function TodayReadingDetailScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const forecast = route.params?.forecast || null;
  const period = route.params?.period || 'today';
  const periodTag = PERIOD_LABEL[period] || 'TODAY';
  const periodLower = PERIOD_LOWER[period] || 'today';

  const gradient = isDark ? HERO_GRADIENT_DARK : HERO_GRADIENT_LIGHT;
  const heroFg = isDark ? T.cream : '#1A1410';
  const heroFgMuted = isDark ? 'rgba(250,248,242,0.65)' : 'rgba(26,20,16,0.62)';
  const heroFgSoft = isDark ? 'rgba(250,248,242,0.45)' : 'rgba(26,20,16,0.45)';

  const fallbackHeadline = period === 'weekly'
    ? "This week's reading is brewing."
    : period === 'monthly'
      ? "This month's reading is brewing."
      : "Today's reading is brewing.";
  const headline = forecast?.navigatorHeadline || fallbackHeadline;
  const summary = forecast?.navigatorSummary || '';
  const fullReading = forecast?.detailedHoroscope || '';
  const navigateToward = Array.isArray(forecast?.navigateToward) ? forecast.navigateToward : [];
  const navigateAround = Array.isArray(forecast?.navigateAround) ? forecast.navigateAround : [];
  const mantra = forecast?.mantra || '';
  const powerCosmic = forecast?.powerCosmic || '';
  const luckyStats = forecast?.luckyStats || null;
  const dailyRitual = forecast?.dailyRitual || '';
  const viralInsight = forecast?.viralInsight || '';
  const planetInfluences = Array.isArray(forecast?.planetInfluences) ? forecast.planetInfluences : [];
  const actionItems = Array.isArray(forecast?.actionItems) ? forecast.actionItems : [];

  // Moon data — computed locally so we don't bloat route params.
  const moonData = useMemo(() => {
    try { return getMoonDataForDate(new Date()); } catch (e) { return null; }
  }, []);
  const moonPhase = moonData?.phaseName || '';
  const moonSign = moonData?.sign || '';
  const moonGlyph = moonData?.phaseEmoji || '☽';

  // Paragraph labels per period — V1 splits detailedHoroscope on \n\n and
  // labels each block. The AI prompt is structured around these labels.
  const PARA_LABELS = period === 'weekly'
    ? ['THE WEEKLY ARC', 'EARLY WEEK', 'MID-WEEK SHIFT', 'THE WEEKEND']
    : period === 'monthly'
      ? ['THE THEME', 'FIRST HALF', 'SECOND HALF', 'POWER DATES']
      : ['COSMIC CLIMATE', 'PERSONAL IMPACT', 'THE CHALLENGE', 'THE GUIDANCE'];
  const paragraphs = fullReading.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);

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
    const lead = period === 'weekly' ? 'About this week' : period === 'monthly' ? 'About this month' : 'About today';
    navigation.navigate('AskAI', {
      seedPrompt: `${lead}: ${headline}`,
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
            <Text style={[styles.dateLabel, { color: heroFgSoft }]}>{formatDate(new Date(), period)}</Text>
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
            <Text style={[styles.tagLabel, { color: heroFg }]}>{periodTag}</Text>
          </View>

          {/* Magazine-style long date — only on today period */}
          {period === 'today' && (
            <Text style={[styles.heroLongDate, { color: heroFgMuted }]}>{formatLongDate()}</Text>
          )}

          <Text style={[styles.heroTitle, { color: heroFg }]}>{headline}</Text>

          {!!summary && (
            <Text style={[styles.heroSub, { color: heroFgMuted }]}>{summary}</Text>
          )}

          {/* Glance chips — Moon + Power */}
          {(moonPhase || powerCosmic) && (
            <View style={styles.glanceRow}>
              {!!moonPhase && (
                <View style={[styles.glanceChip, { backgroundColor: isDark ? 'rgba(250,248,242,0.08)' : '#FFFFFF', borderColor: isDark ? 'rgba(250,248,242,0.14)' : 'rgba(26,20,16,0.06)' }]}>
                  <Text style={[styles.glanceText, { color: heroFg }]} numberOfLines={1}>
                    {moonGlyph} {moonPhase}{moonSign ? ` · ${moonSign}` : ''}
                  </Text>
                </View>
              )}
              {!!powerCosmic && (
                <View style={[styles.glanceChip, { backgroundColor: isDark ? 'rgba(254,217,184,0.18)' : 'rgba(254,217,184,0.45)', borderColor: isDark ? 'rgba(254,217,184,0.35)' : '#FED9B8' }]}>
                  <Text style={[styles.glanceText, { color: heroFg }]} numberOfLines={1}>✦ {powerCosmic}</Text>
                </View>
              )}
            </View>
          )}
        </LinearGradient>

        {/* ── BODY ───────────────────────────────────── */}
        <View style={styles.body}>

          {/* Full reading — split into labeled paragraphs (period-aware) */}
          {paragraphs.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>THE READING</Text>
              {paragraphs.map((p, i) => (
                <View key={i} style={styles.paraBlock}>
                  {(PARA_LABELS[i] || (paragraphs.length > 4 ? `PART ${i + 1}` : null)) && (
                    <Text style={[styles.paraLabel, { color: T.brass }]}>
                      {PARA_LABELS[i] || `PART ${i + 1}`}
                    </Text>
                  )}
                  <Text style={[styles.bodyText, { color: colors.text }]}>{p}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Planet influences — "WHAT'S DRIVING TODAY" */}
          {planetInfluences.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>WHAT'S DRIVING {periodTag}</Text>
              {planetInfluences.map((inf, i) => (
                <View key={i} style={[styles.influenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.influenceGlyph, { color: T.brass }]}>{inf.glyph || '✦'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.influenceTag, { color: colors.heading }]}>{inf.tag}</Text>
                    {!!inf.effect && (
                      <Text style={[styles.bodyText, { color: colors.textSecondary, marginTop: 2 }]}>{inf.effect}</Text>
                    )}
                  </View>
                </View>
              ))}
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

          {/* Power moves — numbered actionItems */}
          {actionItems.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>POWER MOVES</Text>
              <View style={[styles.powerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {actionItems.map((it, i) => {
                  const text = typeof it === 'string' ? it : (it?.action || it?.text || '');
                  return text ? (
                    <View key={i} style={[styles.itemRow, i < actionItems.length - 1 && styles.powerRowDivider]}>
                      <View style={[styles.powerNum, { backgroundColor: T.brass + '20', borderColor: T.brass + '40' }]}>
                        <Text style={[styles.powerNumText, { color: T.brass }]}>{i + 1}</Text>
                      </View>
                      <Text style={[styles.bodyText, { color: colors.text, flex: 1, paddingTop: 4 }]}>{text}</Text>
                    </View>
                  ) : null;
                })}
              </View>
            </View>
          )}

          {/* Daily ritual — period-aware label */}
          {!!dailyRitual && (
            <View style={[styles.ritualBox, { backgroundColor: isDark ? colors.card : '#F8F0E8', borderLeftColor: T.brass }]}>
              <Text style={[styles.ritualLabel, { color: T.brass }]}>
                {period === 'weekly' ? "THIS WEEK'S RITUAL" : period === 'monthly' ? "THIS MONTH'S RITUAL" : "TODAY'S RITUAL"}
              </Text>
              <Text style={[styles.bodyText, { color: colors.text, marginTop: 6 }]}>✧ {dailyRitual}</Text>
            </View>
          )}

          {/* Cosmic stats — Moon, Energy, Power Number, Power Color, Crystal */}
          {(moonPhase || powerCosmic || luckyStats) && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>COSMIC STATS</Text>
              <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {!!moonPhase && (
                  <View style={styles.statRow}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Moon</Text>
                    <Text style={[styles.statValue, { color: colors.heading }]}>
                      {moonGlyph} {moonPhase}{moonSign ? ` in ${moonSign}` : ''}
                    </Text>
                  </View>
                )}
                {!!powerCosmic && (
                  <>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Energy</Text>
                      <Text style={[styles.statValue, { color: colors.heading }]}>{powerCosmic}</Text>
                    </View>
                  </>
                )}
                {luckyStats?.number != null && (
                  <>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Power Number</Text>
                      <Text style={[styles.statValue, { color: colors.heading, fontFamily: FONTS.editorial, fontSize: 18 }]}>{luckyStats.number}</Text>
                    </View>
                  </>
                )}
                {!!luckyStats?.color && (
                  <>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Power Color</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {!!luckyStats.colorHex && (
                          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: luckyStats.colorHex, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }} />
                        )}
                        <Text style={[styles.statValue, { color: colors.heading }]}>{luckyStats.color}</Text>
                      </View>
                    </View>
                  </>
                )}
                {!!luckyStats?.crystal && (
                  <>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statRow}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Crystal</Text>
                      <Text style={[styles.statValue, { color: colors.heading }]}>✧ {luckyStats.crystal}</Text>
                    </View>
                  </>
                )}
              </View>
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
              <Text style={[styles.mantraLabel, { color: '#D88C6A' }]}>
                {period === 'weekly' ? "THIS WEEK'S MANTRA" : period === 'monthly' ? "THIS MONTH'S MANTRA" : "TODAY'S MANTRA"}
              </Text>
              <Text style={[styles.mantraQuoteOpen, { color: '#D88C6A' }]}>“</Text>
              <Text style={[styles.mantraText, { color: colors.heading }]}>{mantra}</Text>
              <Text style={[styles.mantraQuoteClose, { color: '#D88C6A' }]}>”</Text>
            </View>
          )}

          {/* Viral insight — tap to share */}
          {!!viralInsight && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={async () => {
                haptic.medium();
                try {
                  await Share.share({ message: `✦ ${viralInsight}\n\n— Celestia` });
                } catch (e) {}
              }}
              style={[
                styles.shareCard,
                {
                  backgroundColor: isDark ? colors.card : '#FBF1EC',
                  borderColor: isDark ? colors.border : 'rgba(232,160,98,0.30)',
                },
              ]}>
              <Text style={[styles.shareText, { color: colors.heading }]}>✦ {viralInsight}</Text>
              <Text style={[styles.shareCta, { color: '#C97D62' }]}>Share this insight  ↗</Text>
            </TouchableOpacity>
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
            <Text style={styles.ctaText}>Ask Celestia about {periodLower}  →</Text>
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
  heroLongDate: {
    fontFamily: FONTS.editorialItalic,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.2,
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

  // Glance chips in hero (Moon + Power)
  glanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginTop: 14,
  },
  glanceChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
  },
  glanceText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.4,
  },

  // Paragraph blocks for THE READING
  paraBlock: {
    marginBottom: 18,
  },
  paraLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 9,
    letterSpacing: 1.8,
    marginBottom: 6,
  },

  // Planet influence cards
  influenceCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  influenceGlyph: {
    fontFamily: FONTS.editorial,
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  influenceTag: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 13,
    letterSpacing: 0.3,
  },

  // Power moves
  powerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },
  powerRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  powerNum: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    marginTop: 2,
  },
  powerNumText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 12,
  },

  // Daily ritual block
  ritualBox: {
    paddingVertical: 14, paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderRadius: 12,
    marginBottom: 26,
  },
  ritualLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10, letterSpacing: 2,
  },

  // Cosmic stats card
  statsCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statLabel: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  statValue: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 14,
  },
  statDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },

  // Viral insight share card
  shareCard: {
    paddingVertical: 18, paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    alignItems: 'center',
  },
  shareText: {
    fontFamily: FONTS.editorialItalic,
    fontSize: 16, lineHeight: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  shareCta: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 12,
    letterSpacing: 0.4,
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
