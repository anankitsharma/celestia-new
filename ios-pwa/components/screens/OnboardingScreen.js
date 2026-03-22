'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUserProfile } from '@/lib/UserProfileContext';
import { calculateChart, getTransitPlanets, getMoonDataForDate } from '@/lib/astrologyService';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const TOTAL_STEPS = 14;

// ── Sign Insights (screen 9 & 10) ──────────────────────────
const SUN_TAGLINES = {
  Aries: 'A fire that never asks permission to burn.',
  Taurus: 'You love deeply — and hold on with everything you have.',
  Gemini: 'Your mind never stops. Neither does your restlessness.',
  Cancer: 'You feel everything. And you remember all of it.',
  Leo: 'You were born to be seen — and terrified of being truly known.',
  Virgo: 'You notice what no one else does. Including your own cracks.',
  Libra: 'You keep the peace — even when it costs you yours.',
  Scorpio: "You've already survived what would break most people.",
  Sagittarius: "Freedom isn't a want for you. It's oxygen.",
  Capricorn: 'You carry more than anyone knows. And you never complain.',
  Aquarius: 'You think different — and feel deeper than you let on.',
  Pisces: "You absorb the world's pain and call it your own.",
};

const MOON_TAGLINES = {
  Aries: 'Your emotional need: to feel alive.',
  Taurus: 'Your emotional need: safety and sensory peace.',
  Gemini: 'Your emotional need: to be heard and stimulated.',
  Cancer: 'Your emotional need: to nurture and be nurtured.',
  Leo: 'Your emotional need: to be adored for who you really are.',
  Virgo: 'Your emotional need: to feel useful and in control.',
  Libra: 'Your emotional need: harmony — even at your own expense.',
  Scorpio: 'Your emotional need: intensity and total honesty.',
  Sagittarius: 'Your emotional need: expansion and meaning.',
  Capricorn: 'Your emotional need: respect and quiet stability.',
  Aquarius: 'Your emotional need: freedom to be exactly yourself.',
  Pisces: 'Your emotional need: to dissolve the boundary between you and everything.',
};

const RISING_TAGLINES = {
  Aries: 'The world sees: someone fearless.',
  Taurus: 'The world sees: someone grounded and magnetic.',
  Gemini: 'The world sees: someone quick, charming, hard to pin down.',
  Cancer: 'The world sees: someone warm — and guarded.',
  Leo: 'The world sees: someone radiant who commands the room.',
  Virgo: 'The world sees: someone composed and impossibly put-together.',
  Libra: 'The world sees: grace. Diplomacy. Beauty.',
  Scorpio: "The world sees: someone intense they can't quite read.",
  Sagittarius: 'The world sees: someone adventurous and uncontainable.',
  Capricorn: 'The world sees: ambition wearing a poker face.',
  Aquarius: "The world sees: someone who doesn't quite fit — on purpose.",
  Pisces: 'The world sees: someone dreamy and slightly otherworldly.',
};

const ELEMENT_LABELS = { fire: '🔥 Fire', earth: '🌿 Earth', air: '💨 Air', water: '🌊 Water' };

// ── Small Components ──────────────────────────────────────

const ProgressBar = ({ step }) => (
  <div style={{ flex: 1 }}>
    <div style={{
      height: 4, borderRadius: 2, backgroundColor: '#F3EDE2', overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', backgroundColor: '#C8A84B', borderRadius: 2,
        width: `${(step / TOTAL_STEPS) * 100}%`,
        transition: 'width 0.3s ease',
      }} />
    </div>
  </div>
);

const OptionCard = ({ text, sub, selected, onPress, icon }) => (
  <button
    onClick={onPress}
    style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      border: selected ? '1.5px solid #C8A84B' : '1px solid #EAE3D6',
      borderRadius: 16,
      padding: 16,
      paddingLeft: 18,
      paddingRight: 18,
      gap: 14,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      cursor: 'pointer',
      width: '100%',
      textAlign: 'left',
    }}
  >
    {icon && <span style={{ fontSize: 22, width: 32, textAlign: 'center' }}>{icon}</span>}
    <div style={{ flex: 1 }}>
      <span
        className="font-sans"
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: selected ? '#0E0E22' : '#2A2418',
          lineHeight: '21px',
          display: 'block',
        }}
      >
        {text}
      </span>
      {sub && (
        <span
          className="font-sans"
          style={{
            fontSize: 12,
            color: selected ? '#2A2418' : '#97907F',
            marginTop: 2,
            lineHeight: '17px',
            display: 'block',
          }}
        >
          {sub}
        </span>
      )}
    </div>
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        border: selected ? '1.5px solid #C8A84B' : '1.5px solid #EAE3D6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        flexShrink: 0,
      }}
    >
      {selected && (
        <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#C8A84B' }} />
      )}
    </div>
  </button>
);

