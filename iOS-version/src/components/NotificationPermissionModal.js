import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';

const BENEFITS = [
  { glyph: '☉', title: 'Morning briefing', sub: 'A short read tied to your patterns' },
  { glyph: '☽', title: 'Moon phase alerts', sub: 'Know when the energy shifts' },
  { glyph: '✦', title: 'Transit windows', sub: 'Catch rare alignments before they pass' },
];

export default function NotificationPermissionModal({ visible, onEnable, onDismiss }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.overlay}>
        <View style={s.card}>
          <LinearGradient colors={['#3A1A28', '#5A2840', '#1F0F18']} style={s.gradient}>
            {/* Header */}
            <Text style={s.icon}>🔔</Text>
            <Text style={s.title}>Stay in tune with your day</Text>
            <Text style={s.sub}>
              A short, personalized briefing every morning — based on your actual chart.
            </Text>

            {/* Benefits */}
            <View style={s.benefits}>
              {BENEFITS.map((b, i) => (
                <View key={i} style={s.benefitRow}>
                  <View style={s.benefitGlyph}>
                    <Text style={s.glyphText}>{b.glyph}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.benefitTitle}>{b.title}</Text>
                    <Text style={s.benefitSub}>{b.sub}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* CTA */}
            <TouchableOpacity activeOpacity={0.85} onPress={onEnable}>
              <LinearGradient colors={['#C8A84B', '#A08030']} style={s.cta}>
                <Text style={s.ctaText}>Enable Notifications</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Dismiss */}
            <TouchableOpacity style={s.dismiss} onPress={onDismiss}>
              <Text style={s.dismissText}>Not now</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 28 },
  card: { width: '100%', maxWidth: 340, borderRadius: 24, overflow: 'hidden' },
  gradient: { padding: 28, paddingTop: 32, paddingBottom: 24, alignItems: 'center' },
  icon: { fontSize: 36, marginBottom: 16 },
  title: { fontFamily: FONTS.serif, fontSize: 24, color: T.cream, textAlign: 'center', marginBottom: 10, lineHeight: 30 },
  sub: { fontSize: 13, color: 'rgba(250,248,242,0.5)', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  benefits: { width: '100%', gap: 14, marginBottom: 28 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  benefitGlyph: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(200,168,75,0.1)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)', alignItems: 'center', justifyContent: 'center' },
  glyphText: { fontSize: 18, color: T.gold },
  benefitTitle: { fontSize: 14, fontFamily: FONTS.sansMedium, color: T.cream, marginBottom: 1 },
  benefitSub: { fontSize: 11, color: 'rgba(250,248,242,0.4)' },
  cta: { borderRadius: 14, paddingVertical: 15, paddingHorizontal: 40, alignItems: 'center' },
  ctaText: { fontSize: 15, fontFamily: FONTS.sansSemiBold, color: 'white' },
  dismiss: { marginTop: 16, padding: 8 },
  dismissText: { fontSize: 13, color: 'rgba(250,248,242,0.35)' },
});
