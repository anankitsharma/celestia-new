import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { getStreakEmoji } from '../services/streakService';

export default function WelcomeBackModal({ visible, onDismiss, streakData, moonData }) {
  if (!visible || !streakData) return null;

  const { daysAbsent, current_streak, streakBroken, longest_streak, comebackBonus } = streakData;
  const emoji = getStreakEmoji(current_streak);
  const hasComeback = comebackBonus > 0;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <Pressable style={s.overlay} onPress={onDismiss}>
        <Pressable style={s.card} onPress={() => {}}>
          <LinearGradient colors={['#5A2840', '#3A1A28']} style={s.hero}>
            <TouchableOpacity
              style={s.closeBtn}
              onPress={onDismiss}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close">
              <Text style={s.closeIcon}>×</Text>
            </TouchableOpacity>
            <Text style={s.heroEmoji}>{hasComeback ? '✦' : '✧'}</Text>
            <Text style={s.heroTitle}>
              {hasComeback ? 'The Stars Remember You' : 'The Stars Missed You'}
            </Text>
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
                  hasComeback ? (
                    <>
                      <Text style={s.streakLabel}>Streak Restored</Text>
                      <Text style={s.streakSub}>
                        Your {longest_streak}-day streak earned a comeback bonus. Starting at {comebackBonus}!
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={s.streakLabel}>Streak Reset</Text>
                      <Text style={s.streakSub}>
                        Your {longest_streak}-day streak ended. Starting fresh at {current_streak}!
                      </Text>
                    </>
                  )
                ) : (
                  <>
                    <Text style={s.streakLabel}>{current_streak}-Day Streak</Text>
                    <Text style={s.streakSub}>Your cosmic shield kept your streak alive!</Text>
                  </>
                )}
              </View>
            </View>

            {/* Comeback bonus callout */}
            {hasComeback && (
              <View style={s.bonusRow}>
                <Text style={s.bonusIcon}>✦</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.bonusLabel}>2x Stardust Today</Text>
                  <Text style={s.bonusSub}>Welcome back bonus — all XP doubled this session</Text>
                </View>
              </View>
            )}

            {/* Streak freezes info */}
            {streakData.streak_freezes_remaining > 0 && (
              <View style={s.freezeRow}>
                <Text style={s.freezeIcon}>🛡</Text>
                <Text style={s.freezeText}>
                  {streakData.streak_freezes_remaining} cosmic shield{streakData.streak_freezes_remaining > 1 ? 's' : ''} available
                </Text>
              </View>
            )}

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
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  card: { width: '100%', maxWidth: 340, borderRadius: 24, overflow: 'hidden', backgroundColor: T.cream },
  hero: { padding: 28, alignItems: 'center' },
  closeBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(250,248,242,0.12)', zIndex: 2 },
  closeIcon: { fontSize: 22, lineHeight: 24, color: T.cream, fontFamily: FONTS.sans },
  heroEmoji: { fontSize: 36, color: T.gold, marginBottom: 12 },
  heroTitle: { fontFamily: FONTS.serif, fontSize: 24, color: T.cream, textAlign: 'center', marginBottom: 8 },
  heroSub: { fontSize: 13, color: 'rgba(250,248,242,0.55)', textAlign: 'center', lineHeight: 20 },
  body: { padding: 22 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: T.warm, borderRadius: 14, padding: 14, marginBottom: 14 },
  streakEmoji: { fontSize: 28 },
  streakLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: T.navy, marginBottom: 2 },
  streakSub: { fontSize: 12, color: T.stone, lineHeight: 18 },
  bonusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(200,168,75,0.1)', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)' },
  bonusIcon: { fontSize: 20, color: T.gold },
  bonusLabel: { fontFamily: FONTS.sansSemiBold, fontSize: 13, color: T.gold },
  bonusSub: { fontSize: 11, color: T.stone, marginTop: 1 },
  freezeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingHorizontal: 4 },
  freezeIcon: { fontSize: 14 },
  freezeText: { fontSize: 12, color: T.stone },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, paddingHorizontal: 4 },
  infoIcon: { fontSize: 18 },
  infoText: { fontSize: 13, color: T.stone, flex: 1, lineHeight: 19 },
  readyText: { fontSize: 13, color: T.ink, textAlign: 'center', marginBottom: 18, fontFamily: FONTS.sansMedium },
  btn: { borderRadius: 28, overflow: 'hidden' },
  btnGrad: { height: 52, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: FONTS.sansSemiBold, fontSize: 15, color: T.navy },
});
