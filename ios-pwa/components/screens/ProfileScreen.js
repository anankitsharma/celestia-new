'use client';
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useUserProfile } from '@/lib/UserProfileContext';
import { loadObject, saveObject, StorageKeys } from '@/lib/storage';
import { invalidatePersonaCache } from '@/lib/geminiService';
import { useTheme } from '@/lib/ThemeContext';
import { getStreakData, getXPStatus, getUnlockedBadges, getBadgeCatalog, getLevelInfo, getStreakEmoji } from '@/lib/engagementService';
import { T } from '@/lib/constants';

const ZODIAC_SYMBOLS = {
  Aries: '\u2648', Taurus: '\u2649', Gemini: '\u264a', Cancer: '\u264b', Leo: '\u264c', Virgo: '\u264d',
  Libra: '\u264e', Scorpio: '\u264f', Sagittarius: '\u2650', Capricorn: '\u2651', Aquarius: '\u2652', Pisces: '\u2653'
};

const SIGN_RULERS = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon', Leo: 'Sun',
  Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Pluto', Sagittarius: 'Jupiter',
  Capricorn: 'Saturn', Aquarius: 'Uranus', Pisces: 'Neptune'
};

const VOICE_OPTIONS = ['Poetic', 'Psychological', 'Direct', 'Spiritual'];
const DEPTH_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

