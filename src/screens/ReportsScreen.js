import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
  Alert, Modal, ActivityIndicator, Share, Animated, Easing, Dimensions, StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { generateFullReport, generateDeepPdfReport } from '../services/geminiService';
import { ReportRepository } from '../services/database/rep_reports';
import { getNarrativeContext } from '../services/narrativeService';
import { haptic } from '../services/hapticService';
import { trackEvent } from '../services/achievementService';
import { awardXP } from '../services/xpService';
import GenerationOverlay from '../components/GenerationOverlay';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { useNavigation } from '@react-navigation/native';
import { useAnalytics, EVENTS } from '../services/analytics';
import { useTheme } from '../contexts/ThemeContext';


const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ── Per-Report Theme Configs ───────────────────────────────────────────────
const REPORT_THEMES = {
  love: {
    gradient: ['#2D0A1E', '#1A0828', '#0D0515'],
    accent: '#E85090',
    accentSoft: 'rgba(232,80,144,0.12)',
    accentGlow: 'rgba(232,80,144,0.35)',
    particleColor: 'rgba(232,80,144,0.08)',
    title: 'Love Report',
    steps: [
      { icon: '♀', label: 'Reading your Venus placement', sub: 'The planet of love & attraction...' },
      { icon: '♡', label: 'Scanning your 7th house', sub: 'Your house of partnerships...' },
      { icon: '☽', label: 'Analyzing your Moon sign', sub: 'What you need emotionally...' },
      { icon: '♂', label: 'Checking Mars chemistry', sub: 'Passion, desire & drive...' },
      { icon: '♃', label: 'Mapping love patterns', sub: 'Past, present & future...' },
      { icon: '✦', label: 'Writing your love story', sub: 'Weaving the romantic narrative...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful for you...' },
      { icon: '♡', label: 'Almost ready', sub: 'Your love report awaits...' },
    ],
    quotes: [
      '"Venus in your chart reveals how you love — and how you want to be loved."',
      '"Your 7th house is the mirror where your soul sees its partner."',
      '"The Moon knows what your heart needs before you do."',
      '"Love isn\'t written in the stars — it\'s written in your chart."',
      '"Mars shows your passion. Venus shows your poetry."',
      '"Every synastry aspect is a conversation between two souls."',
    ],
  },
  career: {
    gradient: ['#0A1628', '#0C1E3A', '#081020'],
    accent: '#5090E8',
    accentSoft: 'rgba(80,144,232,0.12)',
    accentGlow: 'rgba(80,144,232,0.35)',
    particleColor: 'rgba(80,144,232,0.08)',
    title: 'Career Map',
    steps: [
      { icon: '♄', label: 'Reading your Saturn placement', sub: 'Structure, ambition & mastery...' },
      { icon: '◆', label: 'Analyzing your 10th house', sub: 'Your public reputation & calling...' },
      { icon: '♃', label: 'Checking Jupiter opportunities', sub: 'Where luck expands for you...' },
      { icon: '☉', label: 'Mapping your Sun path', sub: 'Your core identity & drive...' },
      { icon: '☿', label: 'Reading Mercury skills', sub: 'Communication & intellect...' },
      { icon: '✦', label: 'Crafting your career story', sub: 'Connecting the dots...' },
      { icon: '◆', label: 'Designing your PDF', sub: 'Building your career blueprint...' },
      { icon: '↑', label: 'Almost ready', sub: 'Your career map awaits...' },
    ],
    quotes: [
      '"Saturn doesn\'t limit you — it shows you where to build."',
      '"Your Midheaven is the mountain you were born to climb."',
      '"Jupiter expands whatever it touches. Find it, follow it."',
      '"Your career isn\'t just what you do — it\'s who you become."',
      '"The 10th house is your legacy written in starlight."',
      '"Ambition aligned with your chart is unstoppable."',
    ],
  },
  lunar: {
    gradient: ['#0D0D20', '#141030', '#0A0818'],
    accent: '#A080E0',
    accentSoft: 'rgba(160,128,224,0.12)',
    accentGlow: 'rgba(160,128,224,0.35)',
    particleColor: 'rgba(160,128,224,0.08)',
    title: 'Lunar Guide',
    steps: [
      { icon: '☽', label: 'Reading your natal Moon', sub: 'Your emotional blueprint...' },
      { icon: '◑', label: 'Mapping lunar phases', sub: 'New Moon to Full Moon cycles...' },
      { icon: '☾', label: 'Tracking Moon transits', sub: 'How the Moon moves through your chart...' },
      { icon: '♆', label: 'Sensing Neptune\'s intuition', sub: 'Dreams, psychic gifts & flow...' },
      { icon: '✧', label: 'Creating your rituals', sub: 'Moon-aligned practices for you...' },
      { icon: '✦', label: 'Writing your lunar story', sub: 'Tides of emotion & growth...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Shaping something magical...' },
      { icon: '☽', label: 'Almost ready', sub: 'Your lunar guide awaits...' },
    ],
    quotes: [
      '"The Moon is your inner world — honor her rhythms."',
      '"New Moons plant seeds. Full Moons reveal truth."',
      '"Your natal Moon remembers what your Sun forgets."',
      '"Lunar living is the oldest form of self-care."',
      '"Every Moon phase is an invitation to evolve."',
      '"The tides within you follow the Moon above you."',
    ],
  },
  purpose: {
    gradient: ['#1A1408', '#201810', '#0E0A04'],
    accent: '#C8A84B',
    accentSoft: 'rgba(200,168,75,0.12)',
    accentGlow: 'rgba(200,168,75,0.35)',
    particleColor: 'rgba(200,168,75,0.08)',
    title: 'Life Purpose',
    steps: [
      { icon: '☊', label: 'Finding your North Node', sub: 'Your soul\'s direction this lifetime...' },
      { icon: '☋', label: 'Reading the South Node', sub: 'Gifts & patterns from before...' },
      { icon: '☉', label: 'Aligning your Sun purpose', sub: 'The light you\'re here to shine...' },
      { icon: '♃', label: 'Expanding with Jupiter', sub: 'Where the universe says "yes"...' },
      { icon: '♇', label: 'Pluto\'s transformation', sub: 'Deep rebirth & power...' },
      { icon: '✦', label: 'Weaving your soul story', sub: 'Connecting karma to destiny...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Illuminating your path...' },
      { icon: '✦', label: 'Almost ready', sub: 'Your purpose report awaits...' },
    ],
    quotes: [
      '"Your North Node is the compass your soul packed for this trip."',
      '"Purpose isn\'t found — it\'s remembered."',
      '"The South Node holds your gifts. The North Node holds your growth."',
      '"You didn\'t come here to be small. Your chart proves it."',
      '"Pluto destroys what\'s false so what\'s real can breathe."',
      '"Your birth chart is the blueprint of your soul\'s intention."',
    ],
  },
  solar_return: {
    gradient: ['#1A1408', '#12102A', '#0D1527'],
    accent: '#C8A84B',
    accentSoft: 'rgba(200,168,75,0.12)',
    accentGlow: 'rgba(200,168,75,0.35)',
    particleColor: 'rgba(200,168,75,0.08)',
    title: 'Solar Return',
    steps: [
      { icon: '☉', label: 'Casting your solar return chart', sub: 'The moment the Sun comes home...' },
      { icon: '☽', label: 'Reading the year\'s Moon', sub: 'Your emotional theme for the year...' },
      { icon: '♃', label: 'Scanning Jupiter blessings', sub: 'Where growth finds you...' },
      { icon: '♄', label: 'Checking Saturn lessons', sub: 'What the year asks of you...' },
      { icon: '♀', label: 'Mapping Venus highlights', sub: 'Love, beauty & abundance...' },
      { icon: '✦', label: 'Writing your year ahead', sub: 'Season by season, month by month...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Creating your annual guide...' },
      { icon: '☉', label: 'Almost ready', sub: 'Your year ahead awaits...' },
    ],
    quotes: [
      '"Every birthday, the Sun returns — and so does your potential."',
      '"Your solar return is the universe\'s birthday gift to you."',
      '"This year\'s chart holds a promise. Let\'s read it together."',
      '"The Sun doesn\'t just rise — it returns to exactly where it started."',
      '"A new solar year, a new chapter of becoming."',
      '"The cosmos resets your story every birthday."',
    ],
  },
  monthly: {
    gradient: ['#12082A', '#1A1040', '#0D0820'],
    accent: '#B388FF',
    accentSoft: 'rgba(179,136,255,0.12)',
    accentGlow: 'rgba(179,136,255,0.35)',
    title: `${MONTH_NAME} Forecast`,
    steps: [
      { icon: '☽', label: `Reading ${MONTH_NAME}'s lunar cycle`, sub: 'New Moon, Full Moon & eclipses...' },
      { icon: '♂', label: 'Tracking Mars & Venus', sub: 'Energy, love & money this month...' },
      { icon: '☿', label: 'Checking Mercury\'s position', sub: 'Communication & thinking patterns...' },
      { icon: '♃', label: 'Scanning bigger transits', sub: 'Jupiter & Saturn this month...' },
      { icon: '✦', label: 'Mapping your key dates', sub: 'Best & trickiest days ahead...' },
      { icon: '◇', label: 'Writing your monthly guide', sub: 'Week by week breakdown...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '☽', label: 'Almost ready', sub: `Your ${MONTH_NAME} forecast awaits...` },
    ],
    quotes: [
      `"${MONTH_NAME} asks you to pay attention to what's shifting."`,
      '"Each month is a mini-chapter in your cosmic story."',
      '"The Moon this month holds a message just for you."',
      '"Planetary weather changes monthly — so should your strategy."',
      '"The best months are the ones you navigate consciously."',
      '"What the stars highlight this month, your soul already knows."',
    ],
  },
  yearly: {
    gradient: ['#0A1A2A', '#0D2030', '#081518'],
    accent: '#4ECDC4',
    accentSoft: 'rgba(78,205,196,0.12)',
    accentGlow: 'rgba(78,205,196,0.35)',
    title: 'Yearly Forecast',
    steps: [
      { icon: '☉', label: 'Casting your profection year', sub: 'Which house rules your year...' },
      { icon: '♃', label: 'Scanning Jupiter opportunities', sub: 'Where expansion finds you...' },
      { icon: '♄', label: 'Mapping Saturn lessons', sub: 'Structure & growth edges...' },
      { icon: '◑', label: 'Breaking down the quarters', sub: 'Q1 through Q4 energy...' },
      { icon: '♀', label: 'Checking love & money windows', sub: 'Venus highlights this year...' },
      { icon: '✦', label: 'Writing your year ahead', sub: 'Weaving it all together...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Creating your annual guide...' },
      { icon: '⟡', label: 'Almost ready', sub: 'Your forecast awaits...' },
    ],
    quotes: [
      '"Each year activates a different house — a different chapter of growth."',
      '"Profection years reveal which planet is your annual guide."',
      '"The transits don\'t happen to you — they happen for you."',
      '"Jupiter expands whatever it touches. Watch where it lands."',
      '"Saturn builds slowly, but what it builds lasts forever."',
      '"Your year ahead is already written in the stars."',
    ],
  },
  transit: {
    gradient: ['#1A0A1A', '#2A0A20', '#120818'],
    accent: '#FF6B6B',
    accentSoft: 'rgba(255,107,107,0.12)',
    accentGlow: 'rgba(255,107,107,0.35)',
    title: 'Transit Report',
    steps: [
      { icon: '♇', label: 'Reading outer planet transits', sub: 'Pluto, Neptune & Uranus...' },
      { icon: '♄', label: 'Tracking Saturn\'s position', sub: 'Where discipline meets your chart...' },
      { icon: '♃', label: 'Finding Jupiter blessings', sub: 'Where luck is knocking...' },
      { icon: '♂', label: 'Scanning Mars energy', sub: 'Action, drive & conflict zones...' },
      { icon: '♀', label: 'Mapping Venus sweetness', sub: 'Love, money & beauty transits...' },
      { icon: '✦', label: 'Writing your transit story', sub: 'Connecting the cosmic weather...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Formatting your forecast...' },
      { icon: '↻', label: 'Almost ready', sub: 'Your transit report awaits...' },
    ],
    quotes: [
      '"Transits are the universe knocking on specific doors in your chart."',
      '"Pluto transits are slow fires — they burn away what\'s false."',
      '"When Saturn crosses your Moon, emotions get real."',
      '"Jupiter return years are when the universe says \'expand.\'"',
      '"Every challenging transit is a cocoon moment before the wings."',
      '"The sky right now is having a conversation with your birth chart."',
    ],
  },
  venus: {
    gradient: ['#2D0A1E', '#1A0520', '#0D0310'],
    accent: '#E8A0B0',
    accentSoft: 'rgba(232,160,176,0.12)',
    accentGlow: 'rgba(232,160,176,0.35)',
    particleColor: 'rgba(232,160,176,0.08)',
    title: 'Venus Report',
    steps: [
      { icon: '♀', label: 'Reading your Venus sign', sub: 'How you love & what you need...' },
      { icon: '♡', label: 'Scanning your 7th house', sub: 'What you look for in a partner...' },
      { icon: '☽', label: 'Analyzing Moon-Venus dynamics', sub: 'Emotional needs vs love needs...' },
      { icon: '♂', label: 'Mapping Venus-Mars interplay', sub: 'Desire vs affection...' },
      { icon: '♄', label: 'Finding your attachment style', sub: 'Saturn\'s role in your love life...' },
      { icon: '✦', label: 'Identifying the pattern', sub: 'Why you keep repeating it...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Making it beautiful...' },
      { icon: '♡', label: 'Almost ready', sub: 'Your Venus report awaits...' },
    ],
    quotes: [
      '"Venus doesn\'t just show who you love — it shows why you love the way you do."',
      '"Your 7th house cusp is the mirror where your soul sees its partner."',
      '"The pattern isn\'t a flaw. It\'s a map showing you what still needs healing."',
    ],
  },
  saturn_return_guide: {
    gradient: ['#1A1510', '#14100E', '#0D0515'],
    accent: '#A0A0B0',
    accentSoft: 'rgba(160,160,176,0.12)',
    accentGlow: 'rgba(160,160,176,0.35)',
    particleColor: 'rgba(160,160,176,0.08)',
    title: 'Saturn Return Guide',
    steps: [
      { icon: '♄', label: 'Locating your natal Saturn', sub: 'Where discipline lives in your chart...' },
      { icon: '◎', label: 'Calculating your return dates', sub: 'When it starts, peaks & ends...' },
      { icon: '♡', label: 'Analyzing love impact', sub: 'Relationships during your return...' },
      { icon: '◆', label: 'Mapping career impact', sub: 'Job crisis & identity shifts...' },
      { icon: '☽', label: 'Reading emotional impact', sub: 'Who you were vs who you\'re becoming...' },
      { icon: '✦', label: 'Building survival guide', sub: 'Month-by-month navigation...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Formatting your guide...' },
      { icon: '♄', label: 'Almost ready', sub: 'Your Saturn Return guide awaits...' },
    ],
    quotes: [
      '"Saturn Return doesn\'t break you — it breaks what was never truly yours."',
      '"Ages 27-30 is when the universe audits your life and demands authenticity."',
      '"What survives your Saturn Return is real. Everything else was practice."',
    ],
  },
};

const DEFAULT_THEME = REPORT_THEMES.solar_return;


const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth(); // 0-indexed
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_NAME = MONTH_NAMES[CURRENT_MONTH];
const NEXT_MONTH_NAME = MONTH_NAMES[(CURRENT_MONTH + 1) % 12];
const MONTH_ZODIAC_ENERGY = [
  'Capricorn season wraps up & Aquarius rises', // Jan
  'Aquarius winds down & Pisces dreams begin',  // Feb
  'Pisces season closes & Aries ignites',       // Mar
  'Aries fire cools & Taurus grounds you',      // Apr
  'Taurus steadies & Gemini sparks curiosity',   // May
  'Gemini fades & Cancer nurtures deeply',       // Jun
  'Cancer retreats & Leo takes the stage',       // Jul
  'Leo\'s fire mellows & Virgo refines',         // Aug
  'Virgo organizes & Libra seeks balance',       // Sep
  'Libra harmonizes & Scorpio intensifies',      // Oct
  'Scorpio transforms & Sagittarius explores',   // Nov
  'Sagittarius winds down & Capricorn builds',   // Dec
];

const REPORTS = [
  {
    icon: '♀', bg: ['#3A0A3A', '#1A1060'], accent: '#E85090', name: 'Love Report', type: 'love', tier: 'premium',
    subtitle: 'Why You Love Like This',
    desc: 'Venus placement, attachment style, relationship patterns, what you actually need in a partner — and why you keep choosing what you don\'t.',
    pages: '12-16', readTime: '12 min', tag: 'Most Personal',
  },
  {
    icon: '♄', bg: ['#0A2A3A', '#1A1060'], accent: '#5090E8', name: 'Career Map', type: 'career', tier: 'premium',
    subtitle: 'Your Professional Destiny',
    desc: 'Midheaven, Saturn, 10th house decoded. What you\'re built for, where you\'re stuck, and when the next career door opens.',
    pages: '14-18', readTime: '14 min', tag: 'Career Clarity',
  },
  {
    icon: '☽', bg: ['#1A0A3A', '#0E0E22'], accent: '#A080E0', name: 'Lunar Guide', type: 'lunar', tier: 'pro',
    subtitle: 'Moon Phase Rituals',
    desc: 'Personalized rituals for every lunar phase — aligned with your natal Moon. New Moon intentions, Full Moon releases.',
    pages: '10-12', readTime: '10 min', tag: 'In Pro',
  },
  {
    icon: '☊', bg: ['#2A1A0A', '#1A1060'], accent: '#C8A84B', name: 'Life Purpose', type: 'purpose', tier: 'premium',
    subtitle: 'Where Your Soul Is Headed',
    desc: 'North Node decoded — the qualities you\'re learning this lifetime, the comfort zone you\'re outgrowing, and where growth is calling.',
    pages: '14-16', readTime: '14 min', tag: 'Deep Self-Discovery',
  },
  {
    icon: '♃', bg: ['#0A1A2A', '#0E0E22'], accent: '#4ECDC4', name: 'Yearly Forecast', type: 'yearly', tier: 'premium',
    subtitle: `Your ${CURRENT_YEAR} Roadmap`,
    desc: 'Month-by-month forecast. Love windows, career peaks, rest periods, power dates — your year mapped to your chart.',
    pages: '16-20', readTime: '15 min', tag: 'Re-read Monthly',
  },
  {
    icon: '☿', bg: ['#1A0A1A', '#2A0A2A'], accent: '#FF6B6B', name: 'Transit Report', type: 'transit', tier: 'pro',
    subtitle: 'What\'s Hitting Your Chart Now',
    desc: 'Every active transit explained — what it means, how long it lasts, and what to do about it. Your current cosmic weather.',
    pages: '8-12', readTime: '8 min', tag: 'In Pro',
  },
  {
    icon: '☉', bg: ['#0E0E22', '#2A1A6E'], accent: '#C8A84B', name: `Solar Return ${CURRENT_YEAR}`, type: 'solar_return', tier: 'premium',
    subtitle: 'Your Birthday Year Ahead',
    desc: 'Complete year-ahead from your last birthday. Every season, every transit, every opportunity — 12 months of guidance.',
    pages: '18-22', readTime: '18 min', tag: 'Birthday Essential',
  },
  {
    icon: '♀', bg: ['#2D0A1E', '#1A0520'], accent: '#E8A0B0', name: 'Venus Report', type: 'venus', tier: 'premium',
    subtitle: 'Your Attachment Decoded',
    desc: 'Venus sign, 7th house, Moon-Venus dynamics — your love language, the pattern you keep repeating, and how to finally break it.',
    pages: '12-16', readTime: '12 min', tag: 'Post-Breakup Essential',
  },
  {
    icon: '♄', bg: ['#1A1510', '#14100E'], accent: '#A0A0B0', name: 'Saturn Return Guide', type: 'saturn_return_guide', tier: 'premium',
    subtitle: 'Ages 27-30 Survival Guide',
    desc: 'Why everything falls apart and why that\'s the point. Relationships, career, identity — month-by-month through the storm.',
    pages: '18-22', readTime: '18 min', tag: 'For Ages 24-30',
  },
];

// Report tier system:
// 'free'    — Monthly forecast (always free for everyone)
// 'pro'     — Included with Pro subscription (Lunar Guide, Transit Report)
// 'premium' — Always $9.99 one-time purchase (even for Pro subscribers)
const isReportAccessible = (reportType, isPro) => {
  if (reportType === 'monthly') return true; // Always free
  const report = REPORTS.find(r => r.type === reportType);
  if (!report) return false;
  if (report.tier === 'pro' && isPro) return true; // Included with Pro
  // 'premium' tier reports are ALWAYS paid ($9.99) — this is the revenue driver
  return false;
};

// ── Deep PDF HTML Generator ─────────────────────────────────────────────────
const generateDeepReportHTML = (report, profile, reportType) => {
  const name = profile?.name || 'Stargazer';
  const firstName = name.split(' ')[0];
  const sun = profile?.chart?.planets?.find(p => p.name === 'Sun');
  const moon = profile?.chart?.planets?.find(p => p.name === 'Moon');
  const rising = profile?.chart?.planets?.find(p => p.name === 'Ascendant');
  const birthDate = profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const birthTime = profile?.birthTime || '';
  const birthPlace = profile?.birthPlace || '';
  const REPORT_TYPE_LABELS = { solar_return: `${CURRENT_YEAR} Solar Return`, love: 'Love & Relationships', career: 'Career & Vocation', lunar: 'Lunar Guide', purpose: 'Life Purpose', yearly: `${CURRENT_YEAR} Yearly Forecast`, transit: 'Transit Forecast', monthly: `${MONTH_NAME} ${CURRENT_YEAR} Forecast` };
  const reportLabel = REPORT_TYPE_LABELS[reportType] || 'Natal Birth Chart';
  const genDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const PLANET_GLYPHS = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇', 'North Node': '☊', 'South Node': '☋', Ascendant: 'ASC', Midheaven: 'MC' };
  const AREA_COLORS = { love: '#F5E8EC', career: '#E8EEF5', purpose: '#F5F0E4', challenge: '#F5EAE6' };
  const AREA_LABELS = { love: 'Love & Relationships', career: 'Career & Vocation', purpose: 'Life Purpose', challenge: 'Core Challenge' };
  const AREA_ICONS = { love: '♡', career: '◆', purpose: '✦', challenge: '△' };
  const EL_COLORS = { fire: '#DC2626', earth: '#16A34A', air: '#2563EB', water: '#7C3AED' };
  const EL_EMOJI = { fire: '🜂', earth: '🜃', air: '🜁', water: '🜄' };
  const ASPECT_COLORS = { Conjunction: '#C49A2A', Trine: '#9333EA', Sextile: '#0891B2', Square: '#EA580C', Opposition: '#DC2626', Quincunx: '#5C5650' };

  const nl2p = (text) => (text || '').split(/\n\n+/).filter(Boolean).map(p => `<p class="body">${escapeHTML(p)}</p>`).join('');

  // Planet positions table rows
  const planetRows = (profile.chart?.planets || []).filter(p => p.name !== 'South Node').map((p, i) =>
    `<tr class="${i % 2 === 0 ? 'row-alt' : ''}"><td class="tc"><span class="glyph">${PLANET_GLYPHS[p.name] || ''}</span></td><td class="tc tc-name">${escapeHTML(p.name)}</td><td class="tc">${escapeHTML(p.sign)}</td><td class="tc tc-center">${p.house || '—'}</td><td class="tc tc-right">${p.degree?.toFixed(1) || ''}°${p.isRetrograde ? ' <span class="retro">℞</span>' : ''}</td></tr>`
  ).join('');

  // Aspects table (top 14)
  const aspectRows = (profile.chart?.aspects || []).slice(0, 14).map((a, i) =>
    `<tr class="${i % 2 === 0 ? 'row-alt' : ''}"><td class="tc">${escapeHTML(a.planet1)}</td><td class="tc" style="color:${ASPECT_COLORS[a.type] || '#5C5650'};font-weight:600">${escapeHTML(a.type)}</td><td class="tc">${escapeHTML(a.planet2)}</td><td class="tc tc-right">${a.orb?.toFixed(1)}°</td></tr>`
  ).join('');

  // Elements
  const elements = profile.chart?.elements || {};
  const totalEl = (elements.fire || 0) + (elements.earth || 0) + (elements.air || 0) + (elements.water || 0) || 1;
  const elBar = (key, val) => {
    const pct = Math.round((val / totalEl) * 100);
    return `<div class="el-row">
      <span class="el-icon" style="color:${EL_COLORS[key]}">${EL_EMOJI[key]}</span>
      <span class="el-label">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
      <div class="el-track"><div class="el-fill" style="width:${pct}%;background:${EL_COLORS[key]}"></div></div>
      <span class="el-pct">${pct}%</span>
    </div>`;
  };

  // Big Three sections — warm light backgrounds, NOT dark
  const BIG3_CONFIG = {
    sun: { band: '#F0E6D5', glyph: '☉', label: 'Your Sun', sublabel: 'Identity · Ego · Life Force' },
    moon: { band: '#E8E2EE', glyph: '☽', label: 'Your Moon', sublabel: 'Emotions · Inner World · Needs' },
    rising: { band: '#E2EAE8', glyph: 'ASC', label: 'Your Rising', sublabel: 'First Impression · Outer Self · Path' },
  };

  const big3HTML = ['sun', 'moon', 'rising'].map(key => {
    const data = report.bigThree?.[key];
    if (!data) return '';
    const cfg = BIG3_CONFIG[key];
    const planetData = key === 'sun' ? sun : key === 'moon' ? moon : rising;
    return `
      <div class="section-block">
        <div class="b3-band" style="background:${cfg.band}">
          <div class="b3-band-inner">
            <span class="b3-glyph">${cfg.glyph}</span>
            <div class="b3-band-text">
              <div class="b3-title">${escapeHTML(data.title)}</div>
              <div class="b3-meta">${planetData?.sign || ''} · House ${planetData?.house || ''}</div>
            </div>
          </div>
        </div>
        <div class="b3-content">
          <div class="placement-badge">${cfg.glyph} ${cfg.label.replace('Your ', '')} in ${planetData?.sign || ''}${planetData?.house ? ' · House ' + planetData.house : ''}</div>
          <div class="b3-sublabel">${cfg.sublabel}</div>
          ${nl2p(data.interpretation)}
          <div class="callout shadow-callout">
            <div class="callout-icon">☾</div>
            <div>
              <div class="callout-label shadow-label">SHADOW SIDE</div>
              <p class="callout-text">${escapeHTML(data.shadow)}</p>
            </div>
          </div>
          <div class="callout gold-callout">
            <div class="callout-icon">✦</div>
            <div>
              <div class="callout-label gold-label">GUIDANCE</div>
              <p class="callout-text">${escapeHTML(data.advice)}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('<div class="section-ornament">✦</div>');

  // Planets sections
  const planetsHTML = (report.planets || []).map((p, idx) => `
    <div class="section-block${idx > 0 ? ' new-page' : ''}">
      <div class="planet-band">
        <span class="planet-glyph">${PLANET_GLYPHS[p.name] || '★'}</span>
        <div class="planet-band-text">
          <div class="planet-title">${escapeHTML(p.title)}</div>
          <div class="planet-placement">${escapeHTML(p.placement)}</div>
        </div>
      </div>
      <div class="planet-body">
        <div class="placement-badge">${PLANET_GLYPHS[p.name] || '★'} ${escapeHTML(p.placement)}</div>
        ${nl2p(p.interpretation)}
        <div class="callout gold-callout">
          <div class="callout-icon">✦</div>
          <div>
            <div class="callout-label gold-label">GUIDANCE</div>
            <p class="callout-text">${escapeHTML(p.advice)}</p>
          </div>
        </div>
      </div>
    </div>
    ${idx < (report.planets || []).length - 1 ? '<div class="section-ornament">✦</div>' : ''}
  `).join('');

  // Life areas
  const areasHTML = ['love', 'career', 'purpose', 'challenge'].map((key, idx) => {
    const data = report.lifeAreas?.[key];
    if (!data) return '';
    return `
      <div class="section-block">
        <div class="area-band" style="background:${AREA_COLORS[key]}">
          <span class="area-icon">${AREA_ICONS[key]}</span>
          <div class="area-band-text">
            <div class="area-title">${AREA_LABELS[key]}</div>
            <div class="area-theme">${escapeHTML(data.theme)}</div>
          </div>
        </div>
        <div class="area-content">
          <div class="placement-badge">${AREA_ICONS[key]} ${AREA_LABELS[key]}</div>
          ${nl2p(data.analysis)}
          <div class="callout gold-callout">
            <div class="callout-icon">→</div>
            <div>
              <div class="callout-label gold-label">YOUR MOVE</div>
              <p class="callout-text">${escapeHTML(data.advice)}</p>
            </div>
          </div>
        </div>
      </div>
      ${idx < 3 ? '<div class="section-ornament">✦</div>' : ''}
    `;
  }).join('');

  // Soul path
  const soulPathHTML = report.soulPath ? `
    <div class="soul-card">
      <div class="soul-heading">☊ North Node · Your Evolutionary Direction</div>
      ${nl2p(report.soulPath.northNodeMessage)}
    </div>
    <div class="soul-card">
      <div class="soul-heading">☋ South Node · Karmic Patterns to Release</div>
      ${nl2p(report.soulPath.karmicPatterns)}
    </div>
    <div class="soul-gift">
      <div class="soul-gift-label">YOUR GIFT TO THE WORLD</div>
      <p class="soul-gift-text">${escapeHTML(report.soulPath.giftToTheWorld || '')}</p>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>
/* ─── Reset & Base ──────────────────────────────────────────────── */
@page { margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  width: 100%;
  margin: 0;
  padding: 0;
}
body {
  font-family: Georgia, 'Times New Roman', serif;
  color: #1A1614;
  background: #FAF8F3;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ─── Page System ──────────────────────────────────────────────── */
/* Smart flowing pages — content flows naturally, sections never split */
.page-break { page-break-before: always; }

/* Each section stays together — never splits across pages */
.section-block {
  page-break-inside: avoid;
  break-inside: avoid;
  margin-bottom: 28px;
}

/* Major section dividers force a new page */
.major-break {
  page-break-before: always;
  break-before: page;
}

/* Prevent orphaned headings — heading always stays with its content */
h3, .section-title, .planet-band, .b3-band, .area-band {
  page-break-after: avoid;
  break-after: avoid;
}

/* Text flow: at least 3 lines on each page */
.body, p { orphans: 3; widows: 3; }

/* Boxes never split */
.highlight, .callout, .pull-quote, .placement-badge {
  page-break-inside: avoid;
  break-inside: avoid;
}

/* Decorative divider between sections on same page */
.section-divider {
  border-bottom: 1px solid #E0D8CC;
  margin: 24px 0 28px;
  position: relative;
}
.section-divider::after {
  content: '✦';
  position: absolute;
  left: 50%;
  top: -8px;
  transform: translateX(-50%);
  background: #FAF8F3;
  padding: 0 12px;
  font-size: 10px;
  color: #C17F59;
  opacity: 0.5;
}

/* ─── Page Header (warm sand band at top of every content page) ── */
.ph {
  background: #EDE3D5;
  padding: 14px 85px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: Helvetica, Arial, sans-serif;
  margin-bottom: 32px;
  border-bottom: 1px solid #E0D8CC;
}
.ph-left {
  font-size: 8px; font-weight: 700; color: #C17F59;
  letter-spacing: 4px; text-transform: uppercase;
  opacity: 0.7;
}
.ph-right {
  font-size: 7px; color: #97907F; letter-spacing: 1.5px;
}

/* ─── Page Footer ───────────────────────────────────────────────── */
.pf {
  font-family: Helvetica, Arial, sans-serif;
  font-size: 7px; color: #97907F; letter-spacing: 0.8px;
  text-align: center; padding: 14px 85px;
  border-top: 1px solid #E8E2D8;
  margin-top: auto;
}
.pf .page-num {
  display: inline-block;
  color: #C17F59;
  font-weight: 600;
  margin-left: 6px;
  opacity: 0.5;
}

/* ─── Page Content Area ─────────────────────────────────────────── */
.pc { padding: 0 85px 24px; }

/* ─── Section Label + Rule ──────────────────────────────────────── */
.sl {
  font-size: 9px; font-weight: 700; color: #C17F59;
  letter-spacing: 2.5px; text-transform: uppercase;
  margin-bottom: 6px; margin-top: 4px;
  font-family: Helvetica, Arial, sans-serif;
}
.sr { border-bottom: 1px solid #C49A2A; opacity: 0.35; margin-bottom: 16px; }

/* ─── Body Text ─────────────────────────────────────────────────── */
.body {
  font-size: 10.5px; color: #1A1614; line-height: 1.95;
  margin-bottom: 14px; text-align: justify;
}
.body-sm { font-size: 9.5px; color: #5C5650; line-height: 1.7; margin-bottom: 8px; }

/* ─── Highlight Box (screenshottable element) ──────────────────── */
.highlight {
  background: rgba(193,127,89,0.06);
  border-left: 3px solid #C17F59;
  padding: 14px 18px;
  border-radius: 0 8px 8px 0;
  margin: 14px 0;
  font-size: 11.5px;
  line-height: 1.8;
  color: #2A2418;
  page-break-inside: avoid;
}
.highlight b { color: #C17F59; }

/* ─── Placement Badge (pill at top of each section) ────────────── */
.placement-badge {
  display: inline-block;
  background: rgba(193,127,89,0.08);
  border: 0.5px solid rgba(193,127,89,0.25);
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 9px;
  color: #C17F59;
  letter-spacing: 0.8px;
  font-family: Helvetica, Arial, sans-serif;
  margin-bottom: 10px;
}

/* ─── Section Heading (evocative Playfair-style) ───────────────── */
.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #2A2418;
  line-height: 1.3;
  margin-bottom: 6px;
  font-family: Georgia, 'Playfair Display', serif;
}
.section-subtitle {
  font-size: 9px;
  color: #97907F;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  font-family: Helvetica, Arial, sans-serif;
  margin-bottom: 16px;
}

/* ─── Ornamental Divider ────────────────────────────────────────── */
.ornament {
  color: #C49A2A; text-align: center; letter-spacing: 10px;
  font-size: 14px; margin: 22px 0; opacity: 0.7;
}
.section-ornament {
  color: #C17F59; text-align: center; letter-spacing: 8px;
  font-size: 11px; margin: 28px 0 24px; opacity: 0.4;
}

/* ─── Divider ───────────────────────────────────────────────────── */
.divider { border-bottom: 1px solid #E0DAD3; margin: 18px 0; }

/* ═══════════════════════════════════════════════════════════════════
   COVER PAGE — Coffee table book quality
   ═══════════════════════════════════════════════════════════════════ */
.cover {
  width: 100%;
  height: 100vh;
  background: #F5EDE3;
  page-break-after: always;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 60px;
}
/* Terracotta inset border — warm solid, generous inset */
.cover-border {
  position: absolute;
  top: 36px; left: 36px; right: 36px; bottom: 36px;
  border: 0.5px solid rgba(193,127,89,0.25);
  border-radius: 2px;
}
.corner { display: none; }
.cover-stars { display: none; }

.cover-inner {
  position: relative; z-index: 2;
  text-align: center;
  padding: 0 50px;
  display: flex; flex-direction: column;
  align-items: center;
  width: 100%;
}

/* Top brand section */
.cover-brand {
  font-size: 9px; font-weight: 700; color: #C17F59;
  letter-spacing: 8px; text-transform: uppercase;
  font-family: Helvetica, Arial, sans-serif;
  margin-bottom: 20px;
}
.cover-brand-rule {
  width: 80px; height: 0.5px;
  background: #C17F59;
  opacity: 0.4;
  margin-bottom: 28px;
}

/* Report type badge */
.cover-type-badge {
  display: inline-block;
  border: 0.5px solid rgba(193,127,89,0.35);
  border-radius: 20px;
  padding: 5px 20px;
  font-size: 7.5px; color: #C17F59; letter-spacing: 3.5px;
  text-transform: uppercase;
  font-family: Helvetica, Arial, sans-serif;
  margin-bottom: 30px;
}

/* Decorative zodiac ring */
.cover-zodiac-ring {
  font-size: 8px; color: rgba(193,127,89,0.18);
  letter-spacing: 8px; margin-bottom: 28px;
}

/* Person's name — the dominant element, large serif */
.cover-name {
  font-size: 48px; font-weight: 700; color: #2A2418;
  letter-spacing: 2px; margin-bottom: 18px;
  line-height: 1.15;
  font-family: Georgia, 'Playfair Display', serif;
}

/* Gold ornamental divider */
.cover-divider {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 20px;
}
.cover-divider-line {
  width: 80px; height: 0.5px;
  background: rgba(193,127,89,0.4);
}
.cover-divider-star {
  font-size: 11px; color: rgba(193,127,89,0.5);
}

/* Headline / tagline */
.cover-headline {
  font-size: 13px; font-style: italic; color: #97907F;
  line-height: 1.85; max-width: 380px;
  margin-bottom: 26px;
  font-family: Georgia, serif;
}

/* Birth details */
.cover-meta {
  font-size: 9px; color: #97907F;
  letter-spacing: 1.5px; line-height: 2;
  font-family: Helvetica, Arial, sans-serif;
  margin-bottom: 24px;
}
.cover-meta-highlight {
  color: #5C5650; font-weight: 600;
}

/* Big Three pills row */
.cv-pills {
  display: flex; gap: 14px; margin-bottom: 26px;
}
.cv-pill {
  border: 0.5px solid rgba(193,127,89,0.25);
  border-radius: 6px;
  padding: 8px 18px;
  text-align: center;
  background: rgba(193,127,89,0.04);
}
.cv-pill-glyph {
  font-size: 16px; color: #C17F59;
  display: block; margin-bottom: 4px;
}
.cv-pill-sign {
  font-size: 11px; font-weight: 700; color: #2A2418;
  margin-bottom: 2px;
}
.cv-pill-role {
  font-size: 6.5px; color: #C17F59; opacity: 0.6;
  letter-spacing: 2px; text-transform: uppercase;
  font-weight: 700; font-family: Helvetica, Arial, sans-serif;
}

/* Core motif */
.cv-motif-rule {
  width: 100px; height: 0.5px;
  background: rgba(193,127,89,0.25);
  margin-bottom: 16px;
}
.cv-motif-label {
  font-size: 7px; color: #C17F59; opacity: 0.5;
  letter-spacing: 3px; text-transform: uppercase;
  font-weight: 700; margin-bottom: 12px;
  font-family: Helvetica, Arial, sans-serif;
}
.cv-motif {
  font-size: 11px; font-style: italic;
  color: #97907F;
  line-height: 1.85; max-width: 360px;
  font-family: Georgia, serif;
}

/* Bottom footer — more prominent date */
.cover-foot {
  position: absolute; bottom: 48px; left: 0; right: 0;
  text-align: center; z-index: 2;
}
.cover-foot-text {
  font-size: 8px; color: #C17F59; opacity: 0.5;
  letter-spacing: 2.5px; font-family: Helvetica, Arial, sans-serif;
  text-transform: uppercase;
}
.cover-foot-date {
  font-size: 8px; color: #97907F;
  letter-spacing: 1.5px; margin-top: 5px;
  font-family: Helvetica, Arial, sans-serif;
}

/* ═══════════════════════════════════════════════════════════════════
   CHART DATA TABLES
   ═══════════════════════════════════════════════════════════════════ */
.dt { width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 9.5px; }
.dt th {
  font-size: 7.5px; font-weight: 700; color: #C17F59;
  letter-spacing: 1.5px; text-transform: uppercase;
  padding: 9px 10px; border-bottom: 2px solid #C17F59;
  text-align: left; font-family: Helvetica, Arial, sans-serif;
  opacity: 0.7;
}
.tc { padding: 8px 10px; border-bottom: 1px solid #EDEBE8; font-size: 9.5px; color: #2A2418; }
.tc-name { font-weight: 600; color: #2A2418; }
.tc-center { text-align: center; }
.tc-right { text-align: right; }
.row-alt { background: #F9F6F1; }
.glyph { color: #C17F59; font-size: 12px; }
.retro { color: #DC2626; font-weight: 700; font-size: 11px; }

/* ═══════════════════════════════════════════════════════════════════
   BIG THREE
   ═══════════════════════════════════════════════════════════════════ */
.b3-band {
  margin: 0 -85px; padding: 16px 85px;
  display: flex; align-items: center;
  page-break-inside: avoid; page-break-after: avoid;
  border-bottom: 1px solid #E0D8CC;
}
.b3-band-inner { display: flex; align-items: center; gap: 16px; }
.b3-glyph { font-size: 24px; color: #C17F59; min-width: 30px; text-align: center; }
.b3-band-text { }
.b3-title {
  font-size: 16px; font-weight: 700; color: #2A2418;
  margin-bottom: 3px;
  font-family: Georgia, 'Playfair Display', serif;
}
.b3-meta {
  font-size: 9px; color: #C17F59;
  font-family: Helvetica, Arial, sans-serif; letter-spacing: 0.8px;
}
.b3-content { padding: 18px 0 8px; }
.b3-sublabel {
  font-size: 8px; color: #9C9590; letter-spacing: 2px;
  text-transform: uppercase; font-weight: 700;
  margin-bottom: 14px; font-family: Helvetica, Arial, sans-serif;
}

/* ─── Callout Boxes ─────────────────────────────────────────────── */
.callout {
  border-radius: 0 8px 8px 0; padding: 14px 18px;
  margin: 14px 0 16px; display: flex; gap: 12px;
  align-items: flex-start; page-break-inside: avoid;
}
.callout-icon {
  font-size: 14px; color: #C17F59; min-width: 18px;
  text-align: center; margin-top: 1px;
}
.callout-label {
  font-size: 7.5px; font-weight: 700; letter-spacing: 2px;
  text-transform: uppercase; margin-bottom: 5px;
  display: block; font-family: Helvetica, Arial, sans-serif;
}
.callout-text { font-size: 10.5px; color: #1A1614; line-height: 1.75; }
.shadow-callout {
  background: rgba(122,53,32,0.04); border-left: 3px solid #7A3520;
}
.shadow-label { color: #7A3520; }
.gold-callout {
  background: rgba(193,127,89,0.06); border-left: 3px solid #C17F59;
}
.gold-label { color: #C17F59; }

/* ═══════════════════════════════════════════════════════════════════
   PLANETS
   ═══════════════════════════════════════════════════════════════════ */
.planet-band {
  background: #EDE3D5; margin: 0 -85px; padding: 14px 85px;
  display: flex; align-items: center; gap: 14px;
  page-break-inside: avoid; page-break-after: avoid;
  border-bottom: 1px solid #E0D8CC;
}
.planet-glyph { font-size: 18px; color: #C17F59; min-width: 24px; text-align: center; }
.planet-band-text { flex: 1; }
.planet-title {
  font-size: 14px; font-weight: 700; color: #2A2418; margin-bottom: 2px;
  font-family: Georgia, 'Playfair Display', serif;
}
.planet-placement {
  font-size: 8.5px; color: #C17F59;
  font-family: Helvetica, Arial, sans-serif; letter-spacing: 0.8px;
}
.planet-body { padding: 18px 0 8px; }

/* ═══════════════════════════════════════════════════════════════════
   LIFE AREAS
   ═══════════════════════════════════════════════════════════════════ */
.area-band {
  margin: 0 -85px; padding: 14px 85px;
  display: flex; align-items: center; gap: 14px;
  page-break-inside: avoid; page-break-after: avoid;
  border-bottom: 1px solid #E0D8CC;
}
.area-icon { font-size: 17px; min-width: 22px; text-align: center; color: #C17F59; }
.area-band-text { flex: 1; }
.area-title {
  font-size: 14px; font-weight: 700; color: #2A2418; margin-bottom: 3px;
  font-family: Georgia, 'Playfair Display', serif;
}
.area-theme {
  font-size: 9px; color: #97907F;
  font-family: Helvetica, Arial, sans-serif; font-style: italic;
  letter-spacing: 0.3px;
}
.area-content { padding: 18px 0 8px; }

/* ═══════════════════════════════════════════════════════════════════
   SOUL PATH
   ═══════════════════════════════════════════════════════════════════ */
.soul-card {
  background: #FFFFFF; border-radius: 8px;
  padding: 18px 20px; margin-bottom: 16px;
  border: 1px solid #E0DAD3;
  page-break-inside: avoid;
}
.soul-heading {
  font-size: 13px; font-weight: 700; color: #2A2418;
  margin-bottom: 12px;
  font-family: Georgia, 'Playfair Display', serif;
}
.soul-gift {
  background: rgba(193,127,89,0.05); border: 1px solid #C17F59;
  border-radius: 8px; padding: 22px 28px;
  text-align: center; margin-top: 12px;
  page-break-inside: avoid;
}
.soul-gift-label {
  font-size: 8px; color: #C17F59; letter-spacing: 2.5px;
  text-transform: uppercase; font-weight: 700;
  margin-bottom: 10px; font-family: Helvetica, Arial, sans-serif;
}
.soul-gift-text {
  font-size: 12px; font-style: italic; color: #5C5650;
  line-height: 1.85;
  font-family: Georgia, serif;
}

/* ═══════════════════════════════════════════════════════════════════
   ELEMENTAL BALANCE
   ═══════════════════════════════════════════════════════════════════ */
.el-row {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 12px;
}
.el-icon { font-size: 15px; width: 22px; text-align: center; }
.el-label {
  font-size: 10px; width: 48px;
  font-family: Helvetica, Arial, sans-serif;
  font-weight: 600; color: #5C5650;
}
.el-track {
  flex: 1; height: 10px; background: #EDEBE8;
  border-radius: 5px; overflow: hidden;
}
.el-fill { height: 100%; border-radius: 5px; transition: width 0.3s; }
.el-pct {
  font-size: 9px; width: 30px; text-align: right;
  color: #5C5650; font-weight: 600;
  font-family: Helvetica, Arial, sans-serif;
}
.el-summary {
  background: #FFFFFF; border-radius: 8px;
  padding: 18px 20px; margin-top: 18px;
  border: 1px solid #E0DAD3;
}
.el-dom-label {
  font-size: 8px; color: #C17F59; letter-spacing: 2px;
  text-transform: uppercase; font-weight: 700;
  margin-bottom: 5px; font-family: Helvetica, Arial, sans-serif;
}
.el-dom-val {
  font-size: 14px; font-weight: 700; color: #2A2418;
  margin-bottom: 8px;
  font-family: Georgia, 'Playfair Display', serif;
}

/* ═══════════════════════════════════════════════════════════════════
   CLOSING PAGE
   ═══════════════════════════════════════════════════════════════════ */
.closing {
  background: #F5EDE3;
  width: 100%; height: 100vh;
  padding: 0; page-break-before: always;
  display: flex; flex-direction: column;
  position: relative;
}
.closing-ph {
  background: #EDE3D5;
  padding: 13px 85px;
  display: flex; justify-content: space-between;
  align-items: center; font-family: Helvetica, Arial, sans-serif;
  margin-bottom: 40px; position: relative; z-index: 1;
  border-bottom: 1px solid #E0D8CC;
}
.closing-content {
  padding: 0 85px; flex: 1;
  position: relative; z-index: 1;
}
.closing-body {
  font-size: 10.5px; color: #2A2418; line-height: 1.95;
  margin-bottom: 14px; text-align: justify;
  font-family: Georgia, serif;
}
.closing-ornament {
  color: #C17F59; text-align: center; letter-spacing: 12px;
  font-size: 12px; margin: 30px 0; opacity: 0.45;
}
.closing-philosophy {
  font-size: 11px; color: #97907F; line-height: 1.85;
  text-align: center; font-style: italic;
  margin-bottom: 28px; max-width: 380px;
  margin-left: auto; margin-right: auto;
  font-family: Georgia, serif;
}
.closing-affirm {
  border: 1px solid rgba(193,127,89,0.35);
  border-left: 3px solid #C17F59;
  border-radius: 0 8px 8px 0; padding: 24px 30px;
  margin: 0 auto 40px; max-width: 420px;
  text-align: center; background: rgba(193,127,89,0.04);
}
.closing-affirm-label {
  font-size: 7.5px; color: #C17F59; letter-spacing: 2.5px;
  text-transform: uppercase; font-weight: 700;
  margin-bottom: 8px; font-family: Helvetica, Arial, sans-serif;
}
.closing-affirm-text {
  font-size: 13px; font-style: italic; color: #C17F59;
  line-height: 1.85; font-family: Georgia, serif;
}
.closing-brand-section {
  text-align: center; padding: 28px 85px 36px;
  border-top: 1px solid rgba(193,127,89,0.15);
  position: relative; z-index: 1;
}
.closing-brand-name {
  font-size: 16px; font-weight: 700; color: #C17F59;
  letter-spacing: 5px; margin-bottom: 6px;
  opacity: 0.7;
}
.closing-tagline {
  font-size: 9.5px; color: #97907F;
  font-style: italic; margin-bottom: 8px;
  font-family: Georgia, serif;
}
.closing-url {
  font-size: 8px; color: #97907F;
  font-family: Helvetica, Arial, sans-serif;
  letter-spacing: 1px;
  margin-bottom: 20px;
}
.closing-disclaimer {
  font-size: 7px; color: #97907F;
  line-height: 1.75; text-align: center;
  font-family: Helvetica, Arial, sans-serif;
}

/* ─── Pull Quote (screenshottable) ──────────────────────────────── */
.pull-quote {
  border-top: 1px solid rgba(193,127,89,0.2);
  border-bottom: 1px solid rgba(193,127,89,0.2);
  padding: 22px 28px; margin: 24px 0;
  text-align: center; page-break-inside: avoid;
  background: rgba(193,127,89,0.02);
}
.pull-quote-text {
  font-size: 14px; font-style: italic;
  color: #2A2418; line-height: 1.75;
  font-family: Georgia, serif;
}
.pull-quote-attr {
  font-size: 8px; color: #C17F59; letter-spacing: 2px;
  text-transform: uppercase; margin-top: 10px;
  font-family: Helvetica, Arial, sans-serif;
  opacity: 0.6;
}
</style></head>
<body>

<!-- ═══════════════ COVER PAGE ═══════════════ -->
<div class="cover">
  <div class="cover-border"></div>

  <div class="cover-inner">
    <div class="cover-brand">CELESTIA</div>
    <div class="cover-brand-rule"></div>

    <div class="cover-type-badge">${escapeHTML(reportLabel)} Report</div>

    <div class="cover-zodiac-ring">♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓</div>

    <div class="cover-name">${escapeHTML(name)}</div>

    <div class="cover-divider">
      <div class="cover-divider-line"></div>
      <div class="cover-divider-star">✦</div>
      <div class="cover-divider-line"></div>
    </div>

    <div class="cover-headline">"${escapeHTML(report.headline || '')}"</div>

    <div class="cover-meta">
      ${birthDate ? `<span class="cover-meta-highlight">${escapeHTML(birthDate)}</span>` : ''}${birthTime ? ` · ${escapeHTML(birthTime)}` : ''}${birthPlace ? `<br/>${escapeHTML(birthPlace)}` : ''}
    </div>

    <div class="cv-pills">
      ${sun ? `<div class="cv-pill"><span class="cv-pill-glyph">☉</span><div class="cv-pill-sign">${escapeHTML(sun.sign)}</div><div class="cv-pill-role">SUN</div></div>` : ''}
      ${moon ? `<div class="cv-pill"><span class="cv-pill-glyph">☽</span><div class="cv-pill-sign">${escapeHTML(moon.sign)}</div><div class="cv-pill-role">MOON</div></div>` : ''}
      ${rising ? `<div class="cv-pill"><span class="cv-pill-glyph">ASC</span><div class="cv-pill-sign">${escapeHTML(rising.sign)}</div><div class="cv-pill-role">RISING</div></div>` : ''}
    </div>

    <div class="cv-motif-rule"></div>
    <div class="cv-motif-label">CORE MOTIF</div>
    <div class="cv-motif">${escapeHTML(report.coreMotif || '')}</div>
  </div>

  <div class="cover-foot">
    <div class="cover-foot-text">Celestia</div>
    <div class="cover-foot-date">Generated ${escapeHTML(genDate)}</div>
  </div>
</div>

<!-- ═══════════════ OVERVIEW ═══════════════ -->
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · OVERVIEW</span></div>
<div class="pc">
  <div class="section-title">The Story Written in Your Stars</div>
  <div class="section-subtitle">YOUR COSMIC BLUEPRINT</div>
  <div class="sr"></div>
  ${nl2p(report.overview)}
  ${report.coreMotif ? `
  <div class="pull-quote">
    <div class="pull-quote-text">"${escapeHTML(report.coreMotif)}"</div>
    <div class="pull-quote-attr">— ${escapeHTML(firstName)}'s Core Motif</div>
  </div>` : ''}
</div>
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)} <span class="page-num">2</span></div>

<!-- ═══════════════ CHART DATA ═══════════════ -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · NATAL DATA</span></div>
<div class="pc">
  <div class="sl">Planetary Positions</div><div class="sr"></div>
  <table class="dt">
    <tr><th></th><th>Planet</th><th>Sign</th><th style="text-align:center">House</th><th style="text-align:right">Degree</th></tr>
    ${planetRows}
  </table>
  ${aspectRows ? `
  <div class="sl">Major Aspects</div><div class="sr"></div>
  <table class="dt">
    <tr><th>Planet</th><th>Aspect</th><th>Planet</th><th style="text-align:right">Orb</th></tr>
    ${aspectRows}
  </table>` : ''}
</div>
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)} <span class="page-num">3</span></div>

<!-- ═══════════════ BIG THREE — flowing, sections stay together ═══════════════ -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · THE BIG THREE</span></div>
<div class="pc">
  <div class="section-title">The Three Pillars of You</div>
  <div class="section-subtitle">SUN · MOON · RISING</div>
  <div class="sr"></div>
${['sun', 'moon', 'rising'].map((key, idx) => {
  const data = report.bigThree?.[key];
  if (!data) return '';
  const cfg = BIG3_CONFIG[key];
  const planetData = key === 'sun' ? sun : key === 'moon' ? moon : rising;
  return `
  <div class="section-block">
    <div class="b3-band" style="background:${cfg.band}">
      <div class="b3-band-inner">
        <span class="b3-glyph">${cfg.glyph}</span>
        <div class="b3-band-text">
          <div class="b3-title">${escapeHTML(data.title)}</div>
          <div class="b3-meta">${planetData?.sign || ''} · House ${planetData?.house || ''}</div>
        </div>
      </div>
    </div>
    <div class="b3-content">
      <div class="placement-badge">${cfg.glyph} ${cfg.label.replace('Your ', '')} in ${planetData?.sign || ''}${planetData?.house ? ' · House ' + planetData.house : ''}</div>
      <div class="b3-sublabel">${cfg.sublabel}</div>
      ${nl2p(data.interpretation)}
      <div class="highlight">
        <b style="color:#C17F59">THE SHADOW:</b> ${escapeHTML(data.shadow)}
      </div>
      <div class="callout gold-callout">
        <div class="callout-icon">✦</div>
        <div><div class="callout-label gold-label">GUIDANCE</div><p class="callout-text">${escapeHTML(data.advice)}</p></div>
      </div>
    </div>
  </div>
  ${idx < 2 ? '<div class="section-divider"></div>' : ''}`;
}).join('')}
</div>
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)}</div>

<!-- ═══════════════ PLANETS — flowing, each planet stays together ═══════════════ -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · PLANETARY PLACEMENTS</span></div>
<div class="pc">
  <div class="section-title">The Voices Within You</div>
  <div class="section-subtitle">MERCURY THROUGH PLUTO</div>
  <div class="sr"></div>
${(report.planets || []).map((p, idx) => `
  <div class="section-block">
    <div class="planet-band">
      <span class="planet-glyph">${PLANET_GLYPHS[p.name] || '★'}</span>
      <div class="planet-band-text">
        <div class="planet-title">${escapeHTML(p.title)}</div>
        <div class="planet-placement">${escapeHTML(p.placement)}</div>
      </div>
    </div>
    <div class="planet-body">
      <div class="placement-badge">${PLANET_GLYPHS[p.name] || '★'} ${escapeHTML(p.placement)}</div>
      ${nl2p(p.interpretation)}
      <div class="callout gold-callout">
        <div class="callout-icon">✦</div>
        <div><div class="callout-label gold-label">GUIDANCE</div><p class="callout-text">${escapeHTML(p.advice)}</p></div>
      </div>
    </div>
  </div>
  ${idx < (report.planets || []).length - 1 ? '<div class="section-divider"></div>' : ''}
`).join('')}
</div>
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)}</div>

<!-- ═══════════════ LIFE AREAS — flowing, each area stays together ═══════════════ -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · LIFE AREAS</span></div>
<div class="pc">
  <div class="section-title">Where Your Stars Meet Your Life</div>
  <div class="section-subtitle">LOVE · CAREER · PURPOSE · CHALLENGE</div>
  <div class="sr"></div>
${['love', 'career', 'purpose', 'challenge'].map((key, idx) => {
  const data = report.lifeAreas?.[key];
  if (!data) return '';
  return `
  <div class="section-block">
    <div class="area-band" style="background:${AREA_COLORS[key]}">
      <span class="area-icon">${AREA_ICONS[key]}</span>
      <div class="area-band-text">
        <div class="area-title">${AREA_LABELS[key]}</div>
        <div class="area-theme">${escapeHTML(data.theme)}</div>
      </div>
    </div>
    <div class="area-content">
      <div class="placement-badge">${AREA_ICONS[key]} ${AREA_LABELS[key]}</div>
      ${nl2p(data.analysis)}
      <div class="callout gold-callout">
        <div class="callout-icon">→</div>
        <div><div class="callout-label gold-label">YOUR MOVE</div><p class="callout-text">${escapeHTML(data.advice)}</p></div>
      </div>
    </div>
  </div>
  ${idx < 3 ? '<div class="section-divider"></div>' : ''}`;
}).join('')}
</div>
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)}</div>

<!-- ═══════════════ KEY ASPECTS — "The Patterns That Define You" ═══════════════ -->
${(() => {
  const PATTERN_LABELS = {
    'Sun-Moon': { Square: 'Your mind and heart are in constant tension — that is where your growth lives.', Opposition: 'You are pulled between who you are and what you feel.', Conjunction: 'Your identity and emotions are fused. You feel everything as deeply personal.', Trine: 'Your head and heart agree more than most.' },
    'Venus-Mars': { Conjunction: 'You love intensely and cannot do halfway. Passion is your default.', Square: 'What you want and what you attract do not always match — and that tension is magnetic.', Opposition: 'You are drawn to people who challenge you.', Trine: 'Desire and affection flow together naturally.' },
    'Moon-Saturn': { Square: 'You never feel like enough, even when you are.', Conjunction: 'Emotions meet discipline. You carry a heaviness others do not see.', Opposition: 'You oscillate between needing comfort and pushing it away.' },
    'Sun-Saturn': { Square: 'You hold yourself to impossible standards. The world respects you — but it costs you.', Conjunction: 'Discipline is woven into your identity.', Opposition: 'Authority figures trigger something deep.' },
    'Moon-Pluto': { Square: 'Your emotions are volcanic. You feel everything at maximum intensity.', Conjunction: 'You transform through emotional crisis.', Opposition: 'Power dynamics in relationships are your core lesson.' },
    'Venus-Saturn': { Square: 'Love feels hard-won for you. You do not trust easily — and that is protective, not broken.', Conjunction: 'You take love seriously. Casual does not exist in your vocabulary.' },
    'Sun-Pluto': { Square: 'You are compelled to dig beneath surfaces. Superficial living is not an option.', Conjunction: 'You radiate intensity. People are drawn to you and intimidated simultaneously.' },
  };
  const aspects = (profile.chart?.aspects || []);
  const patterns = [];
  for (const a of aspects) {
    const k1 = a.planet1 + '-' + a.planet2;
    const k2 = a.planet2 + '-' + a.planet1;
    const match = (PATTERN_LABELS[k1] && PATTERN_LABELS[k1][a.type]) || (PATTERN_LABELS[k2] && PATTERN_LABELS[k2][a.type]);
    if (match) patterns.push({ label: a.planet1 + ' ' + a.type + ' ' + a.planet2, text: match, orb: a.orb });
    if (patterns.length >= 4) break;
  }
  if (patterns.length === 0) return '';
  return `<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · KEY ASPECTS</span></div>
<div class="pc">
  <div class="section-title">The Invisible Threads</div>
  <div class="section-subtitle">THE PATTERNS THAT DEFINE YOU</div>
  <div class="sr"></div>
  <p class="body">These are the aspects in your chart that shape your deepest patterns — the ones you live every day but may have never been able to name. Understanding them is not about fixing anything. It is about finally seeing what has always been there.</p>
  <div class="section-ornament">✦</div>
  ${patterns.map(p => `
  <div class="highlight">
    <div style="font-size: 9px; font-weight: 700; color: #C17F59; letter-spacing: 1.5px; text-transform: uppercase; font-family: Helvetica, Arial, sans-serif; margin-bottom: 6px;"><span class="placement-badge" style="display:inline;padding:3px 10px;font-size:8px">${escapeHTML(p.label)} (${p.orb?.toFixed(1) || ''}°)</span></div>
    <p style="font-size: 11.5px; color: #2A2418; line-height: 1.8; margin: 0;">${escapeHTML(p.text)}</p>
  </div>`).join('')}
</div>
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)} <span class="page-num">7</span></div>`;
})()}

<!-- ═══════════════ SOUL PATH ═══════════════ -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · SOUL PATH</span></div>
<div class="pc">
  <div class="section-title">The Path You Were Born to Walk</div>
  <div class="section-subtitle">YOUR EVOLUTIONARY JOURNEY</div>
  <div class="sr"></div>
  ${soulPathHTML}
</div>
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)} <span class="page-num">8</span></div>

<!-- ═══════════════ ELEMENTAL BALANCE ═══════════════ -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · ELEMENTAL BALANCE</span></div>
<div class="pc">
  <div class="section-title">Your Inner Landscape</div>
  <div class="section-subtitle">ELEMENTAL TEMPERAMENT</div>
  <div class="sr"></div>
  <div style="padding:10px 0 6px">
    ${elBar('fire', elements.fire || 0)}
    ${elBar('earth', elements.earth || 0)}
    ${elBar('air', elements.air || 0)}
    ${elBar('water', elements.water || 0)}
  </div>
  <div class="el-summary">
    <div style="display:flex;gap:24px;margin-bottom:14px">
      <div>
        <div class="el-dom-label">DOMINANT ELEMENT</div>
        <div class="el-dom-val">${escapeHTML(report.elementalBalance?.dominantElement || 'Mixed')}</div>
      </div>
      <div>
        <div class="el-dom-label">DOMINANT MODALITY</div>
        <div class="el-dom-val">${escapeHTML(report.elementalBalance?.dominantModality || 'Mixed')}</div>
      </div>
    </div>
    ${nl2p(report.elementalBalance?.analysis)}
  </div>
</div>
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)} <span class="page-num">9</span></div>

<!-- ═══════════════ CLOSING ═══════════════ -->
<div class="closing">
  <div class="closing-ph">
    <span class="ph-left">CELESTIA</span>
    <span class="ph-right">${escapeHTML(name.toUpperCase())} · YOUR COSMIC JOURNEY</span>
  </div>
  <div class="closing-content">
    <div class="section-title" style="text-align:center;margin-bottom:4px">A Letter to ${escapeHTML(firstName)}</div>
    <div class="section-subtitle" style="text-align:center">YOUR COSMIC JOURNEY</div>
    <div class="sr" style="border-color:#C17F59;opacity:0.2;margin-bottom:26px"></div>
    ${(report.closing || '').split(/\n\n+/).filter(Boolean).map(p => `<p class="closing-body">${escapeHTML(p)}</p>`).join('')}
    <div class="closing-ornament">✦   ✦   ✦</div>
    <div class="closing-philosophy">Your chart does not define your destiny. It illuminates the patterns. Now you see them.</div>
    <div class="closing-affirm">
      <div class="closing-affirm-label">YOUR CORE MOTIF</div>
      <div class="closing-affirm-text">"${escapeHTML(report.coreMotif || '')}"</div>
    </div>
  </div>
  <div class="closing-brand-section">
    <div class="closing-brand-name">CELESTIA</div>
    <div class="closing-tagline">Your personal astrologer</div>
    <div class="closing-url">hicelestia.com</div>
    <div class="closing-disclaimer">
      This report was generated by AI for self-reflection and entertainment purposes.<br>
      Astrology is a symbolic language, not a predictive science.<br>
      © Celestia ${new Date().getFullYear()}
    </div>
  </div>
</div>

</body></html>`;
};

const escapeHTML = (str) => {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

// ── Filename helpers ────────────────────────────────────────────────────────
const REPORT_LABELS = {
  love: 'Love-Report',
  career: 'Career-Report',
  lunar: 'Lunar-Guide',
  purpose: 'Life-Purpose-Report',
  solar_return: 'Solar-Return',
  monthly: `${MONTH_NAME}-Forecast`,
  yearly: 'Yearly-Forecast',
  transit: 'Transit-Report',
};

const buildPdfFilename = (name, type) => {
  const safeName = (name || 'Report').split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
  const label = REPORT_LABELS[type] || 'Report';
  const date = new Date().toISOString().split('T')[0];
  return `Celestia-${safeName}-${label}-${date}.pdf`;
};

// ── Component ───────────────────────────────────────────────────────────────
export default function ReportsScreen() {
  const navigation = useNavigation();
  const { isPro } = useRevenueCat();
  const { capture } = useAnalytics();
  const { userProfile } = useUserProfile();
  const { colors, isDark } = useTheme();

  const sunSign = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign;

  const [reportModal, setReportModal] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportType, setReportType] = useState('');
  const [savedReports, setSavedReports] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [genStep, setGenStep] = useState(0);
  const pdfCancelledRef = useRef(false);

  // Toast notification
  const [toast, setToast] = useState(null); // { message, filename }
  const [narrativeCtx, setNarrativeCtx] = useState(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef(null);

  const showToast = (message, filename) => {
    setToast({ message, filename });
    Animated.timing(toastAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => setToast(null));
    }, 4000);
  };

  useEffect(() => {
    return () => { if (toastTimeout.current) clearTimeout(toastTimeout.current); };
  }, []);

  // Load saved reports for "My Reports" section
  const loadSavedReports = async () => {
    try {
      const reports = await ReportRepository.getReportsForProfile(userProfile?.id || 'default');
      setSavedReports(reports.filter(r => r.type === 'full_report'));
    } catch (e) { }
  };

  useEffect(() => {
    loadSavedReports();
    getNarrativeContext(userProfile?.id || 'default', userProfile?.chart)
      .then(ctx => setNarrativeCtx(ctx))
      .catch(() => { });
  }, [userProfile?.id]);

  const getReportDescription = (type) => {
    const defaults = {
      love: 'Venus, attachment style & why you love like this',
      career: 'Midheaven, Saturn & your professional destiny',
      lunar: 'Moon rituals aligned with your natal chart',
      purpose: 'North Node decoded — where your soul is headed',
      solar_return: 'Your complete year ahead from birthday to birthday',
      monthly: 'This month\'s energy, themes & key dates',
      yearly: 'Month-by-month roadmap for your year',
      transit: 'Current planetary weather hitting your chart',
      venus: 'Attachment patterns, love language & what you need',
      saturn_return_guide: 'Ages 27–30 survival guide for everything changing',
    };
    if (!narrativeCtx) return defaults[type] || defaults.love;

    const windows = narrativeCtx.today?.cosmicWindows || [];
    const loveWindows = windows.filter(w => ['Venus', 'Moon'].includes(w.planet) || ['Venus', 'Moon'].includes(w.natalPlanet));
    const careerWindows = windows.filter(w => ['Saturn', 'Jupiter', 'Mars'].includes(w.planet));

    if (type === 'love' && loveWindows.length > 0) return `${loveWindows[0].planet} is active in your chart \u2014 perfect timing for a love deep-dive`;
    if (type === 'career' && careerWindows.length > 0) return `${careerWindows[0].planet} is reshaping your ambitions \u2014 this report guides you through`;
    if (type === 'career' && narrativeCtx.season?.planet === 'Saturn') return 'Saturn is reshaping your ambitions \u2014 this report guides you through';
    return defaults[type] || defaults.love;
  };

  const handleReport = async (r) => {
    if (!userProfile?.chart) {
      Alert.alert('Profile Required', 'Complete onboarding to generate reports.');
      return;
    }

    // Selective Gating: Only 'monthly' is free. Dual-path: subscribe OR buy single report.
    if (!isReportAccessible(r.type, isPro)) {
      haptic.medium();
      const report = REPORTS.find(rep => rep.type === r.type);
      if (report?.tier === 'premium') {
        // Premium reports — always $9.99, even for Pro subscribers
        Alert.alert(
          `Get Your ${r.name}`,
          'This deep-dive report is a one-time purchase.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: '$9.99 — Get This Report', onPress: () => navigation.navigate('Paywall', { source: `report_single_${r.type}`, reportName: r.name }) },
          ]
        );
      } else {
        // Pro-tier reports — subscribe to unlock
        Alert.alert(
          `Get Your ${r.name}`,
          'This report is included with Pro.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Go Pro', onPress: () => navigation.navigate('Paywall', { source: 'reports', reportName: r.name }) },
          ]
        );
      }
      return;
    }

    setReportTitle(r.name);
    setReportType(r.type);
    setReportData(null);
    setReportModal(true);
    setReportLoading(true);
    try {
      const data = await generateFullReport(userProfile, r.type, narrativeCtx);
      setReportData(data);
      haptic.success();
      loadSavedReports();
      capture(EVENTS.REPORT_GENERATED, { report_type: r.type });
      const profileId = userProfile?.id || 'default';
      trackEvent('report_generated').catch(() => { });
      awardXP(profileId, 'report_read').catch(() => { });
    } catch (e) {
      console.error('Report generation error:', e);
      Alert.alert('Hmm', 'The stars weren\'t quite ready. Give it another try?');
      setReportModal(false);
    } finally {
      setReportLoading(false);
    }
  };

  const handleSolarReturn = () => {
    handleReport({ name: `${CURRENT_YEAR} Solar Return`, type: 'solar_return' });
  };

  const handleMonthlyReport = () => {
    handleReport({ name: `${MONTH_NAME} Forecast`, type: 'monthly' });
  };

  const advanceStep = useCallback((step) => {
    if (!pdfCancelledRef.current) setGenStep(step);
  }, []);

  const handleDownloadPdf = async () => {
    if (!userProfile?.chart) return;

    // Gate check using tier system
    if (!isReportAccessible(reportType, isPro)) {
      haptic.medium();
      const theme = REPORT_THEMES[reportType] || DEFAULT_THEME;
      const report = REPORTS.find(r => r.type === reportType);
      Alert.alert(
        `Get Your ${theme.title}`,
        report?.tier === 'premium' ? 'This deep-dive report is a one-time purchase.' : 'This report is included with Pro.',
        [
          { text: 'Cancel', style: 'cancel' },
          report?.tier === 'premium'
            ? { text: '$9.99 — Get This Report', onPress: () => navigation.navigate('Paywall', { source: `report_single_${reportType}`, reportName: theme.title }) }
            : { text: 'Go Pro', onPress: () => navigation.navigate('Paywall', { source: 'reports', reportName: theme.title }) },
        ]
      );
      return;
    }
    pdfCancelledRef.current = false;

    setPdfLoading(true);
    setGenStep(0);
    const theme = REPORT_THEMES[reportType] || DEFAULT_THEME;
    const numSteps = theme.steps.length;
    try {
      // Steps 0-1: Initial reading (fast, builds anticipation)
      await new Promise(r => setTimeout(r, 800));
      if (pdfCancelledRef.current) return;
      advanceStep(1);
      await new Promise(r => setTimeout(r, 700));
      if (pdfCancelledRef.current) return;

      // Steps 2-5: AI generation (auto-advance during the long call)
      advanceStep(2);
      const stepTimer = setInterval(() => {
        setGenStep(prev => (prev < numSteps - 3 ? prev + 1 : prev));
      }, 3200);

      const deepReport = await generateDeepPdfReport(userProfile, reportType, narrativeCtx);
      clearInterval(stepTimer);
      if (pdfCancelledRef.current) return;

      // Step N-2: Designing PDF
      advanceStep(numSteps - 2);
      const html = generateDeepReportHTML(deepReport, userProfile, reportType);
      await new Promise(r => setTimeout(r, 500));
      if (pdfCancelledRef.current) return;

      const { uri: tempUri } = await Print.printToFileAsync({ html, width: 612, height: 792, base64: false });
      if (pdfCancelledRef.current) return;

      // Step N-1: Preparing download
      advanceStep(numSteps - 1);
      const filename = buildPdfFilename(userProfile?.name, reportType);
      const tempFile = new File(tempUri);
      const destFile = new File(Paths.cache, filename);
      if (destFile.exists) destFile.delete();
      tempFile.move(destFile);
      const destUri = destFile.uri;
      await new Promise(r => setTimeout(r, 600));

      // Done
      setPdfLoading(false);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(destUri, {
          mimeType: 'application/pdf',
          dialogTitle: filename.replace('.pdf', '').replace(/-/g, ' '),
          UTI: 'com.adobe.pdf',
        });
      }

      showToast('PDF Ready', filename);
    } catch (e) {
      if (pdfCancelledRef.current) return;
      console.error('PDF error:', e);
      Alert.alert('Error', 'Could not generate PDF. Please try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleCancelPdf = useCallback(() => {
    pdfCancelledRef.current = true;
    setPdfLoading(false);
  }, []);

  const handleShareText = async () => {
    if (!reportData) return;
    const sections = (reportData.sections || []).map((s, i) => `${i + 1}. ${s.heading}\n${s.body}`).join('\n\n');
    try {
      await Share.share({
        message: `${reportData.title}\n\n${reportData.summary}\n\n${sections}\n\n${reportData.keyInsight ? `✦ ${reportData.keyInsight}` : ''}\n\n— Celestia`,
      });
    } catch (e) { }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 112 }}>
        <View style={styles.top}>
          <Text style={[styles.h1, { color: colors.heading }]}>Reports</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            {sunSign
              ? `AI-powered reports written for your ${sunSign} Sun chart.`
              : 'Premium cosmic intelligence, written by AI using your exact birth chart.'}
          </Text>
        </View>

        {/* Featured — Monthly Forecast (auto-updates each month) */}
        <TouchableOpacity style={styles.featuredWrap} activeOpacity={0.85} onPress={handleMonthlyReport}>
          <LinearGradient colors={['#12082A', '#2A1060', '#0C1840']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featuredImg}>
            <Text style={{ fontSize: 56, color: '#B388FF' }}>☽</Text>
            <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>{MONTH_NAME.toUpperCase()}</Text></View>
          </LinearGradient>
          <View style={[styles.featuredBody, { backgroundColor: colors.card }]}>
            <Text style={[styles.featuredTitle, { color: colors.heading }]}>Your {MONTH_NAME} Forecast</Text>
            <Text style={[styles.featuredDesc, { color: colors.textSecondary }]}>
              {sunSign
                ? `${MONTH_ZODIAC_ENERGY[CURRENT_MONTH]} See how it hits your ${sunSign} chart week by week.`
                : `${MONTH_ZODIAC_ENERGY[CURRENT_MONTH]} Your personalized week-by-week cosmic guide.`}
            </Text>
            <View style={styles.featuredFoot}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={[styles.featuredPrice, { color: colors.heading }]}>Free</Text>
                <Text style={styles.featuredWas}>$12</Text>
              </View>
              <TouchableOpacity activeOpacity={0.85} onPress={handleMonthlyReport}>
                <LinearGradient colors={['#C9A0FF', '#B388FF', '#9060E0']} style={styles.featuredCta}>
                  <Text style={[styles.featuredCtaText, { color: '#fff' }]}>Get {MONTH_NAME} Report</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* My Reports — previously generated */}
        {savedReports.length > 0 && (
          <View style={{ paddingHorizontal: 22, marginBottom: 16 }}>
            <Text style={styles.sectionLabel}>MY REPORTS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {savedReports.slice(0, 8).map((r, i) => {
                const typeLabels = { love: 'Love', career: 'Career', lunar: 'Lunar', purpose: 'Purpose', solar_return: 'Solar Return', yearly: 'Yearly', transit: 'Transit', monthly: 'Monthly', venus: 'Venus', saturn_return_guide: 'Saturn Return' };
                const typeIcons = { love: '♀', career: '♄', lunar: '☽', purpose: '☊', solar_return: '☉', yearly: '♃', transit: '☿', monthly: '☽', venus: '♀', saturn_return_guide: '♄' };
                const subtype = r.id?.split('_report_')[1] || r.subtype || '';
                return (
                  <TouchableOpacity key={i} style={[styles.savedChip, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7}
                    onPress={() => handleReport({ name: typeLabels[subtype] || subtype, type: subtype })}>
                    <Text style={styles.savedChipIcon}>{typeIcons[subtype] || '✦'}</Text>
                    <Text style={[styles.savedChipText, { color: colors.heading }]}>{typeLabels[subtype] || 'Report'}</Text>
                    <Text style={[styles.savedChipDate, { color: colors.textSecondary }]}>{r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Report Grid — rich cards matching plan design */}
        <View style={{ paddingHorizontal: 18 }}>
          {REPORTS.map((r, i) => {
            const accessible = isReportAccessible(r.type, isPro);
            return (
              <TouchableOpacity key={i} style={[styles.reportCard, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.8} onPress={() => handleReport(r)}>
                {/* Top accent bar */}
                <View style={{ height: 3, backgroundColor: r.accent, borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
                <View style={{ padding: 16 }}>
                  {/* Header row: icon + name + tag */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: r.bg[0], alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      <Text style={{ fontSize: 22, color: r.accent }}>{r.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: FONTS.serif, fontSize: 16, color: colors.heading }}>{r.name}</Text>
                      {r.subtitle && <Text style={{ fontSize: 11, color: r.accent, fontFamily: FONTS.sansMedium, marginTop: 1 }}>{r.subtitle}</Text>}
                    </View>
                    {r.tag && (
                      <View style={{ backgroundColor: r.accent + '18', borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8 }}>
                        <Text style={{ fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 0.5, color: r.accent }}>{r.tag.toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  {/* Description */}
                  <Text style={{ fontSize: 12.5, color: colors.textSecondary, lineHeight: 18, marginBottom: 10 }}>{r.desc}</Text>
                  {/* Meta row: pages + read time + price */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      {r.pages && <Text style={{ fontSize: 10, color: colors.textMuted }}>📖 {r.pages} pages</Text>}
                      {r.readTime && <Text style={{ fontSize: 10, color: colors.textMuted }}>⏱ {r.readTime} read</Text>}
                    </View>
                    <Text style={{ fontFamily: FONTS.sansSemiBold, fontSize: 14, color: accessible ? colors.gold : r.accent }}>
                      {accessible ? (r.type === 'monthly' ? 'Free' : 'In Pro ✓') : (r.tier === 'premium' ? '$9.99' : 'Pro')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Report Display Modal */}
      <Modal visible={reportModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.modalBg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.heading }]} numberOfLines={1}>{reportData?.title || reportTitle}</Text>
            <TouchableOpacity onPress={() => setReportModal(false)}>
              <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {reportLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={[styles.loadingText, { color: colors.heading }]}>Consulting the stars...</Text>
              <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>Generating your personalized report</Text>
            </View>
          ) : reportData ? (
            <>
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Summary */}
                <LinearGradient colors={['#0E0E22', '#1A1060']} style={styles.summaryCard}>
                  <Text style={styles.summaryText}>{reportData.summary}</Text>
                </LinearGradient>

                {/* Sections */}
                {reportData.sections?.map((section, i) => (
                  <View key={i} style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionNum}>
                        <Text style={styles.sectionNumText}>{i + 1}</Text>
                      </View>
                      <Text style={[styles.sectionHeading, { color: colors.heading }]}>{section.heading}</Text>
                    </View>
                    <Text style={[styles.sectionBody, { color: colors.text }]}>{section.body}</Text>
                    {/* Highlight box — the screenshottable key insight */}
                    {section.highlight && (
                      <View style={styles.highlightBox}>
                        <Text style={styles.highlightLabel}>KEY INSIGHT</Text>
                        <Text style={[styles.highlightText, { color: colors.text }]}>{section.highlight}</Text>
                      </View>
                    )}
                    {section.remedy && (
                      <View style={styles.remedyBox}>
                        <Text style={styles.remedyLabel}>REMEDY</Text>
                        <Text style={[styles.remedyText, { color: colors.text }]}>{section.remedy}</Text>
                      </View>
                    )}
                    {section.affirmation && (
                      <View style={[styles.affirmBox, { backgroundColor: colors.cardAlt }]}>
                        <Text style={[styles.affirmText, { color: colors.heading }]}>"{section.affirmation}"</Text>
                      </View>
                    )}
                    {/* Bridge to chat */}
                    <TouchableOpacity style={styles.askAboutBtn} activeOpacity={0.7}
                      onPress={() => {
                        setReportModal(false);
                        setTimeout(() => {
                          navigation.navigate('AskAI', { initialMessage: `Tell me more about "${section.heading}" from my ${reportTitle}. The report said: "${(section.body || '').slice(0, 100)}..."` });
                        }, 300);
                      }}>
                      <Text style={styles.askAboutBtnText}>Ask Celestia about this →</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Key Insight */}
                {reportData.keyInsight && (
                  <LinearGradient colors={['#2A1A6E', '#0E0E22']} style={styles.insightCard}>
                    <Text style={styles.insightLabel}>KEY INSIGHT</Text>
                    <Text style={styles.insightText}>{reportData.keyInsight}</Text>
                  </LinearGradient>
                )}

                {/* ── Bridge Navigation Links ── */}
                <View style={styles.bridgeContainer}>
                  <TouchableOpacity
                    style={[styles.bridgePrimary, { borderColor: isDark ? 'rgba(200,168,75,0.2)' : 'rgba(200,168,75,0.2)' }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setReportModal(false);
                      setTimeout(() => {
                        navigation.navigate('AskAI', {
                          initialMessage: `I just read my ${reportTitle} report. What stood out and what should I focus on?`,
                        });
                      }, 300);
                    }}
                  >
                    <Text style={styles.bridgePrimaryIcon}>✦</Text>
                    <Text style={[styles.bridgePrimaryText, { color: colors.heading }]}>Discuss with Celestia</Text>
                    <Text style={styles.bridgeArrow}>{'\u2192'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.bridgeSecondary, { borderColor: colors.border }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setReportModal(false);
                      setTimeout(() => {
                        navigation.navigate('Chart');
                      }, 300);
                    }}
                  >
                    <Text style={styles.bridgeSecondaryIcon}>☉</Text>
                    <Text style={styles.bridgeSecondaryText}>Explore your chart</Text>
                    <Text style={styles.bridgeArrowSecondary}>{'\u2192'}</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Bottom action bar */}
              <View style={[styles.actionBar, { backgroundColor: colors.bg, borderTopColor: colors.divider }]}>
                <TouchableOpacity style={[styles.actionBtnOutline, { borderColor: colors.border }]} activeOpacity={0.7} onPress={handleShareText}>
                  <Text style={[styles.actionBtnOutlineText, { color: colors.textSecondary }]}>Share ↗</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnFill} activeOpacity={0.85} onPress={handleDownloadPdf} disabled={pdfLoading}>
                  <LinearGradient colors={[T.navy, '#1A1060']} style={styles.actionBtnGrad}>
                    <Text style={styles.actionBtnFillText}>Download PDF ↓</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      </Modal>

      {/* ── Cinematic PDF Generation Overlay ── */}
      <GenerationOverlay
        visible={pdfLoading}
        currentStep={genStep}
        totalSteps={(REPORT_THEMES[reportType] || DEFAULT_THEME).steps.length}
        onCancel={handleCancelPdf}
        theme={REPORT_THEMES[reportType] || DEFAULT_THEME}
      />

      {/* ── Toast Notification ── */}
      {toast && (
        <Animated.View style={[styles.toast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <View style={styles.toastIcon}><Text style={{ fontSize: 16 }}>✓</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.toastTitle}>{toast.message}</Text>
            <Text style={styles.toastFile} numberOfLines={1}>{toast.filename}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: Platform.OS === 'ios' ? 70 : (StatusBar.currentHeight || 48) + 16, paddingHorizontal: 22, paddingBottom: 4 },
  h1: { fontFamily: FONTS.serif, fontSize: 32, color: T.navy, marginBottom: 5 },
  sub: { fontSize: 13, color: T.stone, lineHeight: 20, marginBottom: 18 },
  featuredWrap: { marginHorizontal: 20, borderRadius: 21, overflow: 'hidden', marginBottom: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 40 },
  featuredImg: { height: 148, alignItems: 'center', justifyContent: 'center' },
  featuredBadge: { position: 'absolute', top: 14, left: 14, backgroundColor: T.gold, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12 },
  featuredBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: T.navy },
  featuredBody: { backgroundColor: 'white', padding: 17, paddingHorizontal: 19, paddingBottom: 19 },
  featuredTitle: { fontFamily: FONTS.serif, fontSize: 22, color: T.navy, marginBottom: 4 },
  featuredDesc: { fontSize: 12, color: T.stone, lineHeight: 18, marginBottom: 13 },
  featuredFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredPrice: { fontFamily: FONTS.serif, fontSize: 28, color: T.navy },
  featuredWas: { fontSize: 12, color: '#C0B8A4', textDecorationLine: 'line-through', marginLeft: 6 },
  featuredCta: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18, shadowColor: T.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  featuredCtaText: { fontFamily: FONTS.sansMedium, fontSize: 13, color: T.navy },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 18 },
  reportCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  rtile: { width: '48%', backgroundColor: 'white', borderRadius: 17, overflow: 'hidden', borderWidth: 1, borderColor: T.border, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
  rtileColor: { height: 74, alignItems: 'center', justifyContent: 'center' },
  rtileBody: { padding: 11, paddingHorizontal: 13, paddingBottom: 13 },
  rtileName: { fontFamily: FONTS.serif, fontSize: 16, color: T.navy, marginBottom: 2 },
  rtileDesc: { fontSize: 11, color: T.stone, lineHeight: 15, marginBottom: 9 },
  rtilePrice: { fontFamily: FONTS.serif, fontSize: 19, color: T.navy },
  tileLock: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  // Modal
  modal: { flex: 1, backgroundColor: T.cream },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 20, borderBottomWidth: 1, borderBottomColor: '#EDE6D8' },
  modalTitle: { fontFamily: FONTS.serif, fontSize: 20, color: T.navy, flex: 1, marginRight: 12 },
  modalClose: { fontSize: 18, color: T.stone, padding: 4 },
  modalBody: { flex: 1, padding: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  loadingText: { fontFamily: FONTS.serif, fontSize: 20, color: T.navy, marginTop: 20 },
  loadingSubtext: { fontSize: 13, color: T.stone, marginTop: 6 },
  summaryCard: { borderRadius: 18, padding: 20, marginBottom: 16 },
  summaryText: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 15, color: T.cream, lineHeight: 24, fontStyle: 'italic' },
  sectionCard: { backgroundColor: 'white', borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  sectionNumText: { fontFamily: FONTS.serif, fontSize: 14, color: T.gold },
  sectionHeading: { fontFamily: FONTS.serif, fontSize: 18, color: T.navy, flex: 1 },
  sectionBody: { fontSize: 13.5, color: T.ink, lineHeight: 22, marginBottom: 12 },
  remedyBox: { backgroundColor: 'rgba(200,168,75,0.08)', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 2, borderLeftColor: T.gold },
  remedyLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 4 },
  remedyText: { fontSize: 13, color: T.ink, lineHeight: 20 },
  affirmBox: { backgroundColor: T.warm, borderRadius: 12, padding: 12, alignItems: 'center' },
  affirmText: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 14, color: T.navy, fontStyle: 'italic', textAlign: 'center' },
  insightCard: { borderRadius: 18, padding: 20, marginBottom: 16, alignItems: 'center' },
  insightLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: 'rgba(200,168,75,0.6)', marginBottom: 8 },
  insightText: { fontFamily: FONTS.serif, fontSize: 17, color: T.cream, textAlign: 'center', lineHeight: 24 },
  // Bottom action bar
  actionBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30, backgroundColor: T.cream, borderTopWidth: 1, borderTopColor: '#EDE6D8' },
  actionBtnOutline: { flex: 1, height: 48, borderWidth: 1.5, borderColor: T.border, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionBtnOutlineText: { fontSize: 14, fontFamily: FONTS.sansMedium, color: '#6B6050' },
  actionBtnFill: { flex: 1.5, borderRadius: 14, overflow: 'hidden' },
  actionBtnGrad: { height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  actionBtnFillText: { fontSize: 14, fontFamily: FONTS.sansMedium, color: T.cream },
  // Toast
  toast: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: '#0D1527', borderRadius: 14, padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, zIndex: 999 },
  toastIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(80,200,120,0.15)', alignItems: 'center', justifyContent: 'center' },
  toastTitle: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: '#FAF8F3', marginBottom: 2 },
  toastFile: { fontSize: 11, color: 'rgba(250,248,242,0.5)' },
  // My Reports
  sectionLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 10 },
  savedChip: { backgroundColor: 'white', borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 12, paddingHorizontal: 16, alignItems: 'center', minWidth: 90 },
  savedChipIcon: { fontSize: 20, marginBottom: 4 },
  savedChipText: { fontSize: 11, fontFamily: FONTS.sansSemiBold, color: T.navy, marginBottom: 2 },
  savedChipDate: { fontSize: 9, color: T.stone },
  // Highlight box
  highlightBox: { backgroundColor: 'rgba(200,168,75,0.06)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.15)', borderRadius: 12, padding: 14, marginTop: 12 },
  highlightLabel: { fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 6 },
  highlightText: { fontSize: 13, fontFamily: FONTS.serifItalic || FONTS.serif, fontStyle: 'italic', color: T.ink, lineHeight: 20 },
  // Ask about bridge
  askAboutBtn: { marginTop: 10, paddingVertical: 8 },
  askAboutBtnText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.gold },
  // Bridge navigation links
  bridgeContainer: { marginTop: 8, gap: 10 },
  bridgePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(200,168,75,0.1)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.2)',
  },
  bridgePrimaryIcon: { fontSize: 16, color: T.gold, marginRight: 10 },
  bridgePrimaryText: { flex: 1, fontSize: 14, fontFamily: FONTS.sansMedium, color: T.navy },
  bridgeArrow: { fontSize: 16, color: T.gold },
  bridgeSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  bridgeSecondaryIcon: { fontSize: 14, color: T.stone, marginRight: 10 },
  bridgeSecondaryText: { flex: 1, fontSize: 13, fontFamily: FONTS.sansMedium, color: T.stone },
  bridgeArrowSecondary: { fontSize: 14, color: T.stone },
});
