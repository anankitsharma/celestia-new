import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { ShareWatermark } from './ShareCard';

const ELEMENT_COLORS = {
  Fire: '#E87878',
  Earth: '#7EC87E',
  Air: '#A0C8E0',
  Water: '#8090E0',
};

export default function BigThreeShareCard({ name, sun, moon, rising, archetype, comboRarity, elementCounts, innerRef }) {
  const totalElements = elementCounts ? Object.values(elementCounts).reduce((a, b) => a + b, 0) : 0;

  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={['#0E0E22', '#1A1060', '#0C2040']} style={s.card}>
        <Text style={s.label}>MY BIRTH CHART</Text>
        <Text style={s.name}>{name || 'Stargazer'}</Text>

        {/* Big Three */}
        <View style={s.bigThreeRow}>
          {sun && (
            <View style={s.signCard}>
              <Text style={s.signGlyph}>☉</Text>
              <Text style={s.signName}>{sun}</Text>
              <Text style={s.signRole}>SUN</Text>
            </View>
          )}
          {moon && (
            <View style={s.signCard}>
              <Text style={s.signGlyph}>☽</Text>
              <Text style={s.signName}>{moon}</Text>
              <Text style={s.signRole}>MOON</Text>
            </View>
          )}
          {rising && (
            <View style={s.signCard}>
              <Text style={s.signGlyph}>↑</Text>
              <Text style={s.signName}>{rising}</Text>
              <Text style={s.signRole}>RISING</Text>
            </View>
          )}
        </View>

        {/* Element distribution */}
        {elementCounts && totalElements > 0 && (
          <View style={s.elementSection}>
            {['Fire', 'Earth', 'Air', 'Water'].map(el => {
              const pct = Math.round((elementCounts[el] / totalElements) * 100);
              return (
                <View key={el} style={s.elementRow}>
                  <Text style={s.elementLabel}>{el}</Text>
                  <View style={s.elementTrack}>
                    <View style={[s.elementFill, { width: `${pct}%`, backgroundColor: ELEMENT_COLORS[el] }]} />
                  </View>
                  <Text style={s.elementPct}>{pct}%</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Archetype + rarity */}
        {archetype && (
          <View style={s.archetypeSection}>
            <Text style={s.archetypeName}>{archetype.name}</Text>
            {archetype.rarity && (
              <View style={s.rarityPill}>
                <Text style={s.rarityText}>{archetype.rarity}</Text>
              </View>
            )}
          </View>
        )}

        {/* Combo rarity */}
        {comboRarity && (
          <Text style={s.comboRarity}>Your Big Three: {comboRarity.text} — {comboRarity.label}</Text>
        )}

        <ShareWatermark />
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  outer: { width: 320, borderRadius: 24, overflow: 'hidden' },
  card: { padding: 28, paddingTop: 32, paddingBottom: 20, position: 'relative', overflow: 'hidden' },
  label: { fontSize: 10, letterSpacing: 2.5, color: 'rgba(200,168,75,0.55)', fontFamily: FONTS.sansSemiBold, marginBottom: 16 },
  name: { fontFamily: FONTS.serif, fontSize: 28, color: T.cream, marginBottom: 20 },
  bigThreeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  signCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: 12, alignItems: 'center' },
  signGlyph: { fontSize: 20, color: 'rgba(200,168,75,0.7)', marginBottom: 4 },
  signName: { fontFamily: FONTS.sansMedium, fontSize: 13, color: T.cream, marginBottom: 2 },
  signRole: { fontSize: 8, letterSpacing: 1.5, color: 'rgba(250,248,242,0.35)' },
  elementSection: { width: '100%', marginBottom: 16 },
  elementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  elementLabel: { width: 40, fontSize: 10, color: 'rgba(250,248,242,0.45)' },
  elementTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginHorizontal: 8, overflow: 'hidden' },
  elementFill: { height: 4, borderRadius: 2 },
  elementPct: { width: 30, fontSize: 10, color: 'rgba(250,248,242,0.45)', textAlign: 'right' },
  archetypeSection: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  archetypeName: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 16, color: T.cream, fontStyle: 'italic' },
  rarityPill: { borderWidth: 1, borderColor: 'rgba(200,168,75,0.35)', borderRadius: 100, paddingVertical: 3, paddingHorizontal: 10 },
  rarityText: { fontSize: 9, color: T.gold, fontFamily: FONTS.sansSemiBold, letterSpacing: 0.5 },
  comboRarity: { fontSize: 11, color: T.gold, textAlign: 'center', marginBottom: 4 },
});
