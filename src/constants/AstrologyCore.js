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
