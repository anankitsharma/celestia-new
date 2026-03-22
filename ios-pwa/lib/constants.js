// ── Colors (matches native app theme.js) ────────────
export const T = {
  navy:    '#0E0E22',
  navyMid: '#16163A',
  navyLt:  '#1E1E4A',
  gold:    '#C8A84B',
  goldLt:  '#E2C46A',
  goldDim: 'rgba(200,168,75,0.12)',
  cream:   '#FAF8F2',
  warm:    '#F3EDE2',
  stone:   '#97907F',
  ink:     '#2A2418',
  border:  '#EAE3D6',
  white:   '#FFFFFF',
};

// ── Zodiac ──────────────────────────────────────────
export const ZodiacSign = {
  Aries: 'Aries', Taurus: 'Taurus', Gemini: 'Gemini',
  Cancer: 'Cancer', Leo: 'Leo', Virgo: 'Virgo',
  Libra: 'Libra', Scorpio: 'Scorpio', Sagittarius: 'Sagittarius',
  Capricorn: 'Capricorn', Aquarius: 'Aquarius', Pisces: 'Pisces',
};

export const ZODIAC_SIGNS = Object.values(ZodiacSign);

export const PlanetName = {
  Sun: 'Sun', Moon: 'Moon', Mercury: 'Mercury', Venus: 'Venus',
  Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn',
  Uranus: 'Uranus', Neptune: 'Neptune', Pluto: 'Pluto',
  Ascendant: 'Ascendant', Midheaven: 'Midheaven',
  NorthNode: 'North Node', SouthNode: 'South Node', Chiron: 'Chiron',
};

export const ProfileType = {
  self: 'self', friend: 'friend', partner: 'partner',
  family: 'family', other: 'other',
};

// ── Sign ↔ Element/Modality ─────────────────────────
export const SIGN_ELEMENTS = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

export const SIGN_MODALITIES = {
  Aries: 'Cardinal', Cancer: 'Cardinal', Libra: 'Cardinal', Capricorn: 'Cardinal',
  Taurus: 'Fixed', Leo: 'Fixed', Scorpio: 'Fixed', Aquarius: 'Fixed',
  Gemini: 'Mutable', Virgo: 'Mutable', Sagittarius: 'Mutable', Pisces: 'Mutable',
};

// ── House Themes ────────────────────────────────────
export const HOUSE_THEMES = {
  1: 'Self & Identity', 2: 'Money & Values', 3: 'Mind & Communication',
  4: 'Home & Roots', 5: 'Creativity & Romance', 6: 'Health & Habits',
  7: 'Relationships & Marriage', 8: 'Intimacy & Transformation',
  9: 'Travel & Philosophy', 10: 'Career & Public Life',
  11: 'Friends & Hopes', 12: 'Spirituality & Closure',
};

export const HOUSE_FRIENDLY = {
  1:  { name: 'Your Front Door', emoji: '\ud83e\ude9e', desc: 'How you walk into a room. First impressions. The mask you wear.' },
  2:  { name: 'Your Wallet', emoji: '\ud83d\udcb0', desc: 'Money, possessions, self-worth. What you value \u2014 literally.' },
  3:  { name: 'Your Voice', emoji: '\ud83d\udcac', desc: 'Communication, siblings, daily thoughts. How your brain works on autopilot.' },
  4:  { name: 'Your Roots', emoji: '\ud83c\udfe0', desc: 'Home, family, childhood. Where you go to recharge.' },
  5:  { name: 'Your Playground', emoji: '\ud83c\udfa8', desc: 'Fun, creativity, romance, dating. Where you express joy.' },
  6:  { name: 'Your Daily Grind', emoji: '\u2699\ufe0f', desc: 'Work, health, routines. Your relationship with productivity.' },
  7:  { name: 'Your Mirror', emoji: '\ud83d\udc95', desc: 'Partnerships, relationships. Who you\'re drawn to and why.' },
  8:  { name: 'Your Depths', emoji: '\ud83d\udd2e', desc: 'Intimacy, transformation, shared resources. The things you don\'t talk about.' },
  9:  { name: 'Your Horizon', emoji: '\u2708\ufe0f', desc: 'Travel, philosophy, beliefs. The big questions.' },
  10: { name: 'Your Legacy', emoji: '\ud83c\udfc6', desc: 'Career, public image, ambition. What you want to be known for.' },
  11: { name: 'Your Tribe', emoji: '\ud83d\udc65', desc: 'Friends, community, hopes. Where you fit in the bigger picture.' },
  12: { name: 'Your Blind Spot', emoji: '\ud83c\udf0a', desc: 'The unconscious, hidden patterns, dreams. What you can\'t see about yourself.' },
};

// ── Symbols ─────────────────────────────────────────
export const PLANET_SYMBOLS = {
  Sun: '\u2609', Moon: '\u263d', Mercury: '\u263f', Venus: '\u2640', Mars: '\u2642',
  Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645', Neptune: '\u2646', Pluto: '\u2647',
  Ascendant: 'AC', Midheaven: 'MC',
  'North Node': '\u260a', 'South Node': '\u260b', Chiron: '\u26b7',
};

export const ZODIAC_SYMBOLS = {
  Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264a', Cancer: '\u264b',
  Leo: '\u264c', Virgo: '\u264d', Libra: '\u264e', Scorpio: '\u264f',
  Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653',
};

export const ELEMENT_COLORS = {
  Fire: '#E6A8A1', Earth: '#A3C4A5', Air: '#F2C6A0', Water: '#A3C4DF',
};

// ── Life Areas ──────────────────────────────────────
export const LIFE_AREAS = [
  { key: 'love', label: 'Love', icon: '\u2764\ufe0f' },
  { key: 'career', label: 'Career', icon: '\ud83d\udcbc' },
  { key: 'vitality', label: 'Vitality', icon: '\u26a1' },
  { key: 'growth', label: 'Growth', icon: '\ud83c\udf31' },
  { key: 'social', label: 'Social', icon: '\ud83d\udc65' },
];
