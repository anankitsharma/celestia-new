import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { haptic } from '../services/hapticService';
import { useShareCard } from './ShareCard';
import StreakShareCard from './StreakShareCard';

export default function StreakMilestoneModal({ visible, streak, emoji, message, onDismiss, onShare }) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const { cardRef, captureAndShare } = useShareCard();

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
      haptic.success();
      setTimeout(() => haptic.heavy(), 200);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={s.overlay}>
        <Animated.View style={[s.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
          <LinearGradient colors={['#1E1840', '#0E0E22']} style={s.gradient}>
            <Text style={s.label}>STREAK MILESTONE</Text>
            <Text style={s.emoji}>{emoji}</Text>
            <Text style={s.streak}>{streak}</Text>
            <Text style={s.days}>day streak</Text>
            {message && <Text style={s.message}>{message}</Text>}

            <View style={s.btnRow}>
              <TouchableOpacity style={s.shareBtn} activeOpacity={0.85} onPress={async () => {
                haptic.light();
                await captureAndShare(`${emoji} ${streak}-day cosmic streak! ${message || ''}`);
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
          <StreakShareCard streak={streak} emoji={emoji} message={message} innerRef={cardRef} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 40 },
  card: { width: '100%', maxWidth: 300, borderRadius: 28, overflow: 'hidden' },
  gradient: { padding: 36, alignItems: 'center' },
  label: { fontSize: 10, letterSpacing: 2.5, color: 'rgba(200,168,75,0.7)', fontFamily: FONTS.sansSemiBold, marginBottom: 16 },
  emoji: { fontSize: 48, marginBottom: 4 },
  streak: { fontFamily: FONTS.serif, fontSize: 56, color: T.gold, lineHeight: 64 },
  days: { fontSize: 14, color: 'rgba(250,248,242,0.45)', marginBottom: 12 },
  message: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 15, color: T.cream, textAlign: 'center', lineHeight: 22, fontStyle: 'italic', marginBottom: 20 },
  btnRow: { flexDirection: 'row', gap: 10 },
  shareBtn: { backgroundColor: T.gold, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28 },
  shareBtnText: { fontFamily: FONTS.sansMedium, fontSize: 14, color: T.navy },
  btn: { backgroundColor: 'rgba(200,168,75,0.18)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.35)', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28 },
  btnText: { fontFamily: FONTS.sansMedium, fontSize: 14, color: T.gold },
  offscreen: { position: 'absolute', left: -9999 },
});
