import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../constants/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const GenerationOverlay = React.memo(({ visible, currentStep, totalSteps, onCancel, theme }) => {
  const steps = theme.steps;
  const quotes = theme.quotes;

  const glyphScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.15)).current;
  const ringScale = useRef(new Animated.Value(0.95)).current;
  const stepSlide = useRef(new Animated.Value(0)).current;
  const quoteFade = useRef(new Animated.Value(1)).current;
  const quoteIdx = useRef(0);
  const [quoteText, setQuoteText] = useState(quotes[0] || '');
  const prevStepRef = useRef(0);

  useEffect(() => {
    if (!visible) return;

    glyphScale.setValue(1);
    ringOpacity.setValue(0.15);
    ringScale.setValue(0.95);
    stepSlide.setValue(0);
    quoteFade.setValue(1);
    quoteIdx.current = 0;
    setQuoteText(quotes[0] || '');
    prevStepRef.current = 0;

    const breathe = Animated.loop(Animated.sequence([
      Animated.timing(glyphScale, { toValue: 1.08, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(glyphScale, { toValue: 0.94, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    breathe.start();

    const ringPulse = Animated.loop(Animated.sequence([
      Animated.timing(ringOpacity, { toValue: 0.3, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(ringOpacity, { toValue: 0.08, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    ringPulse.start();

    const ringSc = Animated.loop(Animated.sequence([
      Animated.timing(ringScale, { toValue: 1.04, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(ringScale, { toValue: 0.93, duration: 2800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    ringSc.start();

    const quoteInterval = setInterval(() => {
      Animated.timing(quoteFade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        quoteIdx.current = (quoteIdx.current + 1) % quotes.length;
        setQuoteText(quotes[quoteIdx.current] || '');
        Animated.timing(quoteFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }, 5000);

    return () => {
      breathe.stop();
      ringPulse.stop();
      ringSc.stop();
      clearInterval(quoteInterval);
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    if (currentStep === prevStepRef.current && currentStep === 0) return;
    prevStepRef.current = currentStep;

    stepSlide.setValue(20);
    Animated.parallel([
      Animated.timing(stepSlide, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(glyphScale, { toValue: 1.2, duration: 120, useNativeDriver: true }),
        Animated.spring(glyphScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
      ]),
    ]).start();
  }, [currentStep, visible]);

  if (!visible) return null;

  const step = steps[Math.min(currentStep, steps.length - 1)];
  const progress = totalSteps > 0 ? Math.min((currentStep + 1) / totalSteps, 1) : 0;
  const ac = theme.accent;

  return (
    <Modal visible={true} transparent animationType="fade" statusBarTranslucent>
      <LinearGradient colors={theme.gradient} style={gs.overlayGrad}>
        <Animated.View style={{
          position: 'absolute', width: 280, height: 280, borderRadius: 140,
          borderWidth: 1, borderColor: ac, opacity: ringOpacity,
          transform: [{ scale: ringScale }],
        }} />
        <Animated.View style={{
          position: 'absolute', width: 180, height: 180, borderRadius: 90,
          borderWidth: 1, borderColor: ac, opacity: ringOpacity,
          transform: [{ scale: ringScale }],
        }} />

        <View style={[gs.typeBadge, { borderColor: ac }]}>
          <Text style={[gs.typeBadgeText, { color: ac }]}>{theme.title.toUpperCase()}</Text>
        </View>

        <Animated.Text style={{
          fontSize: 64, color: ac, marginBottom: 24,
          textShadowColor: theme.accentGlow,
          textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30,
          transform: [{ scale: glyphScale }],
        }}>
          {step.icon}
        </Animated.Text>

        <Animated.View style={{ alignItems: 'center', transform: [{ translateY: stepSlide }] }}>
          <Text style={gs.stepLabel}>{step.label}</Text>
          <Text style={gs.stepSub}>{step.sub}</Text>
        </Animated.View>

        <View style={gs.progressTrack}>
          <View style={[gs.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: ac }]} />
        </View>
        <Text style={[gs.progressText, { color: ac }]}>
          Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}
        </Text>

        <View style={gs.timeline}>
          {steps.slice(0, totalSteps).map((s, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <React.Fragment key={i}>
                <View style={[
                  gs.dot,
                  done && { backgroundColor: ac },
                  active && { borderWidth: 1.5, borderColor: ac, backgroundColor: theme.accentSoft },
                  !done && !active && gs.dotPending,
                ]}>
                  {done && <Text style={gs.dotCheck}>✓</Text>}
                  {active && <View style={[gs.dotPulse, { backgroundColor: ac }]} />}
                </View>
                {i < totalSteps - 1 && (
                  <View style={[gs.dotLine, done && { backgroundColor: ac }]} />
                )}
              </React.Fragment>
            );
          })}
        </View>

        <Animated.Text style={[gs.quote, { opacity: quoteFade, color: ac }]}>
          {quoteText}
        </Animated.Text>

        <TouchableOpacity style={gs.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={gs.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Modal>
  );
});

const gs = StyleSheet.create({
  overlayGrad: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 36 },
  typeBadge: { borderWidth: 1, borderRadius: 20, paddingVertical: 5, paddingHorizontal: 16, marginBottom: 32, opacity: 0.7 },
  typeBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 3 },
  stepLabel: { fontFamily: FONTS.serif, fontSize: 21, color: '#FAF8F3', textAlign: 'center', marginBottom: 6, lineHeight: 28 },
  stepSub: { fontSize: 13, color: 'rgba(250,248,242,0.5)', textAlign: 'center', marginBottom: 28 },
  progressTrack: { width: SCREEN_W - 100, height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', borderRadius: 2 },
  progressText: { fontSize: 10, letterSpacing: 1.5, marginBottom: 26, opacity: 0.6 },
  timeline: { flexDirection: 'row', marginBottom: 40, alignItems: 'center' },
  dot: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  dotPending: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  dotCheck: { fontSize: 9, color: '#0D1527', fontWeight: '800' },
  dotPulse: { width: 5, height: 5, borderRadius: 3 },
  dotLine: { width: 8, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  quote: { fontSize: 13, textAlign: 'center', fontStyle: 'italic', lineHeight: 21, paddingHorizontal: 20, opacity: 0.45 },
  cancelBtn: { position: 'absolute', bottom: 50, paddingVertical: 12, paddingHorizontal: 32 },
  cancelText: { fontSize: 14, color: 'rgba(250,248,242,0.35)', letterSpacing: 0.5 },
});

export default GenerationOverlay;