export default function ProfileScreen({ onNavigate }) {
  const { profile, chart, setProfile } = useUserProfile();
  const { mode, setMode, isDark } = useTheme();
  const [settings, setSettings] = useState({ voice: 'Poetic', depth: 'Intermediate' });
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [showDepthPicker, setShowDepthPicker] = useState(false);
  const [streak, setStreak] = useState(null);
  const [xpStatus, setXpStatus] = useState(null);
  const [unlockedBadges, setUnlockedBadges] = useState([]);

  useEffect(() => {
    loadSettings();
    getStreakData().then(s => setStreak(s)).catch(() => {});
    getXPStatus().then(x => setXpStatus(x)).catch(() => {});
    getUnlockedBadges().then(b => setUnlockedBadges(b)).catch(() => {});
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await loadObject(StorageKeys.SETTINGS);
      if (saved) setSettings(prev => ({ ...prev, ...saved }));
    } catch (e) { console.error('Settings load error:', e); }
  };

  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveObject(StorageKeys.SETTINGS, updated);
    invalidatePersonaCache();
  };

  const name = profile?.name || 'Stargazer';
  const firstName = name.split(' ')[0];

  const sun = chart?.planets?.find(p => p.name === 'Sun');
  const moon = chart?.planets?.find(p => p.name === 'Moon');
  const rising = chart?.planets?.find(p => p.name === 'Ascendant');

  const signGlyph = sun?.sign ? (ZODIAC_SYMBOLS[sun.sign] || '\u2653') : '\u2726';

  const astroChips = useMemo(() => {
    if (!chart) return [];
    const chips = [];
    if (chart.elements) {
      const el = Object.entries(chart.elements).sort(([, a], [, b]) => b - a)[0];
      if (el) chips.push(`${el[0].charAt(0).toUpperCase() + el[0].slice(1)} Dominant`);
    }
    if (chart.modalities) {
      const mod = Object.entries(chart.modalities).sort(([, a], [, b]) => b - a)[0];
      if (mod) chips.push(mod[0].charAt(0).toUpperCase() + mod[0].slice(1));
    }
    if (rising?.sign) {
      const ruler = SIGN_RULERS[rising.sign];
      if (ruler) chips.push(`${ruler} Ruled`);
    }
    return chips;
  }, [chart]);

  const astroMain = [
    sun && `${sun.sign} Sun`,
    moon && `${moon.sign} Moon`,
    rising && `${rising.sign} Rising`
  ].filter(Boolean).join(' \u00b7 ');

  const signBadges = [
    sun && `${ZODIAC_SYMBOLS[sun.sign] || '\u2609'} ${sun.sign}`,
    moon && `\u263d ${moon.sign}`,
    rising && `\u2191 ${rising.sign}`
  ].filter(Boolean);

  const birthInfo = profile ? [
    profile.birthDate && new Date(profile.birthDate + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    profile.birthTime && !profile.isTimeUnknown ? profile.birthTime : null,
    profile.location?.name || profile.birthLocation?.name
  ].filter(Boolean).join(' \u00b7 ') : '';

  const handleSignOut = () => {
    if (window.confirm('This will clear your birth data. Are you sure?')) {
      setProfile(null);
      if (onNavigate) onNavigate('onboarding');
    }
  };

  const handleHelp = () => {
    window.alert('Celestia uses NASA-backed astronomy-engine for precise calculations and Google Gemini AI for personalized readings.\n\nYour birth chart data is stored locally in your browser.');
  };

  const handlePrivacy = () => {
    window.alert('Birth chart calculations are done locally in your browser. AI readings use encrypted connections.\n\nNo personal data is sold or shared with third parties.');
  };

  const handleShareCosmicID = async () => {
    try {
      await navigator.share({
        text: `My Celestial Identity\n\n${astroMain}\n${astroChips.join(' \u00b7 ')}\n\n-- Generated with Celestia`,
      });
    } catch (e) { }
  };

  const SETTINGS_LIST = [
    { icon: '\u2728', bg: 'rgba(200,168,75,0.08)', label: 'Reading Voice', val: settings.voice, onPress: () => setShowVoicePicker(true) },
    { icon: '\ud83d\udcca', bg: 'rgba(80,144,232,0.08)', label: 'Depth Level', val: settings.depth, onPress: () => setShowDepthPicker(true) },
    { icon: isDark ? '\ud83c\udf19' : '\u2600\ufe0f', bg: 'rgba(160,128,224,0.08)', label: 'Appearance', val: isDark ? 'Dark' : 'Light', onPress: () => setMode(isDark ? 'light' : 'dark') },
    { icon: '\ud83c\udf10', bg: 'rgba(80,200,120,0.08)', label: 'Time Zone', val: 'Auto', onPress: () => window.alert('Timezone is automatically detected from your browser settings.') },
  ];

  const SETTINGS2_LIST = [
    { icon: '\ud83d\udd12', bg: 'rgba(232,80,80,0.08)', label: 'Privacy', onPress: handlePrivacy },
    { icon: '\u2753', bg: 'rgba(200,168,75,0.08)', label: 'Help & Support', onPress: handleHelp },
  ];

  return (
    <div style={{ flex: 1, backgroundColor: 'var(--c-bg)', minHeight: '100vh' }}>
      <div className="scroll-container" style={{ paddingBottom: 110 }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #0E0E22, #2A1A6E, #0C2040)', paddingTop: 64, paddingLeft: 22, paddingRight: 22, paddingBottom: 25, position: 'relative', overflow: 'hidden' }}>
          {/* Background glyph */}
          <div style={{ position: 'absolute', right: 8, bottom: -22, opacity: 0.04 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 128, color: T.gold }}>{signGlyph}</span>
          </div>

          {/* Avatar */}
          <div style={{ width: 72, height: 72, borderRadius: 36, background: 'linear-gradient(135deg, #E2C46A, #8C6C18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 13, border: '3px solid rgba(255,255,255,0.14)', boxShadow: '0 4px 18px rgba(0,0,0,0.3)' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 30, color: 'white' }}>{firstName[0]?.toUpperCase() || '\u2726'}</span>
          </div>

          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, color: 'white', marginBottom: 4 }}>{name}</h1>
          {birthInfo && <p style={{ fontSize: 11, color: 'var(--c-text-muted)', marginBottom: 9 }}>{birthInfo}</p>}

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {signBadges.map((s, i) => (
              <div key={i} style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 100, padding: '4px 11px' }}>
                <span style={{ fontSize: 11, color: 'rgba(250,248,242,0.58)' }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '18px 19px' }}>
          {/* Engagement Stats */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            {/* Streak */}
            <div style={{ flex: 1, backgroundColor: 'var(--c-card-bg-alpha)', border: '1px solid var(--c-card-border-alpha)', borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: 24 }}>{streak ? getStreakEmoji(streak.current_streak) : '\ud83c\udf19'}</span>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', margin: '4px 0 2px' }}>{streak?.current_streak || 0}</p>
              <p style={{ fontSize: 10, color: 'var(--c-text-secondary)', letterSpacing: 0.5 }}>Day Streak</p>
            </div>
            {/* Level */}
            <div style={{ flex: 1, backgroundColor: 'var(--c-card-bg-alpha)', border: '1px solid var(--c-card-border-alpha)', borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: 24 }}>{'\u2728'}</span>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', margin: '4px 0 2px' }}>{xpStatus?.levelInfo?.current?.level || 1}</p>
              <p style={{ fontSize: 10, color: 'var(--c-text-secondary)', letterSpacing: 0.5 }}>{xpStatus?.levelInfo?.current?.name || 'Starling'}</p>
            </div>
            {/* XP */}
            <div style={{ flex: 1, backgroundColor: 'var(--c-card-bg-alpha)', border: '1px solid var(--c-card-border-alpha)', borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
              <span style={{ fontSize: 24 }}>{'\ud83d\udcab'}</span>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', margin: '4px 0 2px' }}>{xpStatus?.total_xp || 0}</p>
              <p style={{ fontSize: 10, color: 'var(--c-text-secondary)', letterSpacing: 0.5 }}>Total XP</p>
            </div>
          </div>

          {/* XP Progress Bar */}
          {xpStatus?.levelInfo && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--c-text-secondary)' }}>Level {xpStatus.levelInfo.current.level} {'\u2022'} {xpStatus.levelInfo.current.name}</span>
                {xpStatus.levelInfo.next && <span style={{ fontSize: 10, color: 'var(--c-text-muted)' }}>Next: {xpStatus.levelInfo.next.name} ({xpStatus.levelInfo.next.threshold} XP)</span>}
              </div>
              <div style={{ height: 6, backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(xpStatus.levelInfo.progress * 100).toFixed(0)}%`, backgroundColor: T.gold, borderRadius: 3, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )}

          {/* Badges */}
          {unlockedBadges.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 9, textTransform: 'uppercase' }}>BADGES</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {getBadgeCatalog().filter(b => unlockedBadges.includes(b.id)).map(b => (
                  <div key={b.id} style={{ backgroundColor: 'var(--c-card-bg-alpha)', border: '1px solid var(--c-card-border-alpha)', borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{b.icon}</span>
                    <span style={{ fontSize: 11, color: 'var(--c-heading)' }}>{b.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share Cosmic ID */}
          <button onClick={handleShareCosmicID}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', backgroundColor: 'var(--c-card-bg-alpha)', border: '1px solid var(--c-card-border-alpha)', borderRadius: 16, padding: '12px 14px', marginBottom: 14, cursor: 'pointer' }}>
            <span style={{ fontSize: 14 }}>{'\ud83d\udcf8'}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-heading)' }}>Share My Cosmic ID</span>
            <span style={{ fontSize: 12, color: 'var(--c-text-secondary)' }}>{'\u2197'}</span>
          </button>

          {/* Settings */}
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 9, textTransform: 'uppercase' }}>PREFERENCES</p>
          <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 17, border: '1px solid var(--c-card-border-alpha)', overflow: 'hidden', marginBottom: 18 }}>
            {SETTINGS_LIST.map((s, i) => (
              <button key={i} onClick={s.onPress}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '14px 16px', borderBottom: i < SETTINGS_LIST.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 11 }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                </div>
                <span style={{ fontSize: 14, color: 'var(--c-heading)', flex: 1, textAlign: 'left' }}>{s.label}</span>
                {s.val && <span style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>{s.val}</span>}
                <span style={{ fontSize: 16, color: 'rgba(208,200,180,0.4)', marginLeft: 5 }}>{'\u203a'}</span>
              </button>
            ))}
          </div>

          {/* Subscription */}
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 9, textTransform: 'uppercase' }}>SUBSCRIPTION</p>
          <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 17, border: '1px solid var(--c-card-border-alpha)', overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(200,168,75,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 11 }}>
                <span style={{ fontSize: 16 }}>{'\ud83d\udd12'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, color: 'var(--c-heading)' }}>Free Plan</span>
                <p style={{ fontSize: 11, color: 'var(--c-text-secondary)', marginTop: 1 }}>Go deeper with Pro</p>
              </div>
              <span style={{ fontSize: 16, color: 'rgba(208,200,180,0.4)' }}>{'\u203a'}</span>
            </div>
          </div>

          {/* General */}
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: 'var(--c-text-secondary)', marginBottom: 9, textTransform: 'uppercase' }}>GENERAL</p>
          <div style={{ backgroundColor: 'var(--c-card-bg-alpha)', borderRadius: 17, border: '1px solid var(--c-card-border-alpha)', overflow: 'hidden', marginBottom: 18 }}>
            {SETTINGS2_LIST.map((s, i) => (
              <button key={i} onClick={s.onPress}
                style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '14px 16px', borderBottom: i < SETTINGS2_LIST.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 11 }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                </div>
                <span style={{ fontSize: 14, color: 'var(--c-heading)', flex: 1, textAlign: 'left' }}>{s.label}</span>
                <span style={{ fontSize: 16, color: 'rgba(208,200,180,0.4)', marginLeft: 5 }}>{'\u203a'}</span>
              </button>
            ))}
          </div>

          {/* Reset Profile */}
          <button onClick={handleSignOut} style={{ display: 'block', margin: '0 auto', padding: 16, background: 'none', border: 'none', cursor: 'pointer' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#D44' }}>Reset Profile</span>
          </button>

          <div style={{ height: 30 }} />
        </div>
      </div>

      {/* Voice Picker Modal */}
      {showVoicePicker && (
        <div onClick={() => setShowVoicePicker(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 40 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--c-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 320 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', marginBottom: 4 }}>Reading Voice</h3>
            <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', marginBottom: 16 }}>Choose how Celestia speaks to you</p>
            {VOICE_OPTIONS.map((v, i) => (
              <button key={i} onClick={() => { updateSetting('voice', v); setShowVoicePicker(false); }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '14px 0', borderBottom: '1px solid var(--c-divider)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: 16, color: settings.voice === v ? T.cream : T.stone, fontWeight: settings.voice === v ? 600 : 400 }}>{v}</span>
                {settings.voice === v && <span style={{ color: T.gold }}>{'\u2713'}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Depth Picker Modal */}
      {showDepthPicker && (
        <div onClick={() => setShowDepthPicker(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 40 }}>
          <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--c-bg)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 320 }}>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--c-heading)', marginBottom: 4 }}>Depth Level</h3>
            <p style={{ fontSize: 13, color: 'var(--c-text-secondary)', marginBottom: 16 }}>Adjust the complexity of your readings</p>
            {DEPTH_OPTIONS.map((d, i) => (
              <button key={i} onClick={() => { updateSetting('depth', d); setShowDepthPicker(false); }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '14px 0', borderBottom: '1px solid var(--c-divider)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <span style={{ fontSize: 16, color: settings.depth === d ? T.cream : T.stone, fontWeight: settings.depth === d ? 600 : 400 }}>{d}</span>
                {settings.depth === d && <span style={{ color: T.gold }}>{'\u2713'}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
