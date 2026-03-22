'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useUserProfile } from '@/lib/UserProfileContext';

// Deeply specific placement statements — these feel personal, not generic
const MOON_HOUSE_INSIGHTS = {
  1: 'Your emotions are written all over your face. People feel your mood before you speak.',
  2: 'You find emotional safety in what you can touch, taste, and own. Comfort is your love language.',
  3: 'Your mind never stops processing feelings into words. You think your way through emotions.',
  4: 'Home isn\'t a place for you — it\'s a feeling. You carry it with you, or you feel lost.',
  5: 'You need to be adored. Not admired — adored. And you give that back tenfold.',
  6: 'You process emotions through routines and small acts of service. Chaos makes you unravel.',
  7: 'You only fully feel yourself when reflected in someone else\'s eyes.',
  8: 'Your emotional world is vast and private. You feel things others don\'t notice.',
  9: 'You heal by moving — new places, new ideas, new perspectives.',
  10: 'You hide your vulnerability behind competence. The world sees strength; you feel pressure.',
  11: 'You feel most yourself in a group of people who think differently.',
  12: 'Your emotional world is oceanic. You absorb everything — and most people have no idea.',
};

const VENUS_SIGN_INSIGHTS = {
  Aries: 'You chase who you want — and lose interest when the chase ends.',
  Taurus: 'You love slowly, deeply, and with your whole body. You don\'t do casual.',
  Gemini: 'You fall for minds before bodies. If they can\'t make you laugh, you\'re already gone.',
  Cancer: 'You love by taking care of people — and resent them when they don\'t notice.',
  Leo: 'You need grand love. Not quiet love. Not practical love. The kind that makes a scene.',
  Virgo: 'You show love through fixing things. You notice every detail — including every flaw.',
  Libra: 'You\'d rather be in the wrong relationship than no relationship at all.',
  Scorpio: 'You love like it\'s life or death. Because for you, it is.',
  Sagittarius: 'You need someone who makes you feel free, not someone who makes you feel safe.',
  Capricorn: 'You love in actions, not words. You\'d build someone a house before saying "I love you."',
  Aquarius: 'You need intellectual equals, not emotional dependents. Your love language is respect.',
  Pisces: 'You fall in love with people\'s potential — and then drown when they don\'t meet it.',
};

const SUN_MOON_COMBOS = {
  'Fire-Water': 'Your outer confidence hides an emotional depth that surprises everyone — including you.',
  'Fire-Fire': 'You burn bright, feel fast, and recover quickly. But you rarely let anyone see the ashes.',
  'Fire-Earth': 'Ambitious on the outside, quietly anxious on the inside. You hold yourself to impossible standards.',
  'Fire-Air': 'You live in your head and your heart at the same time — and they rarely agree.',
  'Earth-Water': 'You appear grounded, but inside you feel everything. You\'re the most emotional person no one suspects.',
  'Earth-Fire': 'Practical on the surface, restless underneath. You crave adventure but choose stability.',
  'Earth-Earth': 'You are the most reliable person in every room. That\'s both your gift and your prison.',
  'Earth-Air': 'You think more than you feel — and sometimes that worries you.',
  'Water-Fire': 'You feel everything deeply but react with intensity. People don\'t expect how strong you are.',
  'Water-Water': 'You absorb the emotional weather of every room you enter. Boundaries are your life lesson.',
  'Water-Earth': 'Your intuition is grounded in reality. You feel truth before you can explain it.',
  'Water-Air': 'You overthink your feelings and feel your thoughts. It\'s exhausting — and no one gets it.',
  'Air-Fire': 'Quick mind, big energy. You talk yourself into and out of things faster than anyone.',
  'Air-Water': 'You intellectualize your emotions because feeling them fully is terrifying.',
  'Air-Earth': 'You plan everything — including feelings. Spontaneity makes you uncomfortable.',
  'Air-Air': 'You live in ideas. Getting out of your head and into your body is the challenge.',
};

