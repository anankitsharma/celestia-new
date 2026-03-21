import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

// Tooltip content database
const TOOLTIP_DATA = {
  // ── Big Three ──
  sun_sign: {
    title: 'Sun Sign ☉',
    body: 'Your core identity and ego. The Sun represents who you are becoming — your conscious self, vitality, and life purpose. It takes ~30 days to move through each sign.',
  },
  moon_sign: {
    title: 'Moon Sign ☽',
    body: 'Your emotional inner world. The Moon governs how you process feelings, what makes you feel safe, and your instinctive reactions. It changes signs every ~2.5 days.',
  },
  rising_sign: {
    title: 'Rising Sign (Ascendant)',
    body: 'Your social mask and first impression. The Rising sign was on the eastern horizon at your birth. It shapes how others perceive you and how you approach new situations.',
  },

  // ── Planets ──
  mercury: {
    title: 'Mercury ☿',
    body: 'How you think, speak, and process information. Mercury rules communication, learning, and short trips. Its sign shows your mental style and how you express ideas.',
  },
  venus: {
    title: 'Venus ♀',
    body: 'How you love, what you value, and what attracts you. Venus rules relationships, beauty, and pleasure. Its sign reveals your love language and aesthetic taste.',
  },
  mars: {
    title: 'Mars ♂',
    body: 'Your drive, ambition, and how you take action. Mars rules energy, desire, and conflict. Its sign shows how you assert yourself and pursue what you want.',
  },
  jupiter: {
    title: 'Jupiter ♃',
    body: 'Where you find luck, growth, and abundance. Jupiter expands everything it touches. Its sign and house show where life opens doors for you.',
  },
  saturn: {
    title: 'Saturn ♄',
    body: 'Your life lessons, discipline, and long-term mastery. Saturn shows where you face challenges that build character. Hard at first, rewarding with time.',
  },
  uranus: {
    title: 'Uranus ♅',
    body: 'Where you break the mold and seek freedom. Uranus rules innovation, rebellion, and sudden change. Its house shows where you need to be uniquely yourself.',
  },
  neptune: {
    title: 'Neptune ♆',
    body: 'Your imagination, spirituality, and blind spots. Neptune dissolves boundaries — it rules dreams, intuition, and creativity, but also confusion and escapism.',
  },
  pluto: {
    title: 'Pluto ♇',
    body: 'Deep transformation and power. Pluto destroys what no longer serves you so something stronger can emerge. Its house shows where you experience profound rebirth.',
  },
  north_node: {
    title: 'North Node ☊',
    body: 'Your soul\'s growth direction this lifetime. The North Node points to qualities you\'re learning to develop — it feels uncomfortable but deeply fulfilling.',
  },
  south_node: {
    title: 'South Node ☋',
    body: 'Your past-life comfort zone. Gifts and habits you already have but need to move beyond. Leaning on it too much keeps you stuck.',
  },
  chiron: {
    title: 'Chiron ⚷',
    body: 'Your deepest wound and greatest healing gift. Where Chiron sits, you carry a vulnerability — but through healing it, you gain the power to heal others.',
  },
  midheaven: {
    title: 'Midheaven (MC)',
    body: 'The top of your chart — your public reputation, career path, and legacy. The sign here shapes how the world sees your achievements and ambitions.',
  },

  // ── Aspects ──
  aspects: {
    title: 'Aspects',
    body: 'Geometric angles between planets. Trines (120°) and sextiles (60°) flow easily. Squares (90°) and oppositions (180°) create tension that drives growth.',
  },
  conjunction: {
    title: 'Conjunction (0°)',
    body: 'Two planets merging their energies. The most powerful aspect — it fuses the planets\' qualities together. Can be harmonious or intense depending on the planets.',
  },
  trine: {
    title: 'Trine (120°)',
    body: 'A harmonious flow between two planets. Trines bring natural talent and ease — things just work. The risk is taking these gifts for granted.',
  },
  sextile: {
    title: 'Sextile (60°)',
    body: 'A friendly opportunity aspect. Sextiles offer potential that activates when you put in a little effort. Less automatic than trines but very supportive.',
  },
  square: {
    title: 'Square (90°)',
    body: 'Creative tension between two planets. Squares push you to grow through challenges. They\'re uncomfortable but are the engine of personal development.',
  },
  opposition: {
    title: 'Opposition (180°)',
    body: 'Two planets pulling in opposite directions. Oppositions create awareness through contrast — like a mirror. The lesson is finding balance, not choosing sides.',
  },
  orb: {
    title: 'Orb',
    body: 'The margin of exactness for an aspect. An orb of 0° is exact (most powerful). Wider orbs (3-5°) mean the aspect is present but softer.',
  },

  // ── Houses ──
  houses: {
    title: 'Houses',
    body: 'The 12 houses are life areas (career, love, home, etc.). Planets in a house activate that life area. The sign on the house cusp colors how you experience it.',
  },
  house_1: {
    title: 'House 1 — Self & Identity',
    body: 'Your physical body, appearance, and how you present yourself to the world. Planets here strongly shape your personality and first impressions.',
  },
  house_2: {
    title: 'House 2 — Money & Values',
    body: 'Your relationship with money, possessions, and self-worth. Planets here influence how you earn, spend, and what you consider truly valuable.',
  },
  house_3: {
    title: 'House 3 — Mind & Communication',
    body: 'How you think, speak, and learn. Also rules siblings, neighbors, and short trips. Planets here make you curious, talkative, or restless.',
  },
  house_4: {
    title: 'House 4 — Home & Roots',
    body: 'Your private life, family, emotional foundation, and sense of belonging. Planets here reveal what "home" means to you on a soul level.',
  },
  house_5: {
    title: 'House 5 — Creativity & Romance',
    body: 'Self-expression, fun, romance, and children. Planets here bring creative talent, a love of play, and show how you experience joy and dating.',
  },
  house_6: {
    title: 'House 6 — Health & Habits',
    body: 'Daily routines, work habits, and physical health. Planets here show how you approach wellness, service to others, and the structure of everyday life.',
  },
  house_7: {
    title: 'House 7 — Relationships',
    body: 'Partnerships, marriage, and one-on-one dynamics. Planets here reveal what you seek in a partner and how you behave in committed relationships.',
  },
  house_8: {
    title: 'House 8 — Transformation',
    body: 'Deep intimacy, shared resources, and psychological rebirth. Planets here bring intensity — you\'re drawn to what lies beneath the surface.',
  },
  house_9: {
    title: 'House 9 — Travel & Philosophy',
    body: 'Higher education, long-distance travel, beliefs, and meaning. Planets here give you a hunger for wisdom, adventure, and expanding your worldview.',
  },
  house_10: {
    title: 'House 10 — Career & Legacy',
    body: 'Your public reputation, ambition, and life direction. Planets here shape your career path and how the world recognizes your achievements.',
  },
  house_11: {
    title: 'House 11 — Community & Hopes',
    body: 'Friends, groups, social causes, and your vision for the future. Planets here connect you to communities and drive your ideals.',
  },
  house_12: {
    title: 'House 12 — Spirituality & Closure',
    body: 'The unconscious, hidden patterns, solitude, and spiritual life. Planets here work behind the scenes — powerful but often invisible to you.',
  },

  // ── Concepts ──
  retrograde: {
    title: 'Retrograde ℞',
    body: 'When a planet appears to move backward in the sky (it doesn\'t actually reverse). Retrograde periods are times for review, revision, and reflection in the areas that planet governs.',
  },
  transit: {
    title: 'Transit',
    body: 'A transit is when a planet in the sky today forms an angle to a planet in your birth chart. It temporarily activates that area of your chart.',
  },
  synastry: {
    title: 'Synastry',
    body: 'The art of comparing two birth charts to understand relationship dynamics. It reveals where you connect easily, where tension exists, and the deeper purpose of the bond.',
  },
  cosmic_window: {
    title: 'Cosmic Window',
    body: 'When a slow-moving planet (Jupiter through Pluto) enters your Sun, Moon, or Rising sign. These are rare, significant periods that can last months or years.',
  },
  mercury_rx: {
    title: 'Mercury Retrograde',
    body: 'Mercury appears to move backward 3-4 times per year for ~3 weeks. Communication, travel, and technology may glitch. Best for reviewing, not starting new things.',
  },
  moon_phase: {
    title: 'Moon Phase',
    body: 'The Moon\'s shape reflects its cycle: New Moon (set intentions), Waxing (build momentum), Full Moon (harvest and release), Waning (rest and reflect). Each phase lasts ~7 days.',
  },
  elements: {
    title: 'Elements',
    body: 'The four elements describe energy styles: Fire (passion, action), Earth (stability, practicality), Air (intellect, communication), Water (emotion, intuition). Your chart\'s element balance shapes your temperament.',
  },
  modalities: {
    title: 'Modalities',
    body: 'Three modes of operating: Cardinal signs (Aries, Cancer, Libra, Capricorn) initiate. Fixed signs (Taurus, Leo, Scorpio, Aquarius) sustain. Mutable signs (Gemini, Virgo, Sagittarius, Pisces) adapt.',
  },
  whole_sign: {
    title: 'Whole Sign Houses',
    body: 'A house system where each sign equals one whole house. It\'s the oldest system in astrology (used by Hellenistic astrologers) and gives clean, intuitive house placements.',
  },
};

