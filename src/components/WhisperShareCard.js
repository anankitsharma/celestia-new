import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { ShareWatermark } from './ShareCard';

export default function WhisperShareCard({ message, rarity, innerRef }) {
  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={['#0A0520', '#1A0A30', '#050210']} style={s.card}>
        {/* Decorative elements */}
        <Text style={s.starTop}>✧</Text>
        <Text style={s.starBottom}>✧</Text>

        <Text style={s.label}>COSMIC WHISPER</Text>

        <Text style={s.whisper}>"{message}"</Text>

        {/* Rarity badge — only for Rare and Ultra Rare */}
        {rarity && (
          <View style={s.rarityPill}>
            <Text style={s.rarityText}>{rarity} Cosmic Whisper</Text>
          </View>
        )}

        <ShareWatermark />
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { width: 320, borderRadius: 24, overflow: 'hidden' },
  card: { padding: 32, paddingBottom: 20, alignItems: 'center', position: 'relative', overflow: 'hidden' },
  starTop: { position: 'absolute', top: 16, right: 24, fontSize: 16, color: 'rgba(200,168,75,0.15)' },
  starBottom: { position: 'absolute', bottom: 40, left: 24, fontSize: 12, color: 'rgba(200,168,75,0.1)' },
  label: { fontSize: 9, letterSpacing: 2.5, color: 'rgba(200,168,75,0.45)', fontFamily: FONTS.sansSemiBold, marginBottom: 24 },
  whisper: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 18, color: T.cream, textAlign: 'center', lineHeight: 28, fontStyle: 'italic', marginBottom: 20 },
  rarityPill: { borderWidth: 1, borderColor: 'rgba(200,168,75,0.35)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 14, marginBottom: 12 },
  rarityText: { fontSize: 10, color: T.gold, fontFamily: FONTS.sansSemiBold, letterSpacing: 0.5 },
});
