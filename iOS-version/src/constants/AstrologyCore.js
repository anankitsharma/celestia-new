import { ZodiacSign } from '../types';

export const ZODIAC_SIGNS = Object.values(ZodiacSign);

export const SIGN_ELEMENTS = {
    [ZodiacSign.Aries]: 'Fire',
    [ZodiacSign.Leo]: 'Fire',
    [ZodiacSign.Sagittarius]: 'Fire',
    [ZodiacSign.Taurus]: 'Earth',
    [ZodiacSign.Virgo]: 'Earth',
    [ZodiacSign.Capricorn]: 'Earth',
    [ZodiacSign.Gemini]: 'Air',
    [ZodiacSign.Libra]: 'Air',
    [ZodiacSign.Aquarius]: 'Air',
    [ZodiacSign.Cancer]: 'Water',
    [ZodiacSign.Scorpio]: 'Water',
    [ZodiacSign.Pisces]: 'Water',
};

export const SIGN_MODALITIES = {
    [ZodiacSign.Aries]: 'Cardinal',
    [ZodiacSign.Cancer]: 'Cardinal',
    [ZodiacSign.Libra]: 'Cardinal',
    [ZodiacSign.Capricorn]: 'Cardinal',
    [ZodiacSign.Taurus]: 'Fixed',
    [ZodiacSign.Leo]: 'Fixed',
    [ZodiacSign.Scorpio]: 'Fixed',
    [ZodiacSign.Aquarius]: 'Fixed',
    [ZodiacSign.Gemini]: 'Mutable',
    [ZodiacSign.Virgo]: 'Mutable',
    [ZodiacSign.Sagittarius]: 'Mutable',
    [ZodiacSign.Pisces]: 'Mutable',
};

export const HOUSE_THEMES = {
    1: "Self & Identity",
    2: "Money & Values",
    3: "Mind & Communication",
    4: "Home & Roots",
    5: "Creativity & Romance",
    6: "Health & Habits",
    7: "Relationships & Marriage",
    8: "Intimacy & Transformation",
    9: "Travel & Philosophy",
    10: "Career & Public Life",
    11: "Friends & Hopes",
    12: "Spirituality & Closure"
};

// Friendly house names + emojis for the Chart screen (Mia-centric naming)
export const HOUSE_FRIENDLY = {
    1:  { name: 'Your Front Door', emoji: '🪞', desc: 'How you walk into a room. First impressions. The mask you wear.' },
    2:  { name: 'Your Wallet', emoji: '💰', desc: 'Money, possessions, self-worth. What you value — literally.' },
    3:  { name: 'Your Voice', emoji: '💬', desc: 'Communication, siblings, daily thoughts. How your brain works on autopilot.' },
    4:  { name: 'Your Roots', emoji: '🏠', desc: 'Home, family, childhood. Where you go to recharge.' },
    5:  { name: 'Your Playground', emoji: '🎨', desc: 'Fun, creativity, romance, dating. Where you express joy.' },
    6:  { name: 'Your Daily Grind', emoji: '⚙️', desc: 'Work, health, routines. Your relationship with productivity.' },
    7:  { name: 'Your Mirror', emoji: '💕', desc: 'Partnerships, relationships. Who you\'re drawn to and why.' },
    8:  { name: 'Your Depths', emoji: '🔮', desc: 'Intimacy, transformation, shared resources. The things you don\'t talk about.' },
    9:  { name: 'Your Horizon', emoji: '✈️', desc: 'Travel, philosophy, beliefs. The big questions.' },
    10: { name: 'Your Legacy', emoji: '🏆', desc: 'Career, public image, ambition. What you want to be known for.' },
    11: { name: 'Your Tribe', emoji: '👥', desc: 'Friends, community, hopes. Where you fit in the bigger picture.' },
    12: { name: 'Your Blind Spot', emoji: '🌊', desc: 'The unconscious, hidden patterns, dreams. What you can\'t see about yourself.' },
};

export const ELEMENT_COLORS = {
    Fire: '#E6A8A1',
    Earth: '#A3C4A5',
    Air: '#F2C6A0',
    Water: '#A3C4DF'
};

export const PLANET_SYMBOLS = {
    Sun: '☉',
    Moon: '☽',
    Mercury: '☿',
    Venus: '♀',
    Mars: '♂',
    Jupiter: '♃',
    Saturn: '♄',
    Uranus: '♅',
    Neptune: '♆',
    Pluto: '♇',
    Ascendant: 'AC',
    Midheaven: 'MC',
    'North Node': '☊',
    'South Node': '☋',
    Chiron: '⚷'
};

export const ZODIAC_SYMBOLS = {
    Aries: '♈',
    Taurus: '♉',
    Gemini: '♊',
    Cancer: '♋',
    Leo: '♌',
    Virgo: '♍',
    Libra: '♎',
    Scorpio: '♏',
    Sagittarius: '♐',
    Capricorn: '♑',
    Aquarius: '♒',
    Pisces: '♓'
};
