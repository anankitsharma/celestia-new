import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Share, Platform, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { haptic } from '../services/hapticService';
import AstroText from '../components/AstroText';
import { COMPAT_CARD_GRADIENTS_DARK, COMPAT_CARD_GRADIENTS_LIGHT, COMPAT_CARD_ACCENTS, ROLE_LABELS, ZODIAC_GLYPHS } from '../constants/moodMaps';

const { width: SCREEN_W } = Dimensions.get('window');

const PAGE_BG_DARK = '#1F0F18';
const PAGE_BG_LIGHT = '#FBF5EE';

export default function CompatibilityDetailScreen({ navigation, route }) {
  const { colors, isDark } = useTheme();
  const { 
    card, 
    matchDetails, 
    synastry, 
    p1Name, 
    p2Name, 
    partnerRole, 
    cosmicSeason, 
    activeRelationshipWindows,
    matchCore,
    partnerProfile,
    partnerSun
  } = route.params;

  const mGradients = isDark
    ? (COMPAT_CARD_GRADIENTS_DARK[card.gradientKey] || COMPAT_CARD_GRADIENTS_DARK.aiAnalysis)
    : (COMPAT_CARD_GRADIENTS_LIGHT[card.gradientKey] || COMPAT_CARD_GRADIENTS_LIGHT.aiAnalysis);
  const mAccent = COMPAT_CARD_ACCENTS[card.gradientKey] || T.gold;
  const mAccentSoft = mAccent + (isDark ? '28' : '18');
  const dsText = isDark ? T.cream : '#1A1410';
  const dsMuted = isDark ? 'rgba(250,248,242,0.65)' : 'rgba(26,20,16,0.55)';

  const onShare = async () => {
    haptic.light();
    try { 
      await Share.share({ message: `${p1Name} & ${p2Name} — ${card.tag} on Celestia.` }); 
    } catch (e) {}
  };

  const renderSection = (sKey) => {
    switch (sKey) {
      case 'sharedValues':
        if (!matchDetails?.sharedValues) return null;
        return (
          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.dsOverline, { color: mAccent }]}>SHARED VALUES</Text>
            <Text style={{ fontFamily: FONTS.editorial, fontSize: 24, color: dsText, marginBottom: 16 }}>{matchDetails.sharedValuesTheme || 'Core Alignment'}</Text>
            <View style={{ gap: 10 }}>
              {matchDetails.sharedValues.map((val, i) => (
                <View key={i} style={[styles.dsAreaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 13, color: dsText }}>{val}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      case 'loveLanguages':
        if (!matchDetails?.loveLanguages) return null;
        return (
          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.dsOverline, { color: mAccent }]}>LOVE LANGUAGES</Text>
            <View style={[styles.dsAreaCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
              <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 13, color: dsText, marginBottom: 6 }}>{p1Name}'s Need</Text>
              <AstroText style={[styles.dsBody, { color: dsMuted }]} text={matchDetails.loveLanguages.user} />
            </View>
            <View style={[styles.dsAreaCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 12 }]}>
              <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 13, color: dsText, marginBottom: 6 }}>{p2Name}'s Need</Text>
              <AstroText style={[styles.dsBody, { color: dsMuted }]} text={matchDetails.loveLanguages.partner} />
            </View>
            {matchDetails.loveLanguages.match && (
              <View style={[styles.dsHighlight, { backgroundColor: mAccentSoft, borderColor: mAccent + '40' }]}>
                <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 12, color: mAccent, marginBottom: 4 }}>THE BRIDGE</Text>
                <AstroText style={{ fontFamily: FONTS.sans, fontSize: 13, color: dsText, lineHeight: 20 }} text={matchDetails.loveLanguages.match} />
              </View>
            )}
          </View>
        );

      case 'conflictStyle':
        if (!matchDetails?.conflictStyle) return null;
        return (
          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.dsOverline, { color: mAccent }]}>{matchDetails.conflictStyle.patternName ? matchDetails.conflictStyle.patternName.toUpperCase() : 'CONFLICT STYLE'}</Text>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 13, color: '#E86050', marginBottom: 6 }}>△  The Trigger</Text>
              <AstroText style={[styles.dsBody, { color: dsText }]} text={matchDetails.conflictStyle.triggers} />
            </View>
            <View style={[styles.dsHighlight, { backgroundColor: '#4A806015', borderColor: '#4A806030' }]}>
              <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 13, color: '#4A8060', marginBottom: 6 }}>✦  The Resolution</Text>
              <AstroText style={{ fontFamily: FONTS.sans, fontSize: 13, color: dsText, lineHeight: 20 }} text={matchDetails.conflictStyle.resolution} />
            </View>
          </View>
        );

      case 'cosmicTiming':
        if (!cosmicSeason && !activeRelationshipWindows?.length) return null;
        return (
          <View style={{ marginBottom: 8 }}>
            {cosmicSeason && (
              <>
                <View style={[styles.dsDestinyBadge, { backgroundColor: mAccent + '15', borderColor: mAccent + '40', marginBottom: 20 }]}>
                  <Text style={[styles.dsDestinyText, { color: mAccent }]}>{(cosmicSeason.season || 'CURRENT').toUpperCase()} SEASON</Text>
                </View>
                <AstroText style={[styles.dsBody, { color: dsText, marginBottom: 20 }]} text={cosmicSeason.description} />
                {cosmicSeason.seasonAction && (
                   <View style={[styles.dsActionCard, { backgroundColor: mAccent + '10', borderColor: mAccent + '30', marginBottom: 20 }]}>
                      <View style={[styles.dsActionIcon, { borderColor: mAccent + '30' }]}><Text style={{ color: mAccent }}>✦</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dsActionTitle, { color: dsText, fontSize: 13 }]}>COSMIC DIRECTIVE</Text>
                        <Text style={[styles.dsActionSub, { color: mAccent, fontSize: 14, fontFamily: FONTS.sansMedium, marginTop: 2 }]}>{cosmicSeason.seasonAction}</Text>
                      </View>
                   </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 12, color: dsMuted }}>{cosmicSeason.progress}% complete</Text>
                  <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 12, color: dsMuted }}>Ends in {cosmicSeason.totalDays - cosmicSeason.daysElapsed} days</Text>
                </View>
                <View style={[styles.dsBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,20,16,0.07)', marginTop: 8, marginBottom: activeRelationshipWindows?.length ? 28 : 0 }]}>
                  <View style={[styles.dsBarFill, { width: `${cosmicSeason.progress}%`, backgroundColor: mAccent }]} />
                </View>
              </>
            )}
            {activeRelationshipWindows?.length > 0 && (
              <>
                <Text style={[styles.dsOverline, { color: mAccent }]}>ACTIVE TRANSITS</Text>
                <View style={{ gap: 12 }}>
                  {activeRelationshipWindows.map((w, i) => (
                    <View key={i} style={[styles.dsAreaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 13, color: dsText, flex: 1 }}>{w.planet} to {w.natalPlanet}</Text>
                        {w.isPeak && <View style={{ backgroundColor: '#E8A05020', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}><Text style={{ color: '#E8A050', fontSize: 10, fontFamily: FONTS.sansSemiBold }}>PEAK</Text></View>}
                      </View>
                      <AstroText style={{ fontFamily: FONTS.sans, fontSize: 13, color: dsMuted, lineHeight: 19 }} text={w.description} />
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        );

      case 'friendshipCard': {
        const fd = matchDetails?.friendshipDynamic;
        const ac = matchDetails?.adventureCompat;
        if (!fd && !ac) return null;
        return (
          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.dsOverline, { color: mAccent }]}>YOUR FRIENDSHIP</Text>
            {fd?.vibeDescription && (
              <View style={[styles.dsHighlight, { backgroundColor: mAccentSoft, borderColor: mAccent + '40', marginBottom: 16 }]}>
                <Text style={{ fontFamily: FONTS.editorial, fontSize: 17, color: dsText, textAlign: 'center', lineHeight: 26 }}>
                  {fd.vibeDescription}
                </Text>
              </View>
            )}
            {(fd?.bestActivity || fd?.pastMoment) && (
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                {fd?.bestActivity && (
                  <View style={[styles.dsColCard, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 11, letterSpacing: 1, color: mAccent, marginBottom: 6 }}>BEST ACTIVITY</Text>
                    <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 13, color: dsText }}>{fd.bestActivity}</Text>
                  </View>
                )}
                {fd?.pastMoment && (
                  <View style={[styles.dsColCard, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 11, letterSpacing: 1, color: mAccent, marginBottom: 6 }}>PAST LIFE VIBE</Text>
                    <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 13, color: dsText }}>{fd.pastMoment}</Text>
                  </View>
                )}
              </View>
            )}
            {ac && (
              <View style={[styles.dsAreaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 12, color: mAccent, marginBottom: 8 }}>ADVENTURE COMPATIBILITY</Text>
                <AstroText style={{ fontFamily: FONTS.sans, fontSize: 14, color: dsText, lineHeight: 20 }} text={ac.idealTrip ? `Ideal trip: ${ac.idealTrip}. ${ac.vibe}` : ac.vibe} />
              </View>
            )}
          </View>
        );
      }

      case 'childCard': {
        const cn = matchDetails?.childNature;
        const pg = matchDetails?.parentingGuide;
        if (!cn && !pg) return null;
        return (
          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.dsOverline, { color: mAccent }]}>PARENTING PLAYBOOK</Text>
            {cn && (
              <>
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 11, color: mAccent, letterSpacing: 1.5, marginBottom: 6 }}>CORE NATURE</Text>
                  <Text style={{ fontFamily: FONTS.editorial, fontSize: 24, color: dsText }}>{cn.coreTemperament}</Text>
                </View>
                <View style={[styles.dsHighlight, { backgroundColor: mAccentSoft, borderColor: mAccent + '40', marginBottom: 20 }]}>
                  <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 12, color: mAccent, marginBottom: 4 }}>EMOTIONAL NEED</Text>
                  <AstroText style={{ fontFamily: FONTS.sans, fontSize: 14, color: dsText, lineHeight: 20 }} text={cn.emotionalNeed} />
                </View>
              </>
            )}
            {pg && (
              <View style={{ gap: 12 }}>
                <View style={[styles.dsAreaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 12, color: dsMuted, marginBottom: 4 }}>THEIR NEEDS</Text>
                  <AstroText style={{ fontFamily: FONTS.sans, fontSize: 13, color: dsText }} text={pg.theirNeeds} />
                </View>
                <View style={[styles.dsAreaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 12, color: dsMuted, marginBottom: 4 }}>YOUR APPROACH</Text>
                  <AstroText style={{ fontFamily: FONTS.sans, fontSize: 13, color: dsText }} text={pg.yourApproach} />
                </View>
              </View>
            )}
          </View>
        );
      }

      case 'bossPlaybook': {
        const cp = matchDetails?.communicationPlaybook;
        const cs = matchDetails?.careerStrategy;
        if (!cp && !cs) return null;
        return (
          <View style={{ marginBottom: 8 }}>
            <Text style={[styles.dsOverline, { color: mAccent }]}>PROFESSIONAL STRATEGY</Text>
            {cp && (
              <View style={[styles.dsHighlight, { backgroundColor: mAccentSoft, borderColor: mAccent + '40', marginBottom: 20 }]}>
                <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 12, color: mAccent, marginBottom: 4 }}>BEST APPROACH</Text>
                <AstroText style={{ fontFamily: FONTS.sans, fontSize: 14, color: dsText, lineHeight: 20, fontStyle: 'italic' }} text={cp.bestApproach} />
              </View>
            )}
            {cs && (
              <View style={[styles.dsAreaCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 20 }]}>
                <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 12, color: dsMuted, marginBottom: 4 }}>GROWTH TIP</Text>
                <AstroText style={{ fontFamily: FONTS.sans, fontSize: 13, color: dsText }} text={cs.growthTip} />
              </View>
            )}
            {cp?.theirStyle && (
              <View style={[styles.dsQuoteBlock, { borderLeftColor: mAccent, backgroundColor: mAccentSoft }]}>
                <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 11, color: mAccent, marginBottom: 4 }}>THEIR WORK STYLE</Text>
                <AstroText style={{ fontFamily: FONTS.sans, fontSize: 13, color: dsText }} text={cp.theirStyle} />
              </View>
            )}
          </View>
        );
      }

      case 'keyConnections':
        if (!synastry?.links?.length) return null;
        const harmonics = (synastry.links || []).filter(l => !l.isTense).length;
        const tense = (synastry.links || []).filter(l => l.isTense).length;
        const aspectSummary = `${harmonics} of your strongest links are growth aspects, balancing ${tense} points of friction.`;
        return (
          <View>
            <Text style={[styles.dsOverline, { color: mAccent }]}>KEY LINKS</Text>
            <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 13, color: dsText, lineHeight: 20, marginBottom: 16 }}>{aspectSummary}</Text>
            <View style={{ gap: 10 }}>
              {synastry.links.slice(0, 6).map((link, i) => {
                const borderC = link.isFriction ? '#E86050' : '#4A8060';
                const bgC = link.isFriction ? 'rgba(232,96,80,0.05)' : 'rgba(74,128,96,0.05)';
                return (
                  <View key={i} style={[styles.dsAspectCard, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: borderC, backgroundColor: bgC }]}>
                    <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 12, color: borderC, marginBottom: 4, letterSpacing: 0.5 }}>{link.label}</Text>
                    <AstroText style={{ fontFamily: FONTS.sans, fontSize: 13, color: dsText, lineHeight: 19 }} text={link.description} />
                  </View>
                );
              })}
            </View>
          </View>
        );

      case 'connectionHub':
        return (
          <View>
            <Text style={[styles.dsOverline, { color: mAccent }]}>YOUR CONNECTION</Text>
            {matchCore?.aiNarrative ? (
               <AstroText style={[styles.dsBody, { color: dsText, fontSize: 15, lineHeight: 24, marginBottom: 24 }]} text={matchCore.aiNarrative} />
            ) : null}
            
            {/* Dimension bars inside the hub */}
            <View style={{ marginBottom: 28 }}>
              <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 10, color: dsMuted, letterSpacing: 1.5, marginBottom: 12 }}>DIMENSIONS</Text>
              {Object.entries(synastry.scores || {}).map(([key, score]) => (
                <View key={key} style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 11, color: dsText }}>{key.toUpperCase()}</Text>
                    <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 11, color: dsMuted }}>{score}%</Text>
                  </View>
                  <View style={[styles.dsBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,20,16,0.06)' }]}>
                    <View style={[styles.dsBarFill, { width: `${score}%`, backgroundColor: mAccent }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header Hero */}
        <LinearGradient colors={mGradients} locations={[0, 0.55, 1]} style={styles.detailHeader}>
          <LinearGradient
            colors={isDark ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']}
            locations={[0, 0.5]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          
          <View style={styles.detailHeaderBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.detailHeaderBtn}>
              <Text style={[styles.detailHeaderBtnText, { color: isDark ? 'rgba(250,248,242,0.75)' : 'rgba(26,20,16,0.55)' }]}>‹  Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onShare} style={styles.detailHeaderBtn}>
              <Text style={[styles.detailHeaderBtnText, { color: isDark ? 'rgba(250,248,242,0.75)' : 'rgba(26,20,16,0.55)' }]}>Share  ↗</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailHeroContent}>
            <Text style={[styles.detailHeroTag, { color: isDark ? 'rgba(250,248,242,0.6)' : 'rgba(26,20,16,0.5)' }]}>{card.tag}</Text>
            <Text style={[styles.detailHeroTitle, { color: isDark ? T.cream : '#1A1410' }]}>{card.headline}</Text>
            {matchCore?.hookLine && (
              <Text style={[styles.detailHeroHook, { color: isDark ? 'rgba(250,248,242,0.75)' : 'rgba(26,20,16,0.65)' }]}>“{matchCore.hookLine}”</Text>
            )}
          </View>
        </LinearGradient>

        <View style={styles.detailBody}>
          {renderSection(card.key)}
          
          {/* Card-specific Weekly Action */}
          {matchDetails?.areas?.[card.key]?.weeklyAction && (
            <View style={{ marginTop: 32 }}>
              <Text style={[styles.dsOverline, { color: mAccent }]}>THIS WEEK'S ACTION</Text>
              <View style={[styles.dsActionCard, { backgroundColor: mAccent + '10', borderColor: mAccent + '30' }]}>
                <View style={[styles.dsActionIcon, { borderColor: mAccent + '30' }]}><Text style={{ color: mAccent }}>✓</Text></View>
                <View style={{ flex: 1 }}>
                  <AstroText style={[styles.dsActionSub, { color: dsText, fontSize: 14, fontFamily: FONTS.sansMedium }]} text={matchDetails.areas[card.key].weeklyAction} />
                </View>
              </View>
            </View>
          )}

          {/* Global Growth Tensions & Support (Rich Detail) */}
          {matchDetails?.growthTensions?.length > 0 && (
            <View style={{ marginTop: 40 }}>
              <Text style={[styles.dsOverline, { color: mAccent }]}>GROWTH TENSIONS</Text>
              <View style={{ gap: 12 }}>
                {matchDetails.growthTensions.map((gt, i) => (
                  <View key={i} style={[styles.dsAreaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 13, color: dsText, marginBottom: 4 }}>{gt.title}</Text>
                    <AstroText style={{ fontFamily: FONTS.sans, fontSize: 13, color: dsMuted, lineHeight: 19 }} text={gt.insight} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {matchDetails?.support && (
            <View style={{ marginTop: 40 }}>
              <Text style={[styles.dsOverline, { color: mAccent }]}>HOW YOU SUPPORT EACH OTHER</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.dsColCard, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 11, letterSpacing: 1, color: mAccent, marginBottom: 6 }}>EMOTIONAL</Text>
                  <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 13, color: dsText }}>{matchDetails.support.emotional}</Text>
                </View>
                <View style={[styles.dsColCard, { flex: 1, backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 11, letterSpacing: 1, color: mAccent, marginBottom: 6 }}>PRACTICAL</Text>
                  <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 13, color: dsText }}>{matchDetails.support.practical}</Text>
                </View>
              </View>
            </View>
          )}
          
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  scroll: { paddingBottom: 60 },
  detailHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + 10,
    paddingHorizontal: 22,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  detailHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  detailHeaderBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  detailHeaderBtnText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 12,
  },
  detailHeroContent: {
    alignItems: 'center',
  },
  detailHeroTag: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  detailHeroTitle: {
    fontFamily: FONTS.editorial,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 12,
  },
  detailHeroHook: {
    fontFamily: FONTS.editorialItalic,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  detailBody: {
    padding: 22,
    paddingTop: 30,
  },
  dsOverline: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 10,
    letterSpacing: 2.5,
    marginBottom: 12,
  },
  dsAreaCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  dsBody: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    lineHeight: 22,
  },
  dsHighlight: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  dsDestinyBadge: {
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  dsDestinyText: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 11,
    letterSpacing: 2,
  },
  dsActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 14,
  },
  dsActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dsActionTitle: {
    fontFamily: FONTS.sansSemiBold,
    fontSize: 11,
    letterSpacing: 1,
  },
  dsActionSub: {
    fontFamily: FONTS.sansMedium,
  },
  dsBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  dsBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  dsColCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  dsQuoteBlock: {
    padding: 16,
    borderLeftWidth: 3,
    borderRadius: 4,
  },
  dsAspectCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
});
