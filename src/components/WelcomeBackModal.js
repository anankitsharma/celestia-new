import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { getStreakEmoji } from '../services/streakService';

export default function WelcomeBackModal({ visible, onDismiss, streakData, moonData }) {
  if (!visible || !streakData) return null;

  const { daysAbsent, current_streak, streakBroken, longest_streak } = streakData;
  const emoji = getStreakEmoji(current_streak);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={s.overlay}>
        <View style={s.card}>
          <LinearGradient colors={['#1A1535', '#0E0E22']} style={s.hero}>
            <Text style={s.heroEmoji}>{'✧'}</Text>
            <Text style={s.heroTitle}>The Stars Missed You</Text>
            <Text style={s.heroSub}>
              {daysAbsent > 1
                ? `The cosmos kept moving while you were away for ${daysAbsent} days.`
                : 'Welcome back to the cosmos.'}
            </Text>
          </LinearGradient>

          <View style={s.body}>
            {/* Streak status */}
            <View style={s.streakRow}>
              <Text style={s.streakEmoji}>{emoji}</Text>
              <View style={{ flex: 1 }}>
                {streakBroken ? (
                  <>
                    <Text style={s.streakLabel}>Streak Reset</Text>
                    <Text style={s.streakSub}>
                      Your {longest_streak}-day streak ended. Starting fresh at {current_streak}!
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={s.streakLabel}>{current_streak}-Day Streak</Text>
                    <Text style={s.streakSub}>Your cosmic shield kept your streak alive!</Text>
                  </>
                )}
              </View>
            </View>

            {/* Moon phase */}
            {moonData && (
              <View style={s.infoRow}>
                <Text style={s.infoIcon}>☽</Text>
                <Text style={s.infoText}>
                  The Moon is in <Text style={{ fontFamily: FONTS.sansMedium, color: T.navy }}>{moonData.sign}</Text> ({moonData.phaseName})
                </Text>
              </View>
            )}

            {/* Today's reading CTA */}
            <Text style={s.readyText}>Your fresh cosmic reading is ready.</Text>

            <TouchableOpacity style={s.btn} activeOpacity={0.85} onPress={onDismiss}>
              <LinearGradient
                colors={['#E2C46A', '#C8A84B', '#A07820']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={s.btnGrad}>
                <Text style={s.btnText}>See Today's Reading</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  card: { width: '100%', maxWidth: 340, borderRadius: 24, overflow: 'hidden', backgroundColor: T.cream },
  hero: { padding: 28, alignItems: 'center' },
  heroEmoji: { fontSize: 36, color: T.gold, marginBottom: 12 },
  heroTitle: { fontFamily: FONTS.serif, fontSize: 24, color: T.cream, textAlign: 'center', marginBottom: 8 },
  heroSub: { fontSize: 13, color: 'rgba(250,248,242,0.55)', textAlign: 'center', lineHeight: 20 },
  body: { padding: 22 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: T.warm, borderRadius: 14, padding: 14, marginBottom: 14 },
  streakEmoji: { fontSize: 28 },
  streakLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: T.navy, marginBottom: 2 },
  streakSub: { fontSize: 12, color: T.stone, lineHeight: 18 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, paddingHorizontal: 4 },
  infoIcon: { fontSize: 18 },
  infoText: { fontSize: 13, color: T.stone, flex: 1, lineHeight: 19 },
  readyText: { fontSize: 13, color: T.ink, textAlign: 'center', marginBottom: 18, fontFamily: FONTS.sansMedium },
  btn: { borderRadius: 28, overflow: 'hidden' },
  btnGrad: { height: 52, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: T.navy },
});
