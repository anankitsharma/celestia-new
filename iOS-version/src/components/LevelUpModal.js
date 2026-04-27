import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { haptic } from '../services/hapticService';
import { useShareCard } from './ShareCard';
import LevelUpShareCard from './LevelUpShareCard';

export default function LevelUpModal({ visible, levelName, totalXP, onDismiss, onShare }) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const { cardRef, captureAndShare } = useShareCard();

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      glowAnim.setValue(0.3);
      haptic.success();
      setTimeout(() => haptic.heavy(), 150);
      setTimeout(() => haptic.medium(), 400);

      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 0.8, duration: 1000, useNativeDriver: true }),
          Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={s.overlay}>
        <Animated.View style={[s.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={['#5A2840', '#3A1A28']} style={s.gradient}>
            <Animated.View style={[s.glowRing, { opacity: glowAnim }]} />

            <Text style={s.label}>LEVEL UP</Text>
            <Text style={s.star}>✦</Text>
            <Text style={s.levelName}>{levelName}</Text>
            <Text style={s.tagline}>You've reached a new tier</Text>

            <View style={s.btnRow}>
              <TouchableOpacity style={s.shareBtn} activeOpacity={0.85} onPress={async () => {
                haptic.light();
                await captureAndShare(`I just reached ${levelName} on Celestia! ✦`);
                if (onShare) onShare();
              }}>
                <Text style={s.shareBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btn} activeOpacity={0.85} onPress={onDismiss}>
                <Text style={s.btnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Offscreen share card */}
        <View style={s.offscreen}>
          <LevelUpShareCard levelName={levelName} totalXP={totalXP} innerRef={cardRef} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  card: { width: '100%', maxWidth: 300, borderRadius: 28, overflow: 'hidden' },
  gradient: { padding: 36, alignItems: 'center' },
  glowRing: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(200,168,75,0.12)', top: 30 },
  label: { fontSize: 10, letterSpacing: 2.5, color: 'rgba(200,168,75,0.7)', fontFamily: FONTS.sansSemiBold, marginBottom: 16 },
  star: { fontSize: 48, color: T.gold, marginBottom: 8 },
  levelName: { fontFamily: FONTS.serif, fontSize: 32, color: T.cream, textAlign: 'center', marginBottom: 8 },
  tagline: { fontSize: 13, color: 'rgba(250,248,242,0.5)', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btnRow: { flexDirection: 'row', gap: 10 },
  shareBtn: { backgroundColor: T.gold, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28 },
  shareBtnText: { fontFamily: FONTS.sansMedium, fontSize: 14, color: T.navy },
  btn: { backgroundColor: 'rgba(200,168,75,0.18)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.35)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28 },
  btnText: { fontFamily: FONTS.sansMedium, fontSize: 14, color: T.gold },
  offscreen: { position: 'absolute', left: -9999 },
});