function getElement(sign) {
  const map = {
    Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
    Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
    Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
    Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
  };
  return map[sign] || 'Fire';
}

export default function WelcomeScreen({ onContinue }) {
  const { profile, chart } = useUserProfile();
  const firstName = profile?.name?.split(' ')[0] || 'Stargazer';
  const sun = chart?.planets?.find(p => p.name === 'Sun');
  const moon = chart?.planets?.find(p => p.name === 'Moon');
  const rising = chart?.planets?.find(p => p.name === 'Ascendant');
  const venus = chart?.planets?.find(p => p.name === 'Venus');
  const big3 = [
    sun && `☉ ${sun.sign}`,
    moon && `☽ ${moon.sign}`,
    rising && `↑ ${rising.sign}`,
  ].filter(Boolean);

  // Generate 2 deeply specific reveal statements from their actual chart
  const revealStatements = useMemo(() => {
    const statements = [];
    // Statement 1: Moon + house = emotional core
    if (moon?.sign && moon?.house) {
      const houseInsight = MOON_HOUSE_INSIGHTS[moon.house] || MOON_HOUSE_INSIGHTS[8];
      statements.push({
        label: `☽ Moon in ${moon.sign}, ${moon.house}${moon.house === 1 ? 'st' : moon.house === 2 ? 'nd' : moon.house === 3 ? 'rd' : 'th'} house`,
        text: houseInsight,
      });
    }
    // Statement 2: Sun-Moon element combo = inner tension
    if (sun?.sign && moon?.sign) {
      const combo = `${getElement(sun.sign)}-${getElement(moon.sign)}`;
      const comboInsight = SUN_MOON_COMBOS[combo];
      if (comboInsight) {
        statements.push({
          label: `${sun.sign} Sun + ${moon.sign} Moon`,
          text: comboInsight,
        });
      }
    }
    // Statement 3 (fallback or bonus): Venus = how you love
    if (venus?.sign && statements.length < 2) {
      const venusInsight = VENUS_SIGN_INSIGHTS[venus.sign];
      if (venusInsight) {
        statements.push({
          label: `♀ Venus in ${venus.sign}`,
          text: venusInsight,
        });
      }
    }
    return statements.slice(0, 2);
  }, [chart]);

  // Animation states
  const [mounted, setMounted] = useState(false);
  const [showName, setShowName] = useState(false);
  const [showReveal1, setShowReveal1] = useState(false);
  const [showReveal2, setShowReveal2] = useState(false);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => setMounted(true), 300);
    const t1 = setTimeout(() => setShowName(true), 750);
    const t2 = setTimeout(() => setShowReveal1(true), 1400);
    const t3 = setTimeout(() => setShowReveal2(true), 2000);
    const t4 = setTimeout(() => setShowCta(true), 2600);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #0E0E22 0%, #1A1060 50%, #0C1E3C 100%)',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Stars */}
      <Stars count={28} />

      <div
        className="scroll-container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 60,
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 36,
          height: '100%',
          overflowY: 'auto',
        }}
      >
        {/* Chart Wheel */}
        <div
          className="animate-float-welcome"
          style={{
            marginBottom: 20,
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'scale(1)' : 'scale(0.88)',
            transition: 'opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s',
          }}
        >
          <div style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            border: '1px solid rgba(200,168,75,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}>
            {/* Inner rings */}
            <div style={{
              width: 150, height: 150, borderRadius: '50%',
              border: '1px solid rgba(200,168,75,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'absolute',
            }} />
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              border: '1px solid rgba(200,168,75,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'absolute',
            }} />
            <span style={{ fontSize: 24, color: '#C8A84B', opacity: 0.5 }}>✦</span>
            {/* Planet markers */}
            {chart?.planets?.slice(0, 10).map((planet, i) => {
              const angle = (planet.degree || 0) * (Math.PI / 180) - Math.PI / 2;
              const r = 85;
              const x = Math.cos(angle) * r;
              const y = Math.sin(angle) * r;
              const symbols = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };
              return (
                <span key={i} style={{
                  position: 'absolute',
                  left: `calc(50% + ${x}px - 7px)`,
                  top: `calc(50% + ${y}px - 7px)`,
                  fontSize: 12, color: '#C8A84B',
                  width: 14, height: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {symbols[planet.name] || '·'}
                </span>
              );
            })}
          </div>
        </div>

        {/* Name + Big 3 */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          opacity: showName ? 1 : 0,
          transition: 'opacity 0.6s ease',
        }}>
          <h1 className="font-serif" style={{
            fontSize: 33, color: '#FAF8F2',
            marginBottom: 12, textAlign: 'center',
          }}>
            {firstName}
          </h1>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 7, marginBottom: 20 }}>
            {(big3.length > 0 ? big3 : ['☉ —', '☽ —', '↑ —']).map((b, i) => (
              <div key={i} style={{
                backgroundColor: 'rgba(200,168,75,0.1)',
                border: '1px solid rgba(200,168,75,0.2)',
                borderRadius: 100,
                paddingTop: 5, paddingBottom: 5,
                paddingLeft: 14, paddingRight: 14,
              }}>
                <span style={{ fontSize: 12, color: 'rgba(250,248,242,0.72)' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Personality Reveal Statements */}
        {revealStatements.map((stmt, i) => (
          <div
            key={i}
            style={{
              width: '100%',
              backgroundColor: 'rgba(200,168,75,0.06)',
              border: '1px solid rgba(200,168,75,0.15)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 12,
              opacity: (i === 0 ? showReveal1 : showReveal2) ? 1 : 0,
              transform: (i === 0 ? showReveal1 : showReveal2) ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            <span
              className="font-sans"
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: 1.5,
                color: '#C8A84B',
                marginBottom: 6,
                textTransform: 'uppercase',
                display: 'block',
              }}
            >
              {stmt.label}
            </span>
            <span
              className="font-serif"
              style={{
                fontSize: 14,
                fontStyle: 'italic',
                color: 'rgba(250,248,242,0.75)',
                lineHeight: '22px',
                display: 'block',
              }}
            >
              {stmt.text}
            </span>
          </div>
        ))}

        {/* CTA */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          width: '100%',
          opacity: showCta ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}>
          <p
            className="font-sans"
            style={{
              fontSize: 13,
              fontWeight: 300,
              color: 'rgba(250,248,242,0.35)',
              textAlign: 'center',
              lineHeight: '21.5px',
              paddingLeft: 8, paddingRight: 8,
              marginBottom: 24,
            }}
          >
            Your natal chart has been cast. This is just the beginning.
          </p>
          <button
            onClick={() => onContinue?.()}
            style={{
              width: '100%',
              minWidth: 320,
              height: 56,
              borderRadius: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #E2C46A 0%, #C8A84B 50%, #A07820 100%)',
              boxShadow: '0 7px 26px rgba(200,168,75,0.35)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span
              className="font-sans"
              style={{ fontWeight: 500, fontSize: 15, color: '#0E0E22' }}
            >
              Explore Your Chart →
            </span>
          </button>
        </div>

        <div style={{ height: 50 }} />
      </div>

      <style jsx>{`
        @keyframes float-welcome {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-9px); }
        }
        .animate-float-welcome {
          animation: float-welcome 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/* Stars component for dark backgrounds */
function Stars({ count = 28 }) {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const generated = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.15,
      delay: Math.random() * 4,
      duration: Math.random() * 3 + 2,
    }));
    setStars(generated);
  }, [count]);

  return (
    <>
      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            backgroundColor: 'rgba(250,248,242,0.6)',
            opacity: star.opacity,
            animation: `twinkle-w ${star.duration}s ease-in-out ${star.delay}s infinite`,
            zIndex: 0,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes twinkle-w {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  );
}
