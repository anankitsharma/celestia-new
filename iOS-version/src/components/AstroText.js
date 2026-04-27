import React, { useState } from 'react';
import { Text, TouchableOpacity, View, Modal, StyleSheet } from 'react-native';
import { T, FONTS } from '../constants/theme';

const ASTRO_TERMS = {
  'conjunction': 'Two planets at the same degree (0°). Intensifies and merges their energies together.',
  'trine': 'A harmonious 120° angle. Brings natural ease, flow, and gifts.',
  'square': 'A tense 90° angle. Creates friction that pushes growth.',
  'opposition': 'Two planets 180° apart. Awareness through contrast and polarity.',
  'sextile': 'A friendly 60° angle. Opportunities that need a little effort to unlock.',
  'quincunx': 'A 150° angle of adjustment. Two energies that don\'t naturally understand each other.',
  'retrograde': 'A planet appearing to move backward. Time for review and reflection, not new starts.',
  'mercury retrograde': 'Mercury appears to move backward. Communication and tech may feel glitchy — slow down and review.',
  'venus retrograde': 'Venus appears to move backward. Old loves resurface. Reflect on what you truly value.',
  'mars retrograde': 'Mars appears to move backward. Energy dips. Rethink your approach before pushing forward.',
  'saturn return': 'Saturn returns to its birth position (~age 29). A major coming-of-age moment.',
  'new moon': 'The Moon is dark — a time for setting intentions and planting seeds.',
  'full moon': 'The Moon is fully illuminated — a time of culmination, release, and clarity.',
  'waxing': 'The Moon is growing in light. Energy is building — take action.',
  'waning': 'The Moon is losing light. Time to release, rest, and reflect.',
  'ascendant': 'Your rising sign. How the world sees you and your first impression.',
  'rising sign': 'Same as Ascendant. The sign on the eastern horizon at birth — your outer self.',
  'midheaven': 'The top of your chart. Your public reputation, career, and life direction.',
  'north node': 'Your growth direction in this life. What you\'re learning to become.',
  'south node': 'Your past-life comfort zone. Gifts you already have but need to move beyond.',
  'natal': 'Relating to your birth chart — the snapshot of the sky when you were born.',
  'transit': 'A planet\'s current position in the sky and how it interacts with your birth chart.',
  'synastry': 'Comparing two birth charts to understand relationship dynamics.',
  'houses': 'The 12 life areas in your chart: self, money, communication, home, creativity, health, relationships, transformation, travel, career, community, and spirituality.',
  'cardinal': 'Signs that initiate: Aries, Cancer, Libra, Capricorn. Leaders and starters.',
  'fixed': 'Signs that sustain: Taurus, Leo, Scorpio, Aquarius. Steady and determined.',
  'mutable': 'Signs that adapt: Gemini, Virgo, Sagittarius, Pisces. Flexible and versatile.',
  'fire sign': 'Aries, Leo, Sagittarius. Passionate, bold, and action-oriented.',
  'earth sign': 'Taurus, Virgo, Capricorn. Grounded, practical, and reliable.',
  'air sign': 'Gemini, Libra, Aquarius. Intellectual, social, and communicative.',
  'water sign': 'Cancer, Scorpio, Pisces. Emotional, intuitive, and deeply feeling.',
  'ingress': 'When a planet moves into a new zodiac sign — a shift in energy.',
  'orb': 'How close an aspect is to exact. Tighter orb = stronger effect.',
  'stellium': 'Three or more planets in the same sign or house. A major concentration of energy.',
  'void of course': 'The Moon makes no more aspects before changing signs. Avoid starting new things.',
};

// Build a regex from all terms, sorted longest first to match multi-word terms first
const termKeys = Object.keys(ASTRO_TERMS).sort((a, b) => b.length - a.length);
const termPattern = new RegExp(`\\b(${termKeys.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');

const AstroText = ({ text, style, termStyle }) => {
  const [tooltip, setTooltip] = useState(null);

  if (!text) return null;

  const parts = [];
  let lastIndex = 0;
  let match;

  // Reset regex
  termPattern.lastIndex = 0;

  while ((match = termPattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    // Add the matched term
    const matchedText = match[0];
    const termKey = matchedText.toLowerCase();
    const definition = ASTRO_TERMS[termKey];
    if (definition) {
      parts.push({ type: 'term', value: matchedText, definition });
    } else {
      parts.push({ type: 'text', value: matchedText });
    }
    lastIndex = match.index + matchedText.length;
  }
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  // If no terms found, just render plain text
  if (parts.every(p => p.type === 'text')) {
    return <Text style={style}>{text}</Text>;
  }

  return (
    <>
      <Text style={style}>
        {parts.map((part, i) => {
          if (part.type === 'term') {
            return (
              <Text
                key={i}
                style={[styles.term, termStyle]}
                onPress={() => setTooltip({ term: part.value, definition: part.definition })}
              >
                {part.value}
              </Text>
            );
          }
          return <Text key={i}>{part.value}</Text>;
        })}
      </Text>

      {/* Tooltip modal */}
      <Modal visible={!!tooltip} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setTooltip(null)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.termTitle}>{tooltip?.term}</Text>
            <Text style={styles.termDef}>{tooltip?.definition}</Text>
            <Text style={styles.dismiss}>Tap anywhere to close</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  term: { color: T.gold, textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: 'rgba(200,168,75,0.4)' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  sheet: { backgroundColor: T.cream, borderRadius: 16, padding: 20, maxWidth: 320, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24 },
  termTitle: { fontFamily: FONTS.serif, fontSize: 18, color: T.navy, marginBottom: 8, textTransform: 'capitalize' },
  termDef: { fontSize: 14, color: T.ink, lineHeight: 22, marginBottom: 12 },
  dismiss: { fontSize: 11, color: T.stone, textAlign: 'center' },
});

export default AstroText;
