const fs = require('fs');
const path = '/Users/apple/Documents/Expo apps/Celestia-new/src/screens/CompatibilityScreen.js';
let code = fs.readFileSync(path, 'utf8');

// 1. Update SwipeableCompatCard with onTap and Gesture.Race
const oldSwipeable = `  const panGesture = Gesture.Pan()`;
const newSwipeable = `  const tapGesture = Gesture.Tap()
    .maxDistance(10)
    .onEnd(() => {
      'worklet';
      if (onTap) runOnJS(onTap)(cardData);
    });

  const panGesture = Gesture.Pan()`;

code = code.replace(oldSwipeable, newSwipeable);

const oldComposed = `  return (
    <GestureDetector gesture={panGesture}>`;
const newComposed = `  const composedGesture = Gesture.Race(tapGesture, panGesture);

  return (
    <GestureDetector gesture={composedGesture}>`;

code = code.replace(oldComposed, newComposed);

// Ensure onTap is in arguments
code = code.replace(
  `cardData, isDark, canAdvance, canRewind, onAdvance, onRewind, renderContent`,
  `cardData, isDark, canAdvance, canRewind, onAdvance, onRewind, onTap, renderContent`
);

// 2. Add expandedCard state
code = code.replace(
  `const [currentDeckIndex, setCurrentDeckIndex] = useState(0);`,
  `const [currentDeckIndex, setCurrentDeckIndex] = useState(0);\n  const [expandedCard, setExpandedCard] = useState(null);`
);

// 3. Update deckCards generation and rendering
const oldDeckCardsStart = `        const deckCards = (() => {`;
const oldDeckCardsEnd = `        const renderCardContent = (card) => {`;

// We'll replace from oldDeckCardsStart to oldDeckCardsEnd with the new mapping
const newDeckCards = `        const deckCards = (() => {
          const list = [];
          list.push({ type: 'cover', key: 'cover', tag: 'THE CONNECTION', headline: 'Your Cosmic Bond' });
          rc.sectionOrder.forEach(sKey => {
            if (sKey === 'aiAnalysis' && !aiAnalysis && !aiLoading) return;
            if (sKey === 'areas' && !matchDetails?.areas && !detailsLoading) return;
            if (sKey === 'sharedValues' && !matchDetails?.sharedValues?.length) return;
            if (sKey === 'keyConnections' && !synastry.links?.length) return;
            if (['loveLanguages', 'conflictStyle', 'friendshipDynamic', 'adventureCompat', 'generationalPattern', 'communicationGuide', 'healingPath', 'siblingDynamic', 'communicationPlaybook', 'careerStrategy', 'teamworkProfile', 'parentingGuide', 'childNature'].includes(sKey)) {
              if (!matchDetails?.[sKey]) return;
            }
            if (sKey === 'relationshipSeason' && !cosmicSeason) return;
            if (sKey === 'activeWindows' && !activeRelationshipWindows.length) return;

            let tag = 'INSIGHT';
            let headline = 'A deep connection.';
            let icon = '✦';

            if (sKey === 'aiAnalysis') { tag = 'THE SPARK'; headline = "Your cosmic connection explained."; icon = '🔥'; }
            if (sKey === 'areas') { tag = 'DIMENSIONS'; headline = "How your energy aligns across key areas."; icon = '🌟'; }
            if (sKey === 'sharedValues') { tag = 'SHARED VALUES'; headline = "What binds you together at the core."; icon = '✨'; }
            if (sKey === 'keyConnections') { tag = 'KEY LINKS'; headline = "The strongest astrological aspects between you."; icon = '☍'; }
            if (sKey === 'actionRow' || sKey === 'pdfDownload') return; // Skip actions for now, or handle specially
            
            // role specific
            if (sKey === 'loveLanguages') { tag = 'LOVE LANGUAGES'; headline = "How you both give and receive affection."; icon = '♡'; }
            if (sKey === 'conflictStyle') { tag = 'CONFLICT STYLE'; headline = "Where you clash and how to resolve it."; icon = '△'; }
            if (sKey === 'friendshipDynamic') { tag = 'FRIENDSHIP VIBE'; headline = "The unique energy of your friendship."; icon = '★'; }
            if (sKey === 'adventureCompat') { tag = 'ADVENTURE'; headline = "How you explore the world together."; icon = '✈'; }
            if (sKey === 'generationalPattern') { tag = 'GENERATIONAL'; headline = "Patterns inherited and shared."; icon = '♄'; }
            if (sKey === 'communicationGuide' || sKey === 'communicationPlaybook') { tag = 'COMMUNICATION'; headline = "How to talk so the other listens."; icon = '☿'; }
            if (sKey === 'healingPath') { tag = 'HEALING PATH'; headline = "How you heal each other's wounds."; icon = '◇'; }
            if (sKey === 'siblingDynamic') { tag = 'SIBLING DYNAMIC'; headline = "Rivalry and alliance in your bond."; icon = '◎'; }
            if (sKey === 'careerStrategy') { tag = 'CAREER STRATEGY'; headline = "How to leverage each other professionally."; icon = '↑'; }
            if (sKey === 'teamworkProfile') { tag = 'TEAMWORK'; headline = "Your collaborative style at work."; icon = '✧'; }
            if (sKey === 'parentingGuide') { tag = 'PARENTING'; headline = "Your family dynamic and growth edges."; icon = '☾'; }
            if (sKey === 'childNature') { tag = 'CHILD NATURE'; headline = "Understanding their core temperament."; icon = '☉'; }

            list.push({ type: 'section', key: sKey, sectionKey: sKey, tag, headline, icon });
          });
          
          list.push({ type: 'actions', key: 'actions', tag: 'NEXT STEPS', headline: 'Deepen your reading.', icon: '↗' });
          return list;
        })();

        const currentCard = deckCards[currentDeckIndex];
        const nextCard = deckCards[currentDeckIndex + 1];
        const canAdvance = currentDeckIndex < deckCards.length - 1;
        const canRewind = currentDeckIndex > 0;

        const handleAdvance = () => {
          haptic.selection();
          setCurrentDeckIndex(i => Math.min(i + 1, deckCards.length - 1));
        };
        const handleRewind = () => {
          haptic.selection();
          setCurrentDeckIndex(i => Math.max(0, i - 1));
        };

        const handleCardTap = (card) => {
          if (card.type === 'cover') return;
          haptic.light();
          setExpandedCard(card);
        };

        const renderCardContent = (card) => {`;