const GoldButton = ({ text, onPress, disabled, loading, sub }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
    <button
      onClick={onPress}
      disabled={disabled || loading}
      style={{
        width: '100%',
        height: 56,
        borderRadius: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 4,
        marginRight: 4,
        background: disabled
          ? 'linear-gradient(135deg, #D0C4A8 0%, #B8AC90 100%)'
          : 'linear-gradient(135deg, #E2C46A 0%, #C8A84B 50%, #A07820 100%)',
        opacity: disabled ? 0.6 : 1,
        boxShadow: disabled ? 'none' : '0 4px 16px rgba(200,168,75,0.25)',
        border: 'none',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {loading ? (
        <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid #0E0E22', borderTopColor: 'transparent', borderRadius: '50%' }} />
      ) : (
        <span
          className="font-sans"
          style={{ fontWeight: 600, fontSize: 16, color: '#0E0E22', letterSpacing: 0.3 }}
        >
          {text}
        </span>
      )}
    </button>
    {sub && (
      <span className="font-sans" style={{ fontSize: 12, color: '#97907F', textAlign: 'center' }}>
        {sub}
      </span>
    )}
  </div>
);

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
export default function OnboardingScreen({ onComplete }) {
  const { setProfile } = useUserProfile();
  const [step, setStep] = useState(1);
  const [slideDir, setSlideDir] = useState(0); // -1 back, 0 none, 1 forward

  // Emotional selections
  const [motivation, setMotivation] = useState(null);
  const [painPoint, setPainPoint] = useState(null);
  const [depth, setDepth] = useState(null);

  // Birth data
  const [firstName, setFirstName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [citySearching, setCitySearching] = useState(false);

  // Chart data
  const [chart, setChart] = useState(null);
  const [calcPhase, setCalcPhase] = useState(0);
  const [todayTransits, setTodayTransits] = useState([]);
  const [moonData, setMoonData] = useState(null);

  // Paywall
  const [selectedPlan, setSelectedPlan] = useState('annual');

  // ── Transition animation ─────────────────────────
  const advance = useCallback((nextStep) => {
    const target = nextStep || step + 1;
    setSlideDir(target > step ? 1 : -1);
    setTimeout(() => {
      setStep(target);
      setSlideDir(0);
    }, 150);
  }, [step]);

  const selectAndAdvance = useCallback((setter, value) => {
    setter(value);
    setTimeout(() => advance(), 500);
  }, [advance]);

  // ── City search debounce ─────────────────────────
  useEffect(() => {
    if (selectedCity || citySearch.length < 2) { setCitySuggestions([]); return; }
    const timer = setTimeout(async () => {
      setCitySearching(true);
      try {
        const res = await fetch(
          `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(citySearch)}&limit=5&addressdetails=1`,
          { headers: { 'User-Agent': 'CelestiaPWA/1.0' } }
        );
        const data = await res.json();
        setCitySuggestions(data.map(item => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        })));
      } catch (e) { console.warn('City search error:', e); }
      finally { setCitySearching(false); }
    }, 600);
    return () => clearTimeout(timer);
  }, [citySearch, selectedCity]);

  // ── Chart calculation (step 8) ───────────────────
  useEffect(() => {
    if (step !== 8) return;
    const phases = ['Locating your planets...', 'Calculating house cusps...', 'Mapping natal aspects...', 'Reading your cosmic patterns...'];
    let i = 0;
    setCalcPhase(0);
    const interval = setInterval(() => {
      i++;
      if (i < phases.length) setCalcPhase(i);
    }, 900);

    // Calculate chart
    const run = async () => {
      try {
        const dateObj = new Date(birthDate + 'T12:00:00');
        const dateStr = birthDate; // Already in YYYY-MM-DD format from input[type=date]
        const timeStr = (isTimeUnknown || !birthTime) ? '12:00' : birthTime;
        const loc = { name: selectedCity.name, lat: selectedCity.lat, lng: selectedCity.lng };
        const c = calculateChart(dateStr, timeStr, loc, isTimeUnknown, 'Placidus');
        setChart(c);
        const transits = getTransitPlanets();
        setTodayTransits(transits);
        const moon = getMoonDataForDate(new Date());
        setMoonData(moon);
      } catch (e) { console.error('Chart calc error:', e); }
    };
    run();

    // Auto-advance after dramatic pause
    const timeout = setTimeout(() => {
      clearInterval(interval);
      advance(9);
    }, 4200);

    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [step]);

  // ── Save & finish ────────────────────────────────
  const finishOnboarding = async () => {
    try {
      const dateStr = birthDate;
      const timeStr = (isTimeUnknown || !birthTime) ? '12:00' : birthTime;
      const profile = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: firstName.trim(),
        gender: 'unknown',
        birthDate: dateStr,
        birthTime: timeStr,
        location: { name: selectedCity.name, lat: selectedCity.lat, lng: selectedCity.lng },
        isTimeUnknown,
        chart,
        type: 'self',
        motivation,
        painPoint,
        depth,
      };
      await setProfile(profile);
      // Persist persona preferences
      try {
        const { saveObject } = await import('@/lib/storage');
        await saveObject('celestia_persona_prefs', { motivation, painPoint, depth });
      } catch (e) {}
      onComplete?.();
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  // ── Derived data ─────────────────────────────────
  const sun = chart?.planets?.find(p => p.name === 'Sun');
  const moon = chart?.planets?.find(p => p.name === 'Moon');
  const rising = chart?.planets?.find(p => p.name === 'Ascendant');
  const dominantElement = chart?.elements ? Object.entries(chart.elements).sort((a, b) => b[1] - a[1])[0] : null;
  const retroCount = chart?.planets?.filter(p => p.isRetrograde).length || 0;
  const transitAspectCount = todayTransits.length;

  // ══════════════════════════════════════════════════
  // SCREEN RENDERERS
  // ══════════════════════════════════════════════════

  // ── 1. HOOK ──────────────────────────────────────
  const renderHook = () => (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '0 32px',
      position: 'relative', minHeight: '100%',
    }}>
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: 150,
        backgroundColor: 'rgba(200,168,75,0.06)',
      }} />
      <span style={{ fontSize: 32, color: '#C8A84B', marginBottom: 20, opacity: 0.6 }}>✦</span>
      <h1 className="font-serif" style={{
        fontSize: 34, color: '#0E0E22', textAlign: 'center',
        lineHeight: '46px', marginBottom: 14,
      }}>
        The stars remember<br />when you were born
      </h1>
      <p className="font-sans" style={{
        fontSize: 15, fontWeight: 300, color: '#97907F',
        textAlign: 'center', lineHeight: '24px', marginBottom: 8,
      }}>
        Your birth chart is a fingerprint.<br />No two are alike. Let's read yours.
      </p>
      <div style={{ height: 40, width: '100%' }} />
      <div style={{ width: '100%', paddingLeft: 8, paddingRight: 8 }}>
        <GoldButton text="Show Me ✦" onPress={() => advance()} />
      </div>
      <span className="font-sans" style={{
        fontSize: 11, color: '#97907F', marginTop: 16, opacity: 0.5,
      }}>
        2 minutes · completely free
      </span>
    </div>
  );

  // ── 2. MOTIVATION ────────────────────────────────
  const renderMotivation = () => (
    <div className="scroll-container" style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '20px 26px 30px' }}>
        <span className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 3, color: '#C8A84B', marginBottom: 14, display: 'block' }}>ABOUT YOU</span>
        <h1 className="font-serif" style={{ fontSize: 30, color: '#0E0E22', lineHeight: '40px', marginBottom: 10 }}>
          What brought you<br />here tonight?
        </h1>
        <p className="font-sans" style={{ fontSize: 14, fontWeight: 300, color: '#97907F', lineHeight: '22px', marginBottom: 24 }}>No wrong answers. Just honesty.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <OptionCard text="I want to understand myself better" icon="🪞" selected={motivation === 'self'} onPress={() => selectAndAdvance(setMotivation, 'self')} />
          <OptionCard text="I'm going through something big" icon="🌊" selected={motivation === 'change'} onPress={() => selectAndAdvance(setMotivation, 'change')} />
          <OptionCard text="I need clarity on a relationship" icon="💫" selected={motivation === 'love'} onPress={() => selectAndAdvance(setMotivation, 'love')} />
          <OptionCard text="I'm curious — show me what you've got" icon="✨" selected={motivation === 'curious'} onPress={() => selectAndAdvance(setMotivation, 'curious')} />
        </div>
      </div>
    </div>
  );

  // ── 3. PAIN POINT ────────────────────────────────
  const renderPain = () => (
    <div className="scroll-container" style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '20px 26px 30px' }}>
        <span className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 3, color: '#C8A84B', marginBottom: 14, display: 'block' }}>GOING DEEPER</span>
        <h1 className="font-serif" style={{ fontSize: 30, color: '#0E0E22', lineHeight: '40px', marginBottom: 10 }}>
          What feels most<br />uncertain right now?
        </h1>
        <p className="font-sans" style={{ fontSize: 14, fontWeight: 300, color: '#97907F', lineHeight: '22px', marginBottom: 24 }}>Your chart might explain why.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <OptionCard text="My love life" icon="♡" selected={painPoint === 'love'} onPress={() => selectAndAdvance(setPainPoint, 'love')} />
          <OptionCard text="My career and purpose" icon="◆" selected={painPoint === 'career'} onPress={() => selectAndAdvance(setPainPoint, 'career')} />
          <OptionCard text="My sense of self" icon="☽" selected={painPoint === 'self'} onPress={() => selectAndAdvance(setPainPoint, 'self')} />
          <OptionCard text="Everything, honestly" icon="∞" selected={painPoint === 'all'} onPress={() => selectAndAdvance(setPainPoint, 'all')} />
        </div>
      </div>
    </div>
  );

  // ── 4. EMOTIONAL DEPTH ───────────────────────────
  const renderDepth = () => (
    <div className="scroll-container" style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '20px 26px 30px' }}>
        <span className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 3, color: '#C8A84B', marginBottom: 14, display: 'block' }}>ONE MORE THING</span>
        <h1 className="font-serif" style={{ fontSize: 30, color: '#0E0E22', lineHeight: '40px', marginBottom: 10 }}>
          How often do you feel<br />like no one really<br /><em style={{ fontStyle: 'italic' }}>gets</em> you?
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <OptionCard text="All the time" selected={depth === 'always'} onPress={() => selectAndAdvance(setDepth, 'always')} />
          <OptionCard text="More than I'd like to admit" selected={depth === 'often'} onPress={() => selectAndAdvance(setDepth, 'often')} />
          <OptionCard text="Sometimes" selected={depth === 'sometimes'} onPress={() => selectAndAdvance(setDepth, 'sometimes')} />
          <OptionCard text="I just want more self-awareness" selected={depth === 'aware'} onPress={() => selectAndAdvance(setDepth, 'aware')} />
        </div>
      </div>
    </div>
  );

  // ── 5. BIRTH DATE + NAME ─────────────────────────
  const renderBirthDate = () => (
    <div className="scroll-container" style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '20px 26px 30px' }}>
        <span className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 3, color: '#C8A84B', marginBottom: 14, display: 'block' }}>YOUR CHART</span>
        <h1 className="font-serif" style={{ fontSize: 30, color: '#0E0E22', lineHeight: '40px', marginBottom: 10 }}>
          When did your<br />story begin?
        </h1>
        <p className="font-sans" style={{ fontSize: 14, fontWeight: 300, color: '#97907F', lineHeight: '22px', marginBottom: 24 }}>
          Your birth moment is your cosmic fingerprint.<br />No two charts are alike.
        </p>

        {/* First Name */}
        <div style={{ marginBottom: 16 }}>
          <label className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: '#97907F', marginBottom: 8, display: 'block' }}>FIRST NAME</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="What should we call you?"
            autoCapitalize="words"
            className="font-sans"
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: firstName.length > 0 ? '1px solid #C8A84B' : '1px solid #EAE3D6',
              borderRadius: 14,
              paddingTop: 14, paddingBottom: 14,
              paddingLeft: 16, paddingRight: 16,
              fontSize: 16,
              color: '#0E0E22',
              outline: 'none',
            }}
          />
        </div>

        {/* Birth Date */}
        <div style={{ marginBottom: 16 }}>
          <label className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: '#97907F', marginBottom: 8, display: 'block' }}>BIRTH DATE</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="font-sans"
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: birthDate ? '1px solid #C8A84B' : '1px solid #EAE3D6',
              borderRadius: 14,
              paddingTop: 14, paddingBottom: 14,
              paddingLeft: 16, paddingRight: 16,
              fontSize: 16,
              color: birthDate ? '#0E0E22' : '#97907F',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ height: 24 }} />
        <GoldButton text="Continue" onPress={() => advance()} disabled={!firstName.trim() || !birthDate} />
      </div>
    </div>
  );

  // ── 6. BIRTH TIME ────────────────────────────────
  const renderBirthTime = () => (
    <div className="scroll-container" style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '20px 26px 30px' }}>
        <span className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 3, color: '#C8A84B', marginBottom: 14, display: 'block' }}>PRECISION</span>
        <h1 className="font-serif" style={{ fontSize: 30, color: '#0E0E22', lineHeight: '40px', marginBottom: 10 }}>
          Do you know what time<br />you were born?
        </h1>
        <p className="font-sans" style={{ fontSize: 14, fontWeight: 300, color: '#97907F', lineHeight: '22px', marginBottom: 24 }}>
          This determines your Rising sign —<br />the mask you show the world.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <OptionCard
            text="Yes, I know my birth time"
            sub={birthTime ? `Selected: ${birthTime}` : 'Tap to select time'}
            icon="🕐"
            selected={!isTimeUnknown && birthTime !== ''}
            onPress={() => {
              setIsTimeUnknown(false);
              // Focus the hidden time input
              document.getElementById('birth-time-input')?.showPicker?.();
              document.getElementById('birth-time-input')?.focus();
            }}
          />
          <OptionCard
            text="I'm not sure"
            sub="We'll use a noon chart — still powerful"
            icon="🤷‍♀️"
            selected={isTimeUnknown}
            onPress={() => { setIsTimeUnknown(true); setBirthTime(''); setTimeout(() => advance(), 500); }}
          />
        </div>

        {/* Hidden time input that shows native picker */}
        {!isTimeUnknown && (
          <div style={{ marginTop: 16 }}>
            <input
              id="birth-time-input"
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="font-sans"
              style={{
                width: '100%',
                backgroundColor: '#FFFFFF',
                border: birthTime ? '1px solid #C8A84B' : '1px solid #EAE3D6',
                borderRadius: 14,
                paddingTop: 14, paddingBottom: 14,
                paddingLeft: 16, paddingRight: 16,
                fontSize: 16,
                color: '#0E0E22',
                outline: 'none',
              }}
            />
          </div>
        )}

        {(birthTime || isTimeUnknown) && (
          <div style={{ marginTop: 20 }}>
            <GoldButton text="Continue" onPress={() => advance()} />
          </div>
        )}
      </div>
    </div>
  );

  // ── 7. BIRTH PLACE ───────────────────────────────
  const renderBirthPlace = () => (
    <div className="scroll-container" style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '20px 26px 30px' }}>
        <span className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 3, color: '#C8A84B', marginBottom: 14, display: 'block' }}>LOCATION</span>
        <h1 className="font-serif" style={{ fontSize: 30, color: '#0E0E22', lineHeight: '40px', marginBottom: 10 }}>
          Where did you first<br />see the sky?
        </h1>
        <p className="font-sans" style={{ fontSize: 14, fontWeight: 300, color: '#97907F', lineHeight: '22px', marginBottom: 24 }}>Your birthplace completes your chart.</p>

        <div style={{ marginBottom: 16 }}>
          <label className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: '#97907F', marginBottom: 8, display: 'block' }}>BIRTH CITY</label>
          <input
            type="text"
            value={selectedCity ? selectedCity.name.split(',')[0] : citySearch}
            onChange={(e) => { setSelectedCity(null); setCitySearch(e.target.value); }}
            placeholder="Search any city..."
            autoCapitalize="words"
            className="font-sans"
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: selectedCity ? '1px solid #C8A84B' : '1px solid #EAE3D6',
              borderRadius: 14,
              paddingTop: 14, paddingBottom: 14,
              paddingLeft: 16, paddingRight: 16,
              fontSize: 16,
              color: '#0E0E22',
              outline: 'none',
            }}
          />
        </div>

        {citySearching && (
          <div style={{ padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid #C8A84B', borderTopColor: 'transparent', borderRadius: '50%' }} />
          </div>
        )}

        {!citySearching && citySuggestions.length > 0 && (
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            overflow: 'hidden',
            marginTop: 4,
            border: '1px solid #EAE3D6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            {citySuggestions.map((c, i) => (
              <button
                key={i}
                onClick={() => { setSelectedCity(c); setCitySearch(''); setCitySuggestions([]); }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: 14,
                  borderBottom: '1px solid #F3EDE2',
                  background: 'none',
                  border: 'none',
                  borderBottom: i < citySuggestions.length - 1 ? '1px solid #F3EDE2' : 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <span className="font-sans" style={{ fontSize: 14, color: '#2A2418' }}>{c.name}</span>
              </button>
            ))}
          </div>
        )}

        {selectedCity && (
          <div style={{
            backgroundColor: '#F3EDE2',
            borderRadius: 100,
            paddingTop: 8, paddingBottom: 8,
            paddingLeft: 16, paddingRight: 16,
            marginTop: 12,
            display: 'inline-block',
            border: '1px solid #EAE3D6',
          }}>
            <span style={{ fontSize: 13, color: '#C8A84B' }}>📍 {selectedCity.name.split(',').slice(0, 2).join(',')}</span>
          </div>
        )}

        <div style={{ height: 24 }} />
        <GoldButton text="Cast My Chart ✦" onPress={() => advance()} disabled={!selectedCity} />
      </div>
    </div>
  );

  // ── 8. CALCULATING ───────────────────────────────
  const calcPhases = ['Locating your planets...', 'Calculating house cusps...', 'Mapping natal aspects...', 'Reading your cosmic patterns...'];
  const renderCalculating = () => (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '0 32px',
      position: 'relative', minHeight: '100%',
    }}>
      <div style={{
        position: 'absolute', width: 280, height: 280, borderRadius: 140,
        backgroundColor: 'rgba(200,168,75,0.06)',
      }} />
      <div style={{ marginBottom: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 40,
          background: 'linear-gradient(180deg, #EDD060 0%, #C8A84B 50%, #8C6C18 100%)',
          boxShadow: '0 0 30px rgba(200,168,75,0.4)',
        }} className="animate-pulse" />
      </div>
      <h2 className="font-serif" style={{ fontSize: 26, color: '#0E0E22', marginBottom: 14 }}>Casting your chart</h2>
      <p className="font-sans" style={{ fontSize: 14, fontWeight: 300, color: '#97907F', textAlign: 'center', marginBottom: 20, minHeight: 20 }}>
        {calcPhases[calcPhase] || calcPhases[0]}
      </p>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        {calcPhases.map((_, i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: i <= calcPhase ? '#C8A84B' : '#EAE3D6',
            transition: 'background-color 0.3s ease',
          }} />
        ))}
      </div>
    </div>
  );

  // ── 9. FIRST HIT (Sun Sign) ──────────────────────
  const renderFirstHit = () => (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '0 32px',
      position: 'relative', minHeight: '100%',
    }}>
      <div style={{
        position: 'absolute', width: 340, height: 340, borderRadius: 170,
        backgroundColor: 'rgba(200,168,75,0.08)',
      }} />
      <span className="font-sans" style={{ fontSize: 13, fontWeight: 600, letterSpacing: 3, color: '#C8A84B', marginBottom: 8 }}>Your Sun is in</span>
      <h1 className="font-serif" style={{ fontSize: 52, color: '#0E0E22', marginBottom: 14 }}>{sun?.sign || '—'}</h1>
      <p className="font-serif" style={{ fontSize: 17, fontStyle: 'italic', color: '#2A2418', textAlign: 'center', lineHeight: '26px', paddingLeft: 16, paddingRight: 16, marginBottom: 24 }}>
        {SUN_TAGLINES[sun?.sign] || ''}
      </p>
      <div style={{ width: 40, height: 1, backgroundColor: '#C8A84B', marginBottom: 24, opacity: 0.4 }} />
      <p className="font-sans" style={{ fontSize: 14, fontWeight: 300, color: '#97907F', textAlign: 'center', lineHeight: '22px' }}>
        {depth === 'always' || depth === 'often'
          ? "That feeling of being misunderstood?\nYour chart explains exactly why.".split('\n').map((line, i) => <span key={i}>{line}<br /></span>)
          : "There's so much more beneath the surface.\nLet's go deeper.".split('\n').map((line, i) => <span key={i}>{line}<br /></span>)
        }
      </p>
      <div style={{ height: 32, width: '100%' }} />
      <div style={{ width: '100%', paddingLeft: 8, paddingRight: 8 }}>
        <GoldButton text="Show Me Everything" onPress={() => advance()} />
      </div>
    </div>
  );

  // ── 10. THE BIG REVEAL ────────────────────────────
  const renderBigReveal = () => (
    <div className="scroll-container" style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '40px 26px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 4, color: '#C8A84B', textAlign: 'center', marginBottom: 8 }}>✦ YOUR COSMIC BLUEPRINT ✦</span>
        <h1 className="font-serif" style={{ fontSize: 38, color: '#0E0E22', textAlign: 'center', marginBottom: 20 }}>{firstName}</h1>

        {/* Chart wheel placeholder */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, padding: 16, borderRadius: 20,
          border: '1px solid #EAE3D6', backgroundColor: '#FFFFFF',
          width: 308, height: 308,
        }}>
          <div style={{
            width: 276, height: 276,
            borderRadius: '50%',
            border: '2px solid rgba(200,168,75,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}>
            <div style={{
              width: 200, height: 200, borderRadius: '50%',
              border: '1px solid rgba(200,168,75,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                width: 120, height: 120, borderRadius: '50%',
                border: '1px solid rgba(200,168,75,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 28, color: '#C8A84B', opacity: 0.6 }}>✦</span>
              </div>
            </div>
            {/* Planet markers */}
            {chart?.planets?.slice(0, 10).map((planet, i) => {
              const angle = (planet.degree || 0) * (Math.PI / 180) - Math.PI / 2;
              const r = 118;
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              const symbols = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };
              return (
                <span key={i} style={{
                  position: 'absolute',
                  left: `calc(50% + ${x}px - 8px)`,
                  top: `calc(50% + ${y}px - 8px)`,
                  fontSize: 14, color: '#C8A84B',
                  width: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {symbols[planet.name] || '·'}
                </span>
              );
            })}
          </div>
        </div>

        {/* Big 3 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, width: '100%' }}>
          <div style={{
            backgroundColor: '#FFFFFF', border: '1px solid #EAE3D6',
            borderRadius: 16, padding: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <span className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: '#C8A84B', marginBottom: 4, display: 'block' }}>☉ SUN</span>
            <span className="font-serif" style={{ fontSize: 24, color: '#0E0E22', marginBottom: 4, display: 'block' }}>{sun?.sign || '—'}</span>
            <span className="font-serif" style={{ fontSize: 13, fontStyle: 'italic', color: '#97907F', lineHeight: '20px', display: 'block' }}>{SUN_TAGLINES[sun?.sign] || ''}</span>
          </div>
          <div style={{
            backgroundColor: '#FFFFFF', border: '1px solid #EAE3D6',
            borderRadius: 16, padding: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <span className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: '#C8A84B', marginBottom: 4, display: 'block' }}>☽ MOON</span>
            <span className="font-serif" style={{ fontSize: 24, color: '#0E0E22', marginBottom: 4, display: 'block' }}>{moon?.sign || '—'}</span>
            <span className="font-serif" style={{ fontSize: 13, fontStyle: 'italic', color: '#97907F', lineHeight: '20px', display: 'block' }}>{MOON_TAGLINES[moon?.sign] || ''}</span>
          </div>
          {rising && (
            <div style={{
              backgroundColor: '#FFFFFF', border: '1px solid #EAE3D6',
              borderRadius: 16, padding: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <span className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: '#C8A84B', marginBottom: 4, display: 'block' }}>↑ RISING</span>
              <span className="font-serif" style={{ fontSize: 24, color: '#0E0E22', marginBottom: 4, display: 'block' }}>{rising?.sign || '—'}</span>
              <span className="font-serif" style={{ fontSize: 13, fontStyle: 'italic', color: '#97907F', lineHeight: '20px', display: 'block' }}>{RISING_TAGLINES[rising?.sign] || ''}</span>
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'flex', flexDirection: 'row', justifyContent: 'space-around',
          backgroundColor: '#F3EDE2', borderRadius: 14, padding: 16,
          marginBottom: 16, width: '100%',
        }}>
          {dominantElement && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span className="font-sans" style={{ fontSize: 16, fontWeight: 600, color: '#C8A84B' }}>{ELEMENT_LABELS[dominantElement[0]] || dominantElement[0]}</span>
              <span className="font-sans" style={{ fontSize: 10, color: '#97907F', letterSpacing: 1 }}>Dominant</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span className="font-sans" style={{ fontSize: 16, fontWeight: 600, color: '#C8A84B' }}>{chart?.aspects?.length || 0}</span>
            <span className="font-sans" style={{ fontSize: 10, color: '#97907F', letterSpacing: 1 }}>Aspects</span>
          </div>
          {retroCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span className="font-sans" style={{ fontSize: 16, fontWeight: 600, color: '#C8A84B' }}>{retroCount} ℞</span>
              <span className="font-sans" style={{ fontSize: 10, color: '#97907F', letterSpacing: 1 }}>Retrograde</span>
            </div>
          )}
        </div>

        {/* Personalized insight */}
        <div style={{
          backgroundColor: '#F3EDE2', border: '1px solid #EAE3D6',
          borderRadius: 16, padding: 18, width: '100%',
        }}>
          <p className="font-sans" style={{
            fontSize: 14, fontWeight: 300, color: '#2A2418',
            lineHeight: '23px', textAlign: 'center',
          }}>
            {motivation === 'love' || painPoint === 'love'
              ? `With your Moon in ${moon?.sign || 'your sign'}, you love with your whole body. Your chart reveals deep patterns in how you connect — and why some connections leave you empty.`
              : motivation === 'change'
              ? `Your chart shows a soul built for transformation. With ${sun?.sign || 'your Sun'} energy and a ${moon?.sign || ''} Moon, you don't just survive change — you were made for it.`
              : painPoint === 'career'
              ? `Your Midheaven and 10th house reveal a professional path that most people wouldn't guess. Your chart suggests your real purpose is still unfolding.`
              : `A ${sun?.sign || ''} Sun with a ${moon?.sign || ''} Moon is rare. You process the world differently than almost everyone around you — and your chart shows exactly why.`
            }
          </p>
        </div>

        <div style={{ height: 24 }} />
        <GoldButton text="This Is Just The Beginning" onPress={() => advance()} />
        <div style={{ height: 40 }} />
      </div>
    </div>
  );

  // ── 11. DAILY HOOK ───────────────────────────────
  const renderDailyHook = () => (
    <div className="scroll-container" style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '20px 26px 30px' }}>
        <span className="font-sans" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 3, color: '#C8A84B', marginBottom: 14, display: 'block' }}>RIGHT NOW</span>
        <h1 className="font-serif" style={{ fontSize: 30, color: '#0E0E22', lineHeight: '40px', marginBottom: 10 }}>
          Today in<br /><em style={{ fontStyle: 'italic' }}>{firstName}'s</em> sky
        </h1>
        <p className="font-sans" style={{ fontSize: 14, fontWeight: 300, color: '#97907F', lineHeight: '22px', marginBottom: 24 }}>Your chart is alive. It changes every day.</p>

        <div style={{
          backgroundColor: '#FFFFFF', border: '1px solid #EAE3D6',
          borderRadius: 16, padding: 16, marginBottom: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <span className="font-sans" style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2, color: '#C8A84B', marginBottom: 6, display: 'block' }}>MOON</span>
          <span className="font-serif" style={{ fontSize: 18, color: '#0E0E22', marginBottom: 4, display: 'block' }}>Moon in {moonData?.sign || 'transit'}</span>
          <span className="font-sans" style={{ fontSize: 13, fontWeight: 300, color: '#97907F', lineHeight: '20px', display: 'block' }}>
            {moonData?.phaseName || 'Current phase'} · {moonData?.illumination?.toFixed(0) || '--'}% illuminated
          </span>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF', border: '1px solid #EAE3D6',
          borderRadius: 16, padding: 16, marginBottom: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <span className="font-sans" style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2, color: '#C8A84B', marginBottom: 6, display: 'block' }}>ACTIVE TRANSITS</span>
          <span className="font-serif" style={{ fontSize: 18, color: '#0E0E22', marginBottom: 4, display: 'block' }}>{transitAspectCount} planets in motion</span>
          <span className="font-sans" style={{ fontSize: 13, fontWeight: 300, color: '#97907F', lineHeight: '20px', display: 'block' }}>
            These transit planets are forming aspects to your natal chart right now — shaping your day.
          </span>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF', border: '1px solid #EAE3D6',
          borderRadius: 16, padding: 16, marginBottom: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <span className="font-sans" style={{ fontSize: 9, fontWeight: 600, letterSpacing: 2, color: '#C8A84B', marginBottom: 6, display: 'block' }}>TOMORROW</span>
          <span className="font-serif" style={{ fontSize: 18, color: '#0E0E22', marginBottom: 4, display: 'block' }}>Your forecast updates daily</span>
          <span className="font-sans" style={{ fontSize: 13, fontWeight: 300, color: '#97907F', lineHeight: '20px', display: 'block' }}>
            AI-powered readings from your real transits. Not sun-sign garbage. Your chart. Your sky. Every morning.
          </span>
        </div>

        <div style={{ height: 24 }} />
        <GoldButton text="Continue" onPress={() => advance()} />
        <div style={{ height: 32 }} />
      </div>
    </div>
  );

  // ── 12. SOFT PAYWALL ─────────────────────────────
  const renderSoftPaywall = () => (
    <div className="scroll-container" style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '60px 26px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: 28, color: '#C8A84B', textAlign: 'center', marginBottom: 14, opacity: 0.5 }}>✦</span>
        <h1 className="font-serif" style={{ fontSize: 28, color: '#0E0E22', lineHeight: '38px', textAlign: 'center', marginBottom: 10 }}>
          Your chart is cast.<br />Your journey starts now.
        </h1>
        <p className="font-sans" style={{ fontSize: 14, fontWeight: 300, color: '#97907F', textAlign: 'center', marginBottom: 24 }}>Everything below is included — free for 7 days.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28, width: '100%' }}>
          {[
            { icon: '☉', title: 'Daily AI readings', desc: 'From your real transits — not your sun sign' },
            { icon: '♡', title: 'Relationship synastry', desc: 'Real compatibility, chart-to-chart' },
            { icon: '⚡', title: 'Transit alerts', desc: 'Know when planets hit your chart' },
            { icon: '💬', title: 'AI astrologer', desc: 'Unlimited conversations about your chart' },
            { icon: '📊', title: 'Deep reports', desc: 'Love, career, lunar, purpose — all yours' },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: '#F3EDE2', border: '1px solid #EAE3D6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 18 }}>{b.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <span className="font-sans" style={{ fontSize: 15, fontWeight: 500, color: '#0E0E22', marginBottom: 1, display: 'block' }}>{b.title}</span>
                <span className="font-sans" style={{ fontSize: 12, color: '#97907F', display: 'block' }}>{b.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <GoldButton text="Start My Free Trial" onPress={() => advance()} sub="No charge today · Cancel anytime" />
        <button onClick={() => advance()} style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer' }}>
          <span className="font-sans" style={{ fontSize: 13, color: '#97907F', textDecoration: 'underline' }}>Maybe later</span>
        </button>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );

  // ── 13. REASSURANCE ──────────────────────────────
  const renderReassurance = () => (
    <div className="scroll-container" style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '60px 26px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="font-serif" style={{ fontSize: 28, color: '#0E0E22', lineHeight: '38px', textAlign: 'center', marginBottom: 10 }}>
          Join thousands who<br />stopped settling for<br />generic horoscopes
        </h1>

        {/* Testimonials */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, width: '100%' }}>
          {[
            { text: '"I screenshot my chart reading and sent it to everyone. It was THAT accurate."', name: 'Mia, 24' },
            { text: '"Other apps just tell me I\'m a Libra. This one actually knows my whole chart."', name: 'Jade, 29' },
            { text: '"I\'ve never felt so seen by an app. The daily transit readings are addictive."', name: 'Sara, 22' },
          ].map((t, i) => (
            <div key={i} style={{
              backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
              border: '1px solid #EAE3D6',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <p className="font-serif" style={{ fontSize: 14, fontStyle: 'italic', color: '#2A2418', lineHeight: '22px', marginBottom: 6 }}>{t.text}</p>
              <span style={{ fontSize: 12, color: '#C8A84B' }}>— {t.name}</span>
            </div>
          ))}
        </div>

        <div style={{
          backgroundColor: '#F3EDE2', border: '1px solid #EAE3D6',
          borderRadius: 16, padding: 18, marginBottom: 24,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          width: '100%',
        }}>
          <span className="font-sans" style={{ fontWeight: 600, fontSize: 15, color: '#C8A84B', marginBottom: 4 }}>Try everything free for 7 days</span>
          <span className="font-sans" style={{ fontSize: 13, color: '#97907F', textAlign: 'center', lineHeight: '20px' }}>
            If it doesn't change how you see yourself,<br />cancel before the trial ends. No charge.
          </span>
        </div>

        <GoldButton text="Try Free for 7 Days" onPress={() => advance()} />
        <button onClick={() => advance()} style={{ marginTop: 16, background: 'none', border: 'none', cursor: 'pointer' }}>
          <span className="font-sans" style={{ fontSize: 13, color: '#97907F', textDecoration: 'underline' }}>See pricing first</span>
        </button>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );

  // ── 14. HARD CLOSE ───────────────────────────────
  const renderHardClose = () => (
    <div className="scroll-container" style={{ flex: 1, overflow: 'auto' }}>
      <div style={{ padding: '50px 26px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="font-serif" style={{ fontSize: 28, color: '#0E0E22', lineHeight: '38px', textAlign: 'center', marginBottom: 10 }}>Choose your plan</h1>
        <p className="font-sans" style={{ fontSize: 14, fontWeight: 300, color: '#97907F', textAlign: 'center', marginBottom: 24 }}>{firstName}'s chart is waiting</p>

        {/* Annual plan */}
        <button
          onClick={() => setSelectedPlan('annual')}
          style={{
            width: '100%',
            border: selectedPlan === 'annual' ? '1.5px solid #C8A84B' : '1px solid #EAE3D6',
            borderRadius: 18, padding: 18, marginBottom: 12,
            overflow: 'hidden', backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            cursor: 'pointer', position: 'relative',
            textAlign: 'left',
          }}
        >
          <div style={{
            position: 'absolute', top: 0, right: 0,
            backgroundColor: '#C8A84B',
            borderBottomLeftRadius: 12,
            paddingTop: 4, paddingBottom: 4,
            paddingLeft: 12, paddingRight: 12,
          }}>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: '#0E0E22' }}>BEST VALUE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 12,
              border: selectedPlan === 'annual' ? '2px solid #C8A84B' : '2px solid #EAE3D6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {selectedPlan === 'annual' && <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#C8A84B' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <span className="font-sans" style={{ fontSize: 16, fontWeight: 600, color: '#0E0E22', marginBottom: 2, display: 'block' }}>Annual</span>
              <span className="font-serif" style={{ fontSize: 24, color: '#0E0E22' }}>
                $49.99<span className="font-sans" style={{ fontSize: 13, fontWeight: 300, color: '#97907F' }}>/year</span>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span className="font-sans" style={{ fontSize: 11, fontWeight: 600, color: '#2E8B57', marginBottom: 2 }}>Save 40%</span>
              <span className="font-sans" style={{ fontSize: 12, color: '#2A2418' }}>$4.17/mo</span>
              <span className="font-sans" style={{ fontSize: 10, color: '#97907F', textDecoration: 'line-through', marginTop: 1 }}>$83.88 value</span>
            </div>
          </div>
          <div style={{
            marginTop: 12, backgroundColor: '#F3EDE2',
            borderRadius: 100,
            paddingTop: 6, paddingBottom: 6,
            paddingLeft: 14, paddingRight: 14,
            display: 'inline-block',
          }}>
            <span className="font-sans" style={{ fontSize: 11, color: '#C8A84B', fontWeight: 500 }}>✦ FREE for 7 days — cancel anytime</span>
          </div>
        </button>

        {/* Monthly plan */}
        <button
          onClick={() => setSelectedPlan('monthly')}
          style={{
            width: '100%',
            border: selectedPlan === 'monthly' ? '1.5px solid #C8A84B' : '1px solid #EAE3D6',
            borderRadius: 18, padding: 18, marginBottom: 12,
            backgroundColor: '#FFFFFF',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 12,
              border: selectedPlan === 'monthly' ? '2px solid #C8A84B' : '2px solid #EAE3D6',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {selectedPlan === 'monthly' && <div style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#C8A84B' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <span className="font-sans" style={{ fontSize: 16, fontWeight: 600, color: '#0E0E22', marginBottom: 2, display: 'block' }}>Monthly</span>
              <span className="font-serif" style={{ fontSize: 24, color: '#0E0E22' }}>
                $6.99<span className="font-sans" style={{ fontSize: 13, fontWeight: 300, color: '#97907F' }}>/month</span>
              </span>
            </div>
          </div>
        </button>

        <div style={{ height: 20 }} />
        <GoldButton
          text={selectedPlan === 'annual' ? 'Start My Free Trial' : 'Subscribe Now'}
          onPress={finishOnboarding}
          sub={selectedPlan === 'annual' ? "FREE today · You won't be charged" : '$6.99 billed today'}
        />

        <button onClick={finishOnboarding} style={{ marginTop: 18, background: 'none', border: 'none', cursor: 'pointer' }}>
          <span className="font-sans" style={{ fontSize: 13, color: '#97907F', textDecoration: 'underline' }}>Continue with limited access</span>
        </button>

        <p className="font-sans" style={{
          fontSize: 10, color: '#97907F', opacity: 0.5,
          textAlign: 'center', marginTop: 20, lineHeight: '16px',
          paddingLeft: 20, paddingRight: 20,
        }}>
          {selectedPlan === 'annual'
            ? 'Free 7-day trial. Then $49.99/year. Cancel anytime in Settings.'
            : 'Free 7-day trial. Then $6.99/month. Cancel anytime in Settings.'}
        </p>
        <div style={{ height: 40 }} />
      </div>
    </div>
  );

  // ── STEP ROUTER ──────────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 1: return renderHook();
      case 2: return renderMotivation();
      case 3: return renderPain();
      case 4: return renderDepth();
      case 5: return renderBirthDate();
      case 6: return renderBirthTime();
      case 7: return renderBirthPlace();
      case 8: return renderCalculating();
      case 9: return renderFirstHit();
      case 10: return renderBigReveal();
      case 11: return renderDailyHook();
      case 12: return renderSoftPaywall();
      case 13: return renderReassurance();
      case 14: return renderHardClose();
      default: return null;
    }
  };

  // ══════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════
  const showProgress = step >= 2 && step <= 11;
  const showBack = step >= 2 && step <= 11;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '100%', height: '100%',
      backgroundColor: '#FAF8F2',
    }}>
      {/* Header */}
      {(showProgress || showBack) && (
        <div style={{
          display: 'flex', flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 58,
          paddingLeft: 18, paddingRight: 18,
          gap: 10, zIndex: 10,
        }}>
          {showBack ? (
            <button
              onClick={() => { if (step > 1) advance(step - 1); }}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: '#FFFFFF', border: '1px solid #EAE3D6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <span className="font-sans" style={{ fontSize: 22, color: '#2A2418', marginTop: -2 }}>‹</span>
            </button>
          ) : <div style={{ width: 40 }} />}
          {showProgress && <ProgressBar step={step} />}
          <div style={{ width: 40 }} />
        </div>
      )}

      {/* Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'transform 0.15s ease, opacity 0.15s ease',
        transform: slideDir !== 0 ? `translateY(${slideDir * -20}px)` : 'translateY(0)',
        opacity: slideDir !== 0 ? 0.7 : 1,
      }}>
        {renderStep()}
      </div>
    </div>
  );
}