/**
 * CosmicTooltip — A small "?" button that opens a modal with educational content.
 * Usage: <CosmicTooltip id="sun_sign" />
 */
export default function CosmicTooltip({ id, size = 16, color = T.stone, light = false }) {
  const [visible, setVisible] = useState(false);
  const { colors, isDark } = useTheme();
  const data = TOOLTIP_DATA[id];

  if (!data) return null;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.trigger,
          { width: size + 4, height: size + 4 },
          light ? styles.triggerLight : { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
        ]}
        onPress={() => setVisible(true)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={[styles.triggerText, { fontSize: size - 4, color: light ? 'rgba(250,248,242,0.4)' : (isDark ? colors.textMuted : color) }]}>?</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={[styles.overlay, { backgroundColor: colors.modalOverlay }]} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={[styles.card, { backgroundColor: colors.modalBg }]}>
            {/* Gold accent bar */}
            <View style={{ height: 3, backgroundColor: colors.gold, borderRadius: 2, marginBottom: 14, width: 40 }} />
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.heading }]}>{data.title}</Text>
              <TouchableOpacity onPress={() => setVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={{ fontSize: 16, color: colors.textMuted, padding: 4 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.body, { color: colors.text }]}>{data.body}</Text>
            <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 12, fontStyle: 'italic' }}>Tap anywhere to close</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderRadius: 100,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  triggerText: {
    fontFamily: FONTS.sansSemiBold,
  },
  triggerLight: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  card: {
    backgroundColor: T.cream,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: FONTS.serif,
    fontSize: 20,
    color: T.navy,
  },
  body: {
    fontSize: 14,
    color: T.ink,
    lineHeight: 22,
  },
});
