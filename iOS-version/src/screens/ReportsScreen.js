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
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { generateFullReport, generateDeepPdfReport } from '../services/geminiService';
import { getNarrativeContext } from '../services/narrativeService';
import { haptic } from '../services/hapticService';
import { trackEvent } from '../services/achievementService';
import { awardXP } from '../services/xpService';
import GenerationOverlay from '../components/GenerationOverlay';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { useNavigation } from '@react-navigation/native';
import { useAnalytics, EVENTS } from '../services/analytics';


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
      '"How you choose partners says everything about how you see yourself."',
      '"The Moon knows what your heart needs before you do."',
      '"Love isn\'t written in the stars — it\'s written in your chart."',
      '"Mars shows your passion. Venus shows your poetry."',
      '"Every connection is a conversation between two patterns."',
    ],
  },
  career: {
    gradient: ['#0A1628', '#0C1E3A', '#081020'],
    accent: '#5A8AAA',
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
      { icon: '☊', label: 'Finding your North Node', sub: 'Your direction of growth in this life...' },
      { icon: '☋', label: 'Reading the South Node', sub: 'Gifts & patterns from before...' },
      { icon: '☉', label: 'Aligning your Sun purpose', sub: 'The light you\'re here to shine...' },
      { icon: '♃', label: 'Expanding with Jupiter', sub: 'Where the universe says "yes"...' },
      { icon: '♇', label: 'Pluto\'s transformation', sub: 'Deep rebirth & power...' },
      { icon: '✦', label: 'Weaving your story', sub: 'Connecting patterns and themes...' },
      { icon: '◇', label: 'Designing your PDF', sub: 'Illuminating your path...' },
      { icon: '✦', label: 'Almost ready', sub: 'Your purpose report awaits...' },
    ],
    quotes: [
      '"Your North Node is your direction-finder for this chapter."',
      '"Purpose isn\'t found — it\'s remembered."',
      '"The South Node holds your gifts. The North Node holds your growth."',
      '"You didn\'t come here to be small. Your chart proves it."',
      '"Pluto destroys what\'s false so what\'s real can breathe."',
      '"Your birth chart is the blueprint of your tendencies and direction."',
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
      '"Every birthday is a chance to reset the story."',
    ],
  },
  monthly: {
    gradient: ['#3A1A28', '#5A2840', '#1F0F18'],
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
      '"Each month is a chapter in a longer story about you."',
      '"The Moon this month holds a message just for you."',
      '"Planetary weather changes monthly — so should your strategy."',
      '"The best months are the ones you navigate consciously."',
      '"What the patterns highlight this month, you already feel."',
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
      { icon: '✦', label: 'Writing your outlook', sub: 'Connecting this week\'s patterns...' },
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
  { icon: '♡', bg: ['#3A0A3A', '#3A1A28'], accent: '#E85090', name: 'Love Compass', desc: 'How you do attachment, intimacy, and conflict', type: 'love', tier: 'pro' },
  { icon: '◆', bg: ['#0A2A3A', '#3A1A28'], accent: '#5A8AAA', name: 'Career & Colleagues', desc: 'Your working style, what energizes vs drains', type: 'career', tier: 'pro' },
  { icon: '◐', bg: ['#1A0A3A', '#1F0F18'], accent: '#A080E0', name: 'Cycles & Energy', desc: 'How your weekly rhythm shifts', type: 'lunar', tier: 'pro' },
  { icon: '✦', bg: ['#2A1A0A', '#3A1A28'], accent: '#C8A84B', name: 'Life Patterns', desc: 'Themes worth paying attention to', type: 'purpose', tier: 'pro' },
  { icon: '↗', bg: ['#0A1A2A', '#1F0F18'], accent: '#4ECDC4', name: 'Year of Patterns', desc: `Month-by-month outlook for ${CURRENT_YEAR}`, type: 'yearly', tier: 'pro' },
  { icon: '⚡', bg: ['#1A0A1A', '#2A0A2A'], accent: '#FF6B6B', name: 'Right Now', desc: 'What\'s shaping your week', type: 'transit', tier: 'pro' },
  { icon: '◎', bg: ['#3A1A28', '#5A2840'], accent: '#C8A84B', name: `Year Map ${CURRENT_YEAR}`, desc: 'Your year ahead from birthday to birthday', type: 'solar_return', tier: 'pro' },
];

// Report tier system (simplified):
// 'free' — Monthly forecast (always free for everyone)
// 'pro'  — All reports included with Pro subscription
const isReportAccessible = (reportType, isPro) => {
  if (reportType === 'monthly') return true;
  return isPro;
};