const oldDeckCardsRegex = /const deckCards = \(\(\) => \{[\s\S]*?const renderCardContent = \(card\) => \{/;
code = code.replace(oldDeckCardsRegex, newDeckCards);

// 4. Update the renderCardContent body
const oldRenderCardContentBody = `          if (!card) return null;
          return (
            <View style={[styles.compatCardContainer, { backgroundColor: isDark ? '#0A0A0A' : '#F9F8F6' }]}>
              <LinearGradient colors={rc.heroGradient} locations={[0, 0.4, 1]} start={{x:0, y:0}} end={{x:0, y:1}} style={styles.compatCardGradient}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                  {card.type === 'cover' ? (
                    <View style={{ alignItems: 'center', marginTop: 20 }}>
                      <View style={styles.ddPair}>
                        <LinearGradient colors={['#E2C46A', '#8C6C18']} style={styles.ddOrb}><Text style={styles.ddOrbText}>{getInitial(userProfile.name)}</Text></LinearGradient>
                        <View style={styles.ddConnector}><View style={styles.ddLine} /><View style={styles.ddHeart}><Text style={{ fontSize: 14 }}>{ROLE_LABELS[partnerRole]?.icon || '♡'}</Text></View><View style={styles.ddLine} /></View>
                        <LinearGradient colors={(ROLE_COLORS[partnerRole] || ROLE_COLORS.other).bg} style={styles.ddOrb}><Text style={styles.ddOrbText}>{getInitial(partnerProfile?.name)}</Text></LinearGradient>
                      </View>
                      <Text style={styles.ddTitle}>{p1Name} & {p2Name}</Text>
                      <Text style={styles.ddSub}>{ROLE_LABELS[partnerRole]?.label} · {ZODIAC_GLYPHS[partnerSun?.sign] || '✦'} {partnerSun?.sign || '—'}</Text>
                      <View style={styles.ddScoreWrap}>
                        <Svg width={80} height={80}>
                          <Circle cx={40} cy={40} r={34} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
                          <Circle cx={40} cy={40} r={34} fill="none" stroke={T.gold} strokeWidth={5}
                            strokeDasharray={\`\${(synastry.harmonyScore / 100) * 2 * Math.PI * 34} \${2 * Math.PI * 34}\`}
                            strokeLinecap="round" transform="rotate(-90 40 40)" />
                        </Svg>
                        <Text style={styles.ddScoreNum}>{synastry.harmonyScore}</Text>
                      </View>
                      <Text style={styles.ddVerdict}>"{rc.getScoreLabel(synastry.harmonyScore)}"</Text>
                      <View style={[styles.ddChips, { marginTop: 24 }]}>
                        {roleDims.map((d, i) => (
                          <View key={i} style={[styles.ddChip, { borderColor: d.color + '40' }]}>
                            <Text style={{ fontSize: 10, color: d.color }}>{d.icon}</Text>
                            <Text style={styles.ddChipLabel}>{d.label}</Text>
                            <Text style={[styles.ddChipVal, { color: d.color }]}>{d.pct}%</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={{ fontFamily: FONTS.sans, fontSize: 12, color: 'rgba(250,248,242,0.6)', marginTop: 40, textAlign: 'center' }}>Swipe left to read your connection</Text>
                    </View>
                  ) : (
                    renderSection(card.sectionKey, 0)
                  )}
                </ScrollView>
              </LinearGradient>
            </View>
          );
        };`;

const newRenderCardContentBody = `          if (!card) return null;
          const cardFg = isDark ? T.cream : '#1A1410';
          const cardFgMuted = isDark ? 'rgba(250,248,242,0.7)' : 'rgba(26,20,16,0.65)';

          return (
            <View style={[styles.cardLifted, !isDark && { shadowColor: 'rgba(44,47,49,0.5)', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 12 }, shadowRadius: 24 }]}>
              <LinearGradient colors={rc.heroGradient} locations={[0, 0.55, 1]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.cardGradient}>
                <LinearGradient
                  colors={isDark ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.0)'] : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.0)']}
                  locations={[0, 0.4]}
                  style={styles.sheen}
                  pointerEvents="none"
                />
                <View style={styles.contentInner}>
                  {card.type === 'cover' ? (
                    <View style={{ alignItems: 'center', marginTop: 20 }}>
                      <View style={styles.ddPair}>
                        <LinearGradient colors={['#E2C46A', '#8C6C18']} style={styles.ddOrb}><Text style={styles.ddOrbText}>{getInitial(userProfile.name)}</Text></LinearGradient>
                        <View style={styles.ddConnector}><View style={styles.ddLine} /><View style={styles.ddHeart}><Text style={{ fontSize: 14 }}>{ROLE_LABELS[partnerRole]?.icon || '♡'}</Text></View><View style={styles.ddLine} /></View>
                        <LinearGradient colors={(ROLE_COLORS[partnerRole] || ROLE_COLORS.other).bg} style={styles.ddOrb}><Text style={styles.ddOrbText}>{getInitial(partnerProfile?.name)}</Text></LinearGradient>
                      </View>
                      <Text style={styles.ddTitle}>{p1Name} & {p2Name}</Text>
                      <Text style={styles.ddSub}>{ROLE_LABELS[partnerRole]?.label} · {ZODIAC_GLYPHS[partnerSun?.sign] || '✦'} {partnerSun?.sign || '—'}</Text>
                      <View style={styles.ddScoreWrap}>
                        <Svg width={80} height={80}>
                          <Circle cx={40} cy={40} r={34} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
                          <Circle cx={40} cy={40} r={34} fill="none" stroke={T.gold} strokeWidth={5}
                            strokeDasharray={\`\${(synastry.harmonyScore / 100) * 2 * Math.PI * 34} \${2 * Math.PI * 34}\`}
                            strokeLinecap="round" transform="rotate(-90 40 40)" />
                        </Svg>
                        <Text style={styles.ddScoreNum}>{synastry.harmonyScore}</Text>
                      </View>
                      <Text style={styles.ddVerdict}>"{rc.getScoreLabel(synastry.harmonyScore)}"</Text>
                      <View style={[styles.ddChips, { marginTop: 24 }]}>
                        {roleDims.map((d, i) => (
                          <View key={i} style={[styles.ddChip, { borderColor: d.color + '40' }]}>
                            <Text style={{ fontSize: 10, color: d.color }}>{d.icon}</Text>
                            <Text style={styles.ddChipLabel}>{d.label}</Text>
                            <Text style={[styles.ddChipVal, { color: d.color }]}>{d.pct}%</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', width: '100%', flex: 1, justifyContent: 'center' }}>
                      <View style={[styles.motifBadge, { backgroundColor: isDark ? 'rgba(250,248,242,0.08)' : '#FFFFFF', borderColor: isDark ? 'rgba(250,248,242,0.15)' : 'rgba(26,20,16,0.08)' }]}>
                        <Text style={{ fontSize: 24, color: cardFg }}>{card.icon}</Text>
                      </View>
                      <View style={[styles.tagPill, { backgroundColor: isDark ? 'rgba(254,217,184,0.20)' : 'rgba(254,217,184,0.5)', borderColor: isDark ? 'rgba(254,217,184,0.35)' : '#FED9B8' }]}>
                        <Text style={[styles.tagLabel, { color: cardFg }]}>{card.tag}</Text>
                      </View>
                      <Text style={[styles.headline, { color: cardFg }]}>{card.headline}</Text>
                      <Text style={[styles.meta, { color: cardFgMuted, marginTop: 16 }]}>Tap to expand details →</Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </View>
          );
        };`;

code = code.replace(oldRenderCardContentBody, newRenderCardContentBody);

// 5. Update main return to include Modal and pass onTap
const oldMainReturnStart = `          <View style={styles.deckOverlay}>`;
const newMainReturnStart = `          <View style={styles.deckOverlay}>
            {expandedCard && (
              <Modal visible={true} transparent animationType="slide" onRequestClose={() => setExpandedCard(null)}>
                <View style={styles.detailModalContainer}>
                  <View style={[styles.detailModalBody, { backgroundColor: colors.bg }]}>
                    <View style={styles.detailModalDragHandle} />
                    <TouchableOpacity onPress={() => setExpandedCard(null)} style={styles.detailModalCloseBtn}>
                      <Text style={{ fontSize: 24, color: colors.text }}>×</Text>
                    </TouchableOpacity>
                    <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 40, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                      <Text style={styles.detailModalTitle}>{expandedCard.tag}</Text>
                      {expandedCard.type === 'actions' ? (
                        <>
                          {renderSection('actionRow', 0)}
                          <View style={{height: 20}} />
                          {renderSection('pdfDownload', 1)}
                        </>
                      ) : (
                        renderSection(expandedCard.sectionKey, 0)
                      )}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            )}`;

code = code.replace(oldMainReturnStart, newMainReturnStart);

code = code.replace(
  `onRewind={handleRewind}\n                    renderContent={renderCardContent}`,
  `onRewind={handleRewind}\n                    onTap={handleCardTap}\n                    renderContent={renderCardContent}`
);

// 6. Append new styles for Home Tab cards + Modal
const additionalStyles = `
  cardLifted: { flex: 1, borderRadius: 32, backgroundColor: '#FCF9F8', shadowColor: '#645787', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 8 },
  cardGradient: { flex: 1, borderRadius: 32, overflow: 'hidden', paddingVertical: 32, paddingHorizontal: 32 },
  sheen: { position: 'absolute', top: 0, left: 0, right: 0, height: '40%', borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  contentInner: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 24, paddingHorizontal: 6 },
  motifBadge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 16 },
  tagPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100, borderWidth: 1, marginBottom: 16 },
  tagLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 11, letterSpacing: 1.5 },
  headline: { fontFamily: FONTS.editorial, fontSize: 26, textAlign: 'center', lineHeight: 32, marginBottom: 12 },
  meta: { fontFamily: FONTS.sansMedium, fontSize: 13, textAlign: 'center', lineHeight: 20, letterSpacing: 0.5 },
  
  detailModalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  detailModalBody: { height: '80%', borderTopLeftRadius: 32, borderTopRightRadius: 32, overflow: 'hidden' },
  detailModalDragHandle: { width: 40, height: 4, backgroundColor: 'rgba(150,150,150,0.3)', borderRadius: 2, alignSelf: 'center', marginTop: 12 },
  detailModalCloseBtn: { position: 'absolute', top: 16, right: 24, zIndex: 10, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  detailModalTitle: { fontFamily: FONTS.sansSemiBold, fontSize: 12, letterSpacing: 2, color: T.gold, textAlign: 'center', marginBottom: 24 },
});`;

code = code.replace(/}\);\s*$/, additionalStyles);

fs.writeFileSync(path, code);
console.log('Home tab styles and onTap modal applied!');
