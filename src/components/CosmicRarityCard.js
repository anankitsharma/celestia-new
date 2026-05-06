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

export default function CosmicRarityCard({ archetype, comboRarity, innerRef }) {
  const totalElements = archetype?.elementCounts
    ? Object.values(archetype.elementCounts).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <View ref={innerRef} collapsable={false} style={s.outer}>
      <LinearGradient colors={['#3A1A28', '#1A0A2E', '#0C1040']} style={s.card}>
        <Text style={s.label}>COSMIC ARCHETYPE</Text>

        {/* Archetype name */}
        <Text style={s.name}>{archetype?.name}</Text>

        {/* Tagline */}
        {archetype?.tagline && (
          <Text style={s.tagline}>"{archetype.tagline}"</Text>
        )}

        {/* Rarity badge */}
        {archetype?.rarity && (
          <View style={s.rarityPill}>
            <Text style={s.rarityText}>{archetype.rarity}</Text>
          </View>
        )}

        {/* Element distribution */}
        {archetype?.elementCounts && totalElements > 0 && (
          <View style={s.elementSection}>
            {['Fire', 'Earth', 'Air', 'Water'].map(el => {
              const pct = Math.round((archetype.elementCounts[el] / totalElements) * 100);
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
  card: { padding: 28, paddingBottom: 20, alignItems: 'center' },
  label: { fontSize: 9, letterSpacing: 2.5, color: 'rgba(200,168,75,0.55)', fontFamily: FONTS.sansSemiBold, marginBottom: 16 },
  name: { fontFamily: FONTS.serif, fontSize: 26, color: T.gold, textAlign: 'center', marginBottom: 8 },
  tagline: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 14, color: T.cream, textAlign: 'center', lineHeight: 22, fontStyle: 'italic', marginBottom: 12 },
  rarityPill: { borderWidth: 1, borderColor: 'rgba(200,168,75,0.35)', borderRadius: 100, paddingVertical: 4, paddingHorizontal: 14, marginBottom: 16 },
  rarityText: { fontSize: 10, color: T.gold, fontFamily: FONTS.sansSemiBold, letterSpacing: 0.5 },
  elementSection: { width: '100%', marginBottom: 12 },
  elementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  elementLabel: { width: 40, fontSize: 10, color: 'rgba(250,248,242,0.45)' },
  elementTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginHorizontal: 8, overflow: 'hidden' },
  elementFill: { height: 4, borderRadius: 2 },
  elementPct: { width: 30, fontSize: 10, color: 'rgba(250,248,242,0.45)', textAlign: 'right' },
  comboRarity: { fontSize: 11, color: T.gold, textAlign: 'center', marginBottom: 4 },
});
