const fs = require('fs');
const path = '/Users/apple/Documents/Expo apps/Celestia-new/src/screens/CompatibilityScreen.js';
let code = fs.readFileSync(path, 'utf8');

// Chunk 1
code = code.replace(
  `import { useTheme } from '../contexts/ThemeContext';\n\nimport { ROLE_DETAIL_CONFIG } from '../constants/roleDetailConfig';\n\nconst { width: SCREEN_W } = Dimensions.get('window');`,
  `import { useTheme } from '../contexts/ThemeContext';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';

import { ROLE_DETAIL_CONFIG } from '../constants/roleDetailConfig';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const SWIPE_THRESHOLD = 120;
const VELOCITY_THRESHOLD = 450;
const ROTATION_FACTOR = 15;
const FLY_DISTANCE = SCREEN_W * 1.5;
const SPRING_GENTLE = { damping: 15, stiffness: 120 };
const CARD_WIDTH = SCREEN_W * 0.90;
const CARD_HEIGHT = Math.min(CARD_WIDTH / 0.70, SCREEN_H * 0.70);`
);

// Chunk 2
const swipeableCardStr = `
function SwipeableCompatCard({
  cardData, isDark, canAdvance, canRewind, onAdvance, onRewind, renderContent
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const rot = useSharedValue(0);

  const reset = () => {
    'worklet';
    tx.value = withSpring(0, SPRING_GENTLE);
    ty.value = withSpring(0, SPRING_GENTLE);
    rot.value = withSpring(0, SPRING_GENTLE);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      tx.value = e.translationX;
      ty.value = e.translationY * 0.3;
      rot.value = (e.translationX / SWIPE_THRESHOLD) * ROTATION_FACTOR;
    })
    .onEnd((e) => {
      'worklet';
      const wantNext = e.translationX < -SWIPE_THRESHOLD || e.velocityX < -VELOCITY_THRESHOLD;
      const wantPrev = e.translationX >  SWIPE_THRESHOLD || e.velocityX >  VELOCITY_THRESHOLD;

      if (wantNext && canAdvance) {
        rot.value = withTiming(-22, { duration: 220 });
        tx.value = withTiming(-FLY_DISTANCE, { duration: 220 }, (finished) => {
          if (finished) runOnJS(onAdvance)();
        });
      } else if (wantPrev && canRewind) {
        rot.value = withTiming(22, { duration: 220 });
        tx.value = withTiming(FLY_DISTANCE, { duration: 220 }, (finished) => {
          if (finished) runOnJS(onRewind)();
        });
      } else {
        reset();
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: \`\${rot.value}deg\` },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Reanimated.View style={[styles.cardAbsolute, animatedStyle]}>
        {renderContent(cardData)}
      </Reanimated.View>
    </GestureDetector>
  );
}

export default function CompatibilityScreen() {`;

code = code.replace(`export default function CompatibilityScreen() {`, swipeableCardStr);

// Chunk 3
code = code.replace(
  `const [selectedPartner, setSelectedPartner] = useState(null);`,
  `const [selectedPartner, setSelectedPartner] = useState(null);\n  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);\n\n  useEffect(() => {\n    setCurrentDeckIndex(0);\n  }, [selectedPartner, showDetailScreen]);`
);

// Chunk 4
// Replace the return block for showDetailScreen with the Deck view
const oldReturnStart = `        return (
          <View style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false}>`;

const newDeckView = `        const deckCards = (() => {
          const list = [];
          list.push({ type: 'cover', key: 'cover' });
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

            list.push({ type: 'section', key: sKey, sectionKey: sKey });
          });
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

        const renderCardContent = (card) => {
          if (!card) return null;
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
        };

        return (
          <View style={styles.deckOverlay}>
            <LinearGradient colors={rc.heroGradient} style={StyleSheet.absoluteFillObject} />
            <View style={styles.deckHeader}>
              <TouchableOpacity onPress={() => setSelectedPartner(null)} style={styles.deckBackBtn}>
                <Text style={{ fontSize: 28, color: 'rgba(250,248,242,0.8)' }}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.deckHeaderTitle}>{p1Name} & {p2Name}</Text>
              <View style={{ width: 40 }} />
            </View>
            <View style={styles.deckArea}>
              <View style={styles.cardStack}>
                {nextCard && (
                  <View pointerEvents="none" style={[styles.cardAbsolute, styles.cardBehind]}>
                    {renderCardContent(nextCard)}
                  </View>
                )}
                {currentCard && (
                  <SwipeableCompatCard
                    key={currentCard.key}
                    cardData={currentCard}
                    isDark={isDark}
                    canAdvance={canAdvance}
                    canRewind={canRewind}
                    onAdvance={handleAdvance}
                    onRewind={handleRewind}
                    renderContent={renderCardContent}
                  />
                )}
              </View>
            </View>
            <View style={styles.deckFooter}>
              <Text style={styles.deckProgress}>{currentDeckIndex + 1} / {deckCards.length}</Text>
            </View>
          </View>
        );`;

// We have to replace from `        return (` to `        );` just above `      })()`
const oldReturnRegex = /return \(\s*<View style=\{\{ flex: 1 \}\}>\s*<ScrollView showsVerticalScrollIndicator=\{false\}>[\s\S]*?<\/ScrollView>\s*<\/View>\s*\);/m;
code = code.replace(oldReturnRegex, newDeckView);

// Chunk 5: Append styles
const stylesToAppend = `
  deckOverlay: { flex: 1, backgroundColor: '#000' },
  deckHeader: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  deckBackBtn: { width: 40, height: 40, justifyContent: 'center' },
  deckHeaderTitle: { fontFamily: FONTS.editorial, fontSize: 18, color: '#FAF8F2' },
  deckArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardStack: { width: CARD_WIDTH, height: CARD_HEIGHT },
  cardAbsolute: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cardBehind: { transform: [{ scale: 0.96 }] },
  compatCardContainer: { flex: 1, borderRadius: 28, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 },
  compatCardGradient: { flex: 1 },
  deckFooter: { paddingBottom: 40, alignItems: 'center' },
  deckProgress: { fontFamily: FONTS.sansSemiBold, fontSize: 12, letterSpacing: 2, color: 'rgba(250,248,242,0.5)' },
});`;

code = code.replace(/}\);\s*$/, stylesToAppend);

fs.writeFileSync(path, code);
console.log('Swipe deck applied!');