// ── Deep PDF HTML Generator ─────────────────────────────────────────────────
const generateDeepReportHTML = (report, profile, reportType) => {
  const name = profile?.name || 'friend';
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
  const AREA_COLORS = { love: '#7D2645', career: '#1A3A6E', purpose: '#5C4A15', challenge: '#7A3520' };
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

  // Big Three sections
  const BIG3_CONFIG = {
    sun: { band: '#2A1F08', glyph: '☉', label: 'Your Sun', sublabel: 'Identity · Ego · Life Force' },
    moon: { band: '#0D1E35', glyph: '☽', label: 'Your Moon', sublabel: 'Emotions · Inner World · Needs' },
    rising: { band: '#0D2535', glyph: 'ASC', label: 'Your Rising', sublabel: 'First Impression · Outer Self · Path' },
  };

  const big3HTML = ['sun', 'moon', 'rising'].map(key => {
    const data = report.bigThree?.[key];
    if (!data) return '';
    const cfg = BIG3_CONFIG[key];
    const planetData = key === 'sun' ? sun : key === 'moon' ? moon : rising;
    return `
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
    `;
  }).join('<div class="ornament">· · ·</div>');

  // Planets sections
  const planetsHTML = (report.planets || []).map(p => `
    <div class="planet-band">
      <span class="planet-glyph">${PLANET_GLYPHS[p.name] || '★'}</span>
      <div class="planet-band-text">
        <div class="planet-title">${escapeHTML(p.title)}</div>
        <div class="planet-placement">${escapeHTML(p.placement)}</div>
      </div>
    </div>
    <div class="planet-body">
      ${nl2p(p.interpretation)}
      <div class="callout gold-callout">
        <div class="callout-icon">✦</div>
        <div>
          <div class="callout-label gold-label">GUIDANCE</div>
          <p class="callout-text">${escapeHTML(p.advice)}</p>
        </div>
      </div>
    </div>
  `).join('');

  // Life areas
  const areasHTML = ['love', 'career', 'purpose', 'challenge'].map(key => {
    const data = report.lifeAreas?.[key];
    if (!data) return '';
    return `
      <div class="area-band" style="background:${AREA_COLORS[key]}">
        <span class="area-icon">${AREA_ICONS[key]}</span>
        <div class="area-band-text">
          <div class="area-title">${AREA_LABELS[key]}</div>
          <div class="area-theme">${escapeHTML(data.theme)}</div>
        </div>
      </div>
      <div class="area-content">
        ${nl2p(data.analysis)}
        <div class="callout gold-callout">
          <div class="callout-icon">→</div>
          <div>
            <div class="callout-label gold-label">YOUR MOVE</div>
            <p class="callout-text">${escapeHTML(data.advice)}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Soul path
  const soulPathHTML = report.soulPath ? `
    <div class="soul-card">
      <div class="soul-heading">☊ North Node · Your Direction of Growth</div>
      ${nl2p(report.soulPath.northNodeMessage)}
    </div>
    <div class="soul-card">
      <div class="soul-heading">☋ South Node · Old Patterns to Release</div>
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

/* ─── Utility ───────────────────────────────────────────────────── */
.page-break { page-break-before: always; }

/* ─── Page Header (navy band at top of every content page) ─────── */
.ph {
  background: #0D1527;
  padding: 13px 45px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: Helvetica, Arial, sans-serif;
  margin-bottom: 24px;
}
.ph-left {
  font-size: 8px; font-weight: 700; color: #C49A2A;
  letter-spacing: 3px; text-transform: uppercase;
}
.ph-right {
  font-size: 7px; color: #F5E6A8; letter-spacing: 1.2px;
}

/* ─── Page Footer ───────────────────────────────────────────────── */
.pf {
  font-family: Helvetica, Arial, sans-serif;
  font-size: 7px; color: #9C9590; letter-spacing: 0.5px;
  text-align: center; padding: 12px 45px;
  border-top: 1px solid #E0DAD3;
  margin-top: auto;
}

/* ─── Page Content Area ─────────────────────────────────────────── */
.pc { padding: 0 45px 20px; }

/* ─── Section Label + Rule ──────────────────────────────────────── */
.sl {
  font-size: 9px; font-weight: 700; color: #C49A2A;
  letter-spacing: 2.5px; text-transform: uppercase;
  margin-bottom: 6px; margin-top: 4px;
  font-family: Helvetica, Arial, sans-serif;
}
.sr { border-bottom: 1px solid #C49A2A; opacity: 0.35; margin-bottom: 16px; }

/* ─── Body Text ─────────────────────────────────────────────────── */
.body {
  font-size: 10.5px; color: #1A1614; line-height: 1.85;
  margin-bottom: 10px; text-align: justify;
}
.body-sm { font-size: 9.5px; color: #5C5650; line-height: 1.7; margin-bottom: 8px; }

/* ─── Ornamental Divider ────────────────────────────────────────── */
.ornament {
  color: #C49A2A; text-align: center; letter-spacing: 10px;
  font-size: 14px; margin: 22px 0; opacity: 0.7;
}

/* ─── Divider ───────────────────────────────────────────────────── */
.divider { border-bottom: 1px solid #E0DAD3; margin: 18px 0; }

/* ═══════════════════════════════════════════════════════════════════
   COVER PAGE — Full A4 dark premium design
   ═══════════════════════════════════════════════════════════════════ */
.cover {
  width: 100%;
  height: 100vh;
  background: #0B0E1A;
  page-break-after: always;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
}
/* Gold inset border — simple solid */
.cover-border {
  position: absolute;
  top: 30px; left: 30px; right: 30px; bottom: 30px;
  border: 0.5px solid rgba(196,154,42,0.3);
}
.corner { display: none; }
.cover-stars { display: none; }

.cover-inner {
  position: relative; z-index: 2;
  text-align: center;
  padding: 0 40px;
  display: flex; flex-direction: column;
  align-items: center;
  width: 100%;
}

/* Top brand section */
.cover-brand {
  font-size: 10px; font-weight: 700; color: #C49A2A;
  letter-spacing: 6px; text-transform: uppercase;
  font-family: Helvetica, Arial, sans-serif;
  margin-bottom: 16px;
}
.cover-brand-rule {
  width: 100px; height: 0.5px;
  background: #C49A2A;
  margin-bottom: 20px;
}

/* Report type badge */
.cover-type-badge {
  display: inline-block;
  border: 0.5px solid rgba(196,154,42,0.4);
  border-radius: 2px;
  padding: 4px 16px;
  font-size: 8px; color: #F5E6A8; letter-spacing: 3.5px;
  text-transform: uppercase;
  font-family: Helvetica, Arial, sans-serif;
  margin-bottom: 24px;
}

/* Decorative zodiac ring */
.cover-zodiac-ring {
  font-size: 7px; color: rgba(196,154,42,0.25);
  letter-spacing: 6px; margin-bottom: 20px;
}

/* Person's name — big serif */
.cover-name {
  font-size: 42px; font-weight: 700; color: #FAF8F3;
  letter-spacing: 1px; margin-bottom: 14px;
  line-height: 1.2;
}

/* Gold ornamental divider */
.cover-divider {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px;
}
.cover-divider-line {
  width: 70px; height: 0.5px;
  background: rgba(196,154,42,0.5);
}
.cover-divider-star {
  font-size: 10px; color: rgba(196,154,42,0.6);
}

/* Headline / tagline */
.cover-headline {
  font-size: 13.5px; font-style: italic; color: #C49A2A;
  line-height: 1.8; max-width: 360px;
  margin-bottom: 20px;
}

/* Birth details */
.cover-meta {
  font-size: 9px; color: rgba(250,248,243,0.45);
  letter-spacing: 1.5px; line-height: 1.8;
  font-family: Helvetica, Arial, sans-serif;
  margin-bottom: 20px;
}
.cover-meta-highlight {
  color: rgba(250,248,243,0.65);
}

/* Big Three pills row */
.cv-pills {
  display: flex; gap: 12px; margin-bottom: 20px;
}
.cv-pill {
  border: 0.5px solid rgba(196,154,42,0.35);
  border-radius: 3px;
  padding: 6px 14px;
  text-align: center;
  background: rgba(196,154,42,0.04);
}
.cv-pill-glyph {
  font-size: 14px; color: #C49A2A;
  display: block; margin-bottom: 3px;
}
.cv-pill-sign {
  font-size: 11px; font-weight: 700; color: #FAF8F3;
  margin-bottom: 2px;
}
.cv-pill-role {
  font-size: 6.5px; color: rgba(196,154,42,0.7);
  letter-spacing: 2px; text-transform: uppercase;
  font-weight: 700; font-family: Helvetica, Arial, sans-serif;
}

/* Core motif */
.cv-motif-rule {
  width: 120px; height: 0.5px;
  background: rgba(196,154,42,0.3);
  margin-bottom: 14px;
}
.cv-motif-label {
  font-size: 7px; color: rgba(196,154,42,0.6);
  letter-spacing: 3px; text-transform: uppercase;
  font-weight: 700; margin-bottom: 10px;
  font-family: Helvetica, Arial, sans-serif;
}
.cv-motif {
  font-size: 10.5px; font-style: italic;
  color: rgba(250,248,243,0.5);
  line-height: 1.8; max-width: 340px;
}

/* Bottom footer */
.cover-foot {
  position: absolute; bottom: 40px; left: 0; right: 0;
  text-align: center; z-index: 2;
}
.cover-foot-text {
  font-size: 7px; color: rgba(196,154,42,0.3);
  letter-spacing: 2px; font-family: Helvetica, Arial, sans-serif;
}
.cover-foot-date {
  font-size: 6.5px; color: rgba(250,248,243,0.2);
  letter-spacing: 1px; margin-top: 3px;
  font-family: Helvetica, Arial, sans-serif;
}

/* ═══════════════════════════════════════════════════════════════════
   CHART DATA TABLES
   ═══════════════════════════════════════════════════════════════════ */
.dt { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9.5px; }
.dt th {
  font-size: 7.5px; font-weight: 700; color: #9C9590;
  letter-spacing: 1.2px; text-transform: uppercase;
  padding: 8px 10px; border-bottom: 2px solid #C49A2A;
  text-align: left; font-family: Helvetica, Arial, sans-serif;
}
.tc { padding: 7px 10px; border-bottom: 1px solid #EDEBE8; font-size: 9.5px; }
.tc-name { font-weight: 600; color: #0D1527; }
.tc-center { text-align: center; }
.tc-right { text-align: right; }
.row-alt { background: #F7F4EF; }
.glyph { color: #C49A2A; font-size: 12px; }
.retro { color: #DC2626; font-weight: 700; font-size: 11px; }

/* ═══════════════════════════════════════════════════════════════════
   BIG THREE
   ═══════════════════════════════════════════════════════════════════ */
.b3-band {
  margin: 0 -45px; padding: 14px 45px;
  display: flex; align-items: center;
  page-break-inside: avoid; page-break-after: avoid;
}
.b3-band-inner { display: flex; align-items: center; gap: 14px; }
.b3-glyph { font-size: 22px; color: #C49A2A; min-width: 28px; text-align: center; }
.b3-band-text { }
.b3-title {
  font-size: 15px; font-weight: 700; color: #FAF8F3;
  margin-bottom: 2px;
}
.b3-meta {
  font-size: 9px; color: #F5E6A8;
  font-family: Helvetica, Arial, sans-serif; letter-spacing: 0.5px;
}
.b3-content { padding: 16px 0 8px; }
.b3-sublabel {
  font-size: 8px; color: #9C9590; letter-spacing: 2px;
  text-transform: uppercase; font-weight: 700;
  margin-bottom: 12px; font-family: Helvetica, Arial, sans-serif;
}

/* ─── Callout Boxes ─────────────────────────────────────────────── */
.callout {
  border-radius: 5px; padding: 12px 14px;
  margin: 10px 0 12px; display: flex; gap: 10px;
  align-items: flex-start; page-break-inside: avoid;
}
.callout-icon {
  font-size: 14px; color: #C49A2A; min-width: 18px;
  text-align: center; margin-top: 1px;
}
.callout-label {
  font-size: 7.5px; font-weight: 700; letter-spacing: 2px;
  text-transform: uppercase; margin-bottom: 4px;
  display: block; font-family: Helvetica, Arial, sans-serif;
}
.callout-text { font-size: 10px; color: #1A1614; line-height: 1.65; }
.shadow-callout {
  background: #F2EDE7; border-left: 3px solid #7A3520;
}
.shadow-label { color: #7A3520; }
.gold-callout {
  background: #FDF8ED; border-left: 3px solid #C49A2A;
}
.gold-label { color: #C49A2A; }

/* ═══════════════════════════════════════════════════════════════════
   PLANETS
   ═══════════════════════════════════════════════════════════════════ */
.planet-band {
  background: #162040; margin: 0 -45px; padding: 11px 45px;
  display: flex; align-items: center; gap: 12px;
  page-break-inside: avoid; page-break-after: avoid;
}
.planet-glyph { font-size: 16px; color: #C49A2A; min-width: 22px; text-align: center; }
.planet-band-text { flex: 1; }
.planet-title { font-size: 13px; font-weight: 700; color: #FAF8F3; margin-bottom: 1px; }
.planet-placement {
  font-size: 8.5px; color: #F5E6A8;
  font-family: Helvetica, Arial, sans-serif; letter-spacing: 0.5px;
}
.planet-body { padding: 14px 0 6px; }

/* ═══════════════════════════════════════════════════════════════════
   LIFE AREAS
   ═══════════════════════════════════════════════════════════════════ */
.area-band {
  margin: 0 -45px; padding: 13px 45px;
  display: flex; align-items: center; gap: 12px;
  page-break-inside: avoid; page-break-after: avoid;
}
.area-icon { font-size: 16px; color: rgba(255,255,255,0.85); min-width: 20px; text-align: center; }
.area-band-text { flex: 1; }
.area-title { font-size: 13px; font-weight: 700; color: #FFFFFF; margin-bottom: 2px; }
.area-theme {
  font-size: 9px; color: rgba(255,255,255,0.75);
  font-family: Helvetica, Arial, sans-serif; font-style: italic;
}
.area-content { padding: 14px 0 6px; }

/* ═══════════════════════════════════════════════════════════════════
   SOUL PATH
   ═══════════════════════════════════════════════════════════════════ */
.soul-card {
  background: #FFFFFF; border-radius: 6px;
  padding: 16px 18px; margin-bottom: 14px;
  border: 1px solid #E0DAD3;
  page-break-inside: avoid;
}
.soul-heading {
  font-size: 12px; font-weight: 700; color: #0D1527;
  margin-bottom: 10px;
}
.soul-gift {
  background: #FDF8ED; border: 1px solid #C49A2A;
  border-radius: 6px; padding: 20px 24px;
  text-align: center; margin-top: 8px;
  page-break-inside: avoid;
}
.soul-gift-label {
  font-size: 8px; color: #C49A2A; letter-spacing: 2.5px;
  text-transform: uppercase; font-weight: 700;
  margin-bottom: 8px; font-family: Helvetica, Arial, sans-serif;
}
.soul-gift-text {
  font-size: 12px; font-style: italic; color: #5C5650;
  line-height: 1.75;
}

/* ═══════════════════════════════════════════════════════════════════
   ELEMENTAL BALANCE
   ═══════════════════════════════════════════════════════════════════ */
.el-row {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px;
}
.el-icon { font-size: 14px; width: 20px; text-align: center; }
.el-label {
  font-size: 10px; width: 46px;
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
  background: #FFFFFF; border-radius: 6px;
  padding: 16px 18px; margin-top: 16px;
  border: 1px solid #E0DAD3;
}
.el-dom-label {
  font-size: 8px; color: #9C9590; letter-spacing: 2px;
  text-transform: uppercase; font-weight: 700;
  margin-bottom: 4px; font-family: Helvetica, Arial, sans-serif;
}
.el-dom-val {
  font-size: 14px; font-weight: 700; color: #0D1527;
  margin-bottom: 6px;
}

/* ═══════════════════════════════════════════════════════════════════
   CLOSING PAGE
   ═══════════════════════════════════════════════════════════════════ */
.closing {
  background: #0D1527;
  width: 100%; height: 100vh;
  padding: 0; page-break-before: always;
  display: flex; flex-direction: column;
  position: relative;
}
.closing-ph {
  background: rgba(255,255,255,0.04);
  padding: 13px 45px;
  display: flex; justify-content: space-between;
  align-items: center; font-family: Helvetica, Arial, sans-serif;
  margin-bottom: 32px; position: relative; z-index: 1;
}
.closing-content {
  padding: 0 45px; flex: 1;
  position: relative; z-index: 1;
}
.closing-body {
  font-size: 10.5px; color: #E8E4DF; line-height: 1.9;
  margin-bottom: 14px; text-align: justify;
}
.closing-ornament {
  color: #C49A2A; text-align: center; letter-spacing: 12px;
  font-size: 12px; margin: 26px 0; opacity: 0.6;
}
.closing-affirm {
  border: 1px solid rgba(196,154,42,0.6);
  border-radius: 6px; padding: 22px 30px;
  margin: 0 auto 36px; max-width: 400px;
  text-align: center;
}
.closing-affirm-text {
  font-size: 13px; font-style: italic; color: #C49A2A;
  line-height: 1.8;
}
.closing-brand-section {
  text-align: center; padding: 24px 45px 32px;
  border-top: 1px solid rgba(196,154,42,0.2);
  position: relative; z-index: 1;
}
.closing-brand-name {
  font-size: 18px; font-weight: 700; color: #C49A2A;
  letter-spacing: 4px; margin-bottom: 6px;
}
.closing-tagline {
  font-size: 10px; color: #F5E6A8;
  font-style: italic; margin-bottom: 6px;
}
.closing-url {
  font-size: 9px; color: #6B5D40;
  font-family: Helvetica, Arial, sans-serif;
  margin-bottom: 18px;
}
.closing-disclaimer {
  font-size: 7.5px; color: #4A4035;
  line-height: 1.7; text-align: center;
  font-family: Helvetica, Arial, sans-serif;
}

/* ─── Pull Quote (screenshottable) ──────────────────────────────── */
.pull-quote {
  border-top: 1px solid rgba(196,154,42,0.3);
  border-bottom: 1px solid rgba(196,154,42,0.3);
  padding: 18px 24px; margin: 20px 0;
  text-align: center; page-break-inside: avoid;
}
.pull-quote-text {
  font-size: 14px; font-style: italic;
  color: #0D1527; line-height: 1.7;
}
.pull-quote-attr {
  font-size: 8px; color: #9C9590; letter-spacing: 2px;
  text-transform: uppercase; margin-top: 8px;
  font-family: Helvetica, Arial, sans-serif;
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

    <div class="cover-zodiac-ring">✦ · ✧ · ✦ · ✧ · ✦ · ✧ · ✦ · ✧ · ✦ · ✧ · ✦ · ✧</div>

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
    <div class="cover-foot-text">Generated by Celestia</div>
    <div class="cover-foot-date">${escapeHTML(genDate)}</div>
  </div>
</div>

<!-- ═══════════════ OVERVIEW ═══════════════ -->
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · OVERVIEW</span></div>
<div class="pc">
  <div class="sl">Your Profile</div><div class="sr"></div>
  ${nl2p(report.overview)}
  ${report.coreMotif ? `
  <div class="pull-quote">
    <div class="pull-quote-text">"${escapeHTML(report.coreMotif)}"</div>
    <div class="pull-quote-attr">— ${escapeHTML(firstName)}'s Core Motif</div>
  </div>` : ''}
</div>
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)}</div>

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
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)}</div>

<!-- ═══════════════ BIG THREE ═══════════════ -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · THE BIG THREE</span></div>
<div class="pc">
  <div class="sl">Sun · Moon · Rising</div><div class="sr"></div>
  ${big3HTML}
</div>
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)}</div>

<!-- ═══════════════ PLANETS ═══════════════ -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · PLANETARY PLACEMENTS</span></div>
<div class="pc">
  <div class="sl">Mercury through Pluto</div><div class="sr"></div>
  ${planetsHTML}
</div>
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)}</div>

<!-- ═══════════════ LIFE AREAS ═══════════════ -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · LIFE AREAS</span></div>
<div class="pc">
  <div class="sl">Where Your Chart Shows Up in Life</div><div class="sr"></div>
  ${areasHTML}
</div>
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)}</div>

<!-- ═══════════════ SOUL PATH ═══════════════ -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · SOUL PATH</span></div>
<div class="pc">
  <div class="sl">Your Evolutionary Journey</div><div class="sr"></div>
  ${soulPathHTML}
</div>
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)}</div>

<!-- ═══════════════ ELEMENTAL BALANCE ═══════════════ -->
<div class="page-break"></div>
<div class="ph"><span class="ph-left">CELESTIA</span><span class="ph-right">${escapeHTML(name.toUpperCase())} · ELEMENTAL BALANCE</span></div>
<div class="pc">
  <div class="sl">Your Elemental Temperament</div><div class="sr"></div>
  <div style="padding:8px 0 4px">
    ${elBar('fire', elements.fire || 0)}
    ${elBar('earth', elements.earth || 0)}
    ${elBar('air', elements.air || 0)}
    ${elBar('water', elements.water || 0)}
  </div>
  <div class="el-summary">
    <div style="display:flex;gap:24px;margin-bottom:12px">
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
<div class="pf">Celestia · ${escapeHTML(reportLabel)} Report · ${escapeHTML(firstName)}</div>

<!-- ═══════════════ CLOSING ═══════════════ -->
<div class="closing">
  <div class="closing-ph">
    <span class="ph-left">CELESTIA</span>
    <span class="ph-right">${escapeHTML(name.toUpperCase())} · YOUR JOURNEY</span>
  </div>
  <div class="closing-content">
    <div class="sl" style="color:#C49A2A">Your Journey</div>
    <div class="sr" style="border-color:#C49A2A;opacity:0.25;margin-bottom:22px"></div>
    ${(report.closing || '').split(/\n\n+/).filter(Boolean).map(p => `<p class="closing-body">${escapeHTML(p)}</p>`).join('')}
    <div class="closing-ornament">✦   ✦   ✦</div>
    <div class="closing-affirm">
      <div class="closing-affirm-text">"${escapeHTML(report.coreMotif || '')}"</div>
    </div>
  </div>
  <div class="closing-brand-section">
    <div class="closing-brand-name">CELESTIA</div>
    <div class="closing-tagline">Your relationship pattern guide</div>
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

  useEffect(() => {
    getNarrativeContext(userProfile?.id || 'default', userProfile?.chart)
      .then(ctx => setNarrativeCtx(ctx))
      .catch(() => { });
  }, [userProfile?.id]);

  const getReportDescription = (type) => {
    const defaults = {
      love: 'How you connect — attachment, intimacy, conflict patterns',
      career: 'Your working style — what energizes you vs what drains',
      lunar: 'How lunar rhythms shape your weeks',
      purpose: 'Patterns and themes worth paying attention to',
      solar_return: `Your ${CURRENT_YEAR} year — month-by-month outlook`,
      monthly: 'This month in detail',
      yearly: `Your ${CURRENT_YEAR} roadmap — profections, transits & quarterly outlook`,
      transit: 'Current planetary weather hitting your natal chart right now',
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

    // V1: paywall gating removed — all reports accessible.

    setReportTitle(r.name);
    setReportType(r.type);
    setReportData(null);
    setReportModal(true);
    setReportLoading(true);
    try {
      const data = await generateFullReport(userProfile, r.type, narrativeCtx);
      setReportData(data);
      haptic.success();
      capture(EVENTS.REPORT_GENERATED, { report_type: r.type });
      const profileId = userProfile?.id || 'default';
      trackEvent('report_generated').catch(() => { });
      awardXP(profileId, 'report_read').catch(() => { });
    } catch (e) {
      console.error('Report generation error:', e);
      Alert.alert('Error', 'Failed to generate report. Please try again.');
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

    // V1: paywall gating removed — all PDFs downloadable.
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
            Deep readings on relationships, patterns, and your year ahead.
          </Text>
        </View>

        {/* Featured — Monthly Forecast (auto-updates each month) */}
        <TouchableOpacity style={[styles.featuredWrap, { shadowColor: isDark ? 'transparent' : '#000' }]} activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`Read your ${MONTH_NAME} pattern`}
          onPress={handleMonthlyReport}>
          <LinearGradient colors={['#5A2840', '#3A1A28', '#1F0F18']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featuredImg}>
            <Text style={{ fontSize: 56, color: '#B388FF' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✦</Text>
            <View style={styles.featuredBadge}><Text style={styles.featuredBadgeText}>{MONTH_NAME.toUpperCase()}</Text></View>
          </LinearGradient>
          <View style={[styles.featuredBody, { backgroundColor: colors.card }]}>
            <Text style={[styles.featuredTitle, { color: colors.heading }]}>Pattern of the Month</Text>
            <Text style={[styles.featuredDesc, { color: colors.textSecondary }]}>
              What's shifting in your relationships and rhythms this {MONTH_NAME.toLowerCase()} — week by week.
            </Text>
            <View style={styles.featuredFoot}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={[styles.featuredPrice, { color: colors.heading }]}>Free</Text>
                <Text style={[styles.featuredWas, { color: colors.textMuted }]}>$12</Text>
              </View>
              <TouchableOpacity activeOpacity={0.85}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel={`Read your ${MONTH_NAME}`}
                onPress={handleMonthlyReport}>
                <LinearGradient colors={['#C9A0FF', '#B388FF', '#9060E0']} style={styles.featuredCta}>
                  <Text style={[styles.featuredCtaText, { color: '#fff' }]}>Read Your {MONTH_NAME}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {/* Section heading */}
        <Text accessibilityRole="header" style={[styles.gridHeading, { color: colors.textSecondary }]}>
          RELATIONSHIP & PATTERN READINGS
        </Text>

        {/* Report Grid */}
        <View style={styles.grid}>
          {REPORTS.map((r, i) => (
            <TouchableOpacity key={i} style={[styles.rtile, { backgroundColor: colors.card, borderColor: colors.border, shadowColor: isDark ? 'transparent' : '#000' }]} activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${r.name}. ${getReportDescription(r.type)}`}
              onPress={() => handleReport(r)}>
              <LinearGradient colors={r.bg} style={styles.rtileColor} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Text style={{ fontSize: 32, color: r.accent }}>{r.icon}</Text>
              </LinearGradient>
              <View style={styles.rtileBody}>
                <Text style={[styles.rtileName, { color: colors.heading }]}>{r.name}</Text>
                <Text style={[styles.rtileDesc, { color: colors.textSecondary }]}>{getReportDescription(r.type)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Report Display Modal */}
      <Modal visible={reportModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.modalBg }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.divider }]}>
            <Text style={[styles.modalTitle, { color: colors.heading }]} numberOfLines={1}>{reportData?.title || reportTitle}</Text>
            <TouchableOpacity onPress={() => setReportModal(false)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close report">
              <Text style={[styles.modalClose, { color: colors.textSecondary }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✕</Text>
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
                <LinearGradient colors={['#3A1A28', '#5A2840']} style={styles.summaryCard}>
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
                    {section.remedy && (
                      <View style={[styles.remedyBox, { backgroundColor: isDark ? 'rgba(200,168,75,0.06)' : 'rgba(200,168,75,0.08)' }]}>
                        <Text style={styles.remedyLabel}>REMEDY</Text>
                        <Text style={[styles.remedyText, { color: colors.text }]}>{section.remedy}</Text>
                      </View>
                    )}
                    {section.affirmation && (
                      <View style={[styles.affirmBox, { backgroundColor: colors.cardAlt }]}>
                        <Text style={[styles.affirmText, { color: colors.heading }]}>"{section.affirmation}"</Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* Key Insight */}
                {reportData.keyInsight && (
                  <LinearGradient colors={['#5A2840', '#3A1A28']} style={styles.insightCard}>
                    <Text style={styles.insightLabel}>KEY INSIGHT</Text>
                    <Text style={styles.insightText}>{reportData.keyInsight}</Text>
                  </LinearGradient>
                )}

                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Bottom action bar */}
              <View style={[styles.actionBar, { backgroundColor: colors.modalBg, borderTopColor: colors.divider }]}>
                <TouchableOpacity style={[styles.actionBtnOutline, { borderColor: colors.border }]} activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="Share report"
                  onPress={handleShareText}>
                  <Text style={[styles.actionBtnOutlineText, { color: colors.textSecondary }]}>Share ↗</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtnFill} activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Download report as PDF"
                  accessibilityState={{ disabled: !!pdfLoading, busy: !!pdfLoading }}
                  onPress={handleDownloadPdf} disabled={pdfLoading}>
                  <LinearGradient colors={[T.navy, '#5A2840']} style={styles.actionBtnGrad}>
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
  h1: { fontFamily: FONTS.serif, fontSize: 32, marginBottom: 5 },
  sub: { fontSize: 13, lineHeight: 20, marginBottom: 18 },
  featuredWrap: { marginHorizontal: 20, borderRadius: 21, overflow: 'hidden', marginBottom: 18, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 40 },
  featuredImg: { height: 148, alignItems: 'center', justifyContent: 'center' },
  featuredBadge: { position: 'absolute', top: 14, left: 14, backgroundColor: T.gold, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 12 },
  featuredBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: T.navy },
  featuredBody: { padding: 17, paddingHorizontal: 19, paddingBottom: 19 },
  featuredTitle: { fontFamily: FONTS.serif, fontSize: 22, marginBottom: 4 },
  featuredDesc: { fontSize: 12, lineHeight: 18, marginBottom: 13 },
  featuredFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featuredPrice: { fontFamily: FONTS.serif, fontSize: 28 },
  featuredWas: { fontSize: 12, textDecorationLine: 'line-through', marginLeft: 6 },
  // HIG: 44pt minimum touch target. paddingVertical 14 + 13pt text → ≥44pt visual.
  featuredCta: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 22, shadowColor: T.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  featuredCtaText: { fontFamily: FONTS.sansMedium, fontSize: 13 },
  gridHeading: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, marginTop: 4, marginBottom: 12, paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, marginBottom: 18 },
  rtile: { width: '48%', borderRadius: 17, overflow: 'hidden', borderWidth: 1, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
  rtileColor: { height: 74, alignItems: 'center', justifyContent: 'center' },
  rtileBody: { padding: 11, paddingHorizontal: 13, paddingBottom: 13 },
  rtileName: { fontFamily: FONTS.serif, fontSize: 16, marginBottom: 2 },
  rtileDesc: { fontSize: 10, lineHeight: 14, marginBottom: 9 },
  rtilePrice: { fontFamily: FONTS.serif, fontSize: 19 },
  tileLock: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  // Modal
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 20, borderBottomWidth: 1 },
  modalTitle: { fontFamily: FONTS.serif, fontSize: 20, flex: 1, marginRight: 12 },
  modalClose: { fontSize: 18, padding: 4 },
  modalBody: { flex: 1, padding: 20 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  loadingText: { fontFamily: FONTS.serif, fontSize: 20, marginTop: 20 },
  loadingSubtext: { fontSize: 13, marginTop: 6 },
  summaryCard: { borderRadius: 18, padding: 20, marginBottom: 16 },
  summaryText: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 15, color: '#FAF8F2', lineHeight: 24, fontStyle: 'italic' },
  sectionCard: { borderRadius: 18, padding: 18, marginBottom: 12, borderWidth: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  sectionNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  sectionNumText: { fontFamily: FONTS.serif, fontSize: 14, color: T.gold },
  sectionHeading: { fontFamily: FONTS.serif, fontSize: 18, flex: 1 },
  sectionBody: { fontSize: 13.5, lineHeight: 22, marginBottom: 12 },
  remedyBox: { borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 2, borderLeftColor: T.gold },
  remedyLabel: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 4 },
  remedyText: { fontSize: 13, lineHeight: 20 },
  affirmBox: { borderRadius: 12, padding: 12, alignItems: 'center' },
  affirmText: { fontFamily: FONTS.serifItalic || FONTS.serif, fontSize: 14, fontStyle: 'italic', textAlign: 'center' },
  insightCard: { borderRadius: 18, padding: 20, marginBottom: 16, alignItems: 'center' },
  insightLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: 'rgba(200,168,75,0.6)', marginBottom: 8 },
  insightText: { fontFamily: FONTS.serif, fontSize: 17, color: '#FAF8F2', textAlign: 'center', lineHeight: 24 },
  // Bottom action bar
  actionBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30, borderTopWidth: 1 },
  actionBtnOutline: { flex: 1, height: 48, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionBtnOutlineText: { fontSize: 14, fontFamily: FONTS.sansMedium },
  actionBtnFill: { flex: 1.5, borderRadius: 14, overflow: 'hidden' },
  actionBtnGrad: { height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  actionBtnFillText: { fontSize: 14, fontFamily: FONTS.sansMedium, color: '#FAF8F2' },
  // Toast
  toast: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: '#0D1527', borderRadius: 14, padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, zIndex: 999 },
  toastIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(80,200,120,0.15)', alignItems: 'center', justifyContent: 'center' },
  toastTitle: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: '#FAF8F3', marginBottom: 2 },
  toastFile: { fontSize: 11, color: 'rgba(250,248,242,0.5)' },
});
