'use client';
import React, { useMemo } from 'react';

const PLANET_GLYPHS = {
  Sun: '\u2609', Moon: '\u263d', Mercury: '\u263f', Venus: '\u2640', Mars: '\u2642',
  Jupiter: '\u2643', Saturn: '\u2644', Uranus: '\u2645', Neptune: '\u2646', Pluto: '\u2647',
  Ascendant: 'AC', Midheaven: 'MC', 'North Node': '\u260a', Chiron: '\u26b7',
};

const PLANET_COLORS_DARK = {
  Sun: '#F0C040', Moon: '#C8D4E8', Mercury: '#A8C0C0', Venus: '#E8A0C0',
  Mars: '#E86050', Jupiter: '#C0A860', Saturn: '#A89878', Uranus: '#80C8C0',
  Neptune: '#8090D0', Pluto: '#B080A0', Ascendant: '#C8A84B', Midheaven: '#C8A84B',
  'North Node': '#A0A0D0', Chiron: '#90B8A0',
};

const PLANET_COLORS_LIGHT = {
  Sun: '#C49000', Moon: '#4A5A72', Mercury: '#3A7070', Venus: '#C04878',
  Mars: '#D03830', Jupiter: '#A08020', Saturn: '#685848', Uranus: '#2A7A70',
  Neptune: '#3A4A98', Pluto: '#783868', Ascendant: '#8A6A20', Midheaven: '#8A6A20',
  'North Node': '#5A5A90', Chiron: '#407050',
};

const ASPECT_COLORS_DARK = {
  Conjunction: 'rgba(200,168,75,0.35)',
  Trine: 'rgba(126,200,160,0.3)',
  Sextile: 'rgba(160,200,224,0.25)',
  Square: 'rgba(232,120,120,0.25)',
  Opposition: 'rgba(232,120,120,0.2)',
};

const ASPECT_COLORS_LIGHT = {
  Conjunction: 'rgba(180,140,40,0.6)',
  Trine: 'rgba(40,140,70,0.55)',
  Sextile: 'rgba(40,100,180,0.5)',
  Square: 'rgba(200,60,60,0.5)',
  Opposition: 'rgba(200,80,40,0.45)',
};

const SIGNS = ['\u2648','\u2649','\u264a','\u264b','\u264c','\u264d','\u264e','\u264f','\u2650','\u2651','\u2652','\u2653'];
const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

export default function ChartWheel({ size = 276, planets, aspects, lightMode = false }) {
  const c = size / 2;
  const rad = (deg) => ((deg - 90) * Math.PI) / 180;
  const PLANET_COLORS = lightMode ? PLANET_COLORS_LIGHT : PLANET_COLORS_DARK;
  const ASPECT_COLORS = lightMode ? ASPECT_COLORS_LIGHT : ASPECT_COLORS_DARK;

  // Determine ascendant offset for whole-sign rotation
  const ascendant = planets?.find(p => p.name === 'Ascendant');
  const ascSign = ascendant?.sign;
  const ascIdx = ascSign ? SIGN_NAMES.indexOf(ascSign) : 0;
  // Rotate chart so ascendant sign starts at left (180 deg)
  const rotationOffset = ascIdx * 30;

  // Convert absolute degree to chart angle (0 deg Aries = top, clockwise)
  const toChartAngle = (absDegree) => {
    return (absDegree - rotationOffset + 180 + 360) % 360;
  };

  // Map real planets to chart positions
  const chartPlanets = useMemo(() => {
    if (!planets) return [];
    const showPlanets = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    return planets
      .filter(p => showPlanets.includes(p.name))
      .map(p => ({
        name: p.name,
        glyph: PLANET_GLYPHS[p.name] || '\u2605',
        color: PLANET_COLORS[p.name] || '#C8A84B',
        angle: toChartAngle(p.absDegree),
        absDegree: p.absDegree,
      }));
  }, [planets, rotationOffset]);

  // Resolve overlapping planets by nudging them apart
  const resolvedPlanets = useMemo(() => {
    const sorted = [...chartPlanets].sort((a, b) => a.angle - b.angle);
    const MIN_GAP = 12;
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < sorted.length; i++) {
        for (let j = i + 1; j < sorted.length; j++) {
          let diff = Math.abs(sorted[i].angle - sorted[j].angle);
          if (diff > 180) diff = 360 - diff;
          if (diff < MIN_GAP) {
            sorted[i].angle = (sorted[i].angle - 3 + 360) % 360;
            sorted[j].angle = (sorted[j].angle + 3) % 360;
          }
        }
      }
    }
    return sorted;
  }, [chartPlanets]);

  // Map real aspects
  const chartAspects = useMemo(() => {
    if (!aspects || !chartPlanets.length) return [];
    return aspects.slice(0, 12).map(a => {
      const p1 = chartPlanets.find(p => p.name === a.planet1);
      const p2 = chartPlanets.find(p => p.name === a.planet2);
      if (!p1 || !p2) return null;
      return { p1, p2, type: a.type };
    }).filter(Boolean);
  }, [aspects, chartPlanets]);

  // Sign ring positions with rotation
  const signPositions = SIGNS.map((s, i) => {
    const startAngle = ((i * 30) - rotationOffset + 180 + 360) % 360;
    const midAngle = startAngle + 15;
    return { sign: s, startAngle, midAngle };
  });

  const ascSignSymbol = ascSign ? SIGNS[SIGN_NAMES.indexOf(ascSign)] : '\u2653';

  // Theme-aware colors
  const ringColor = (opacity) => lightMode ? `rgba(140,110,50,${opacity})` : `rgba(200,168,75,${opacity})`;
  const dividerColor = lightMode ? 'rgba(180,150,80,0.3)' : 'rgba(200,168,75,0.1)';
  const signLabelColor = lightMode ? '#8A7030' : 'rgba(200,168,75,0.52)';
  const planetDotBg = lightMode ? '#FFFFFF' : 'rgba(14,14,34,0.88)';
  const centerFill = lightMode ? 'rgba(200,168,75,0.1)' : 'rgba(200,168,75,0.06)';
  const centerStroke = lightMode ? 'rgba(140,110,30,0.4)' : 'rgba(200,168,75,0.2)';
  const ascGlyphColor = lightMode ? '#8A6A20' : 'rgba(200,168,75,0.78)';
  const ascLabelColor = lightMode ? '#97907F' : 'rgba(250,248,242,0.24)';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Concentric rings */}
      {[128, 110, 76, 50, 33].map((r, i) => (
        <circle key={i} cx={c} cy={c} r={r} fill="none"
          stroke={ringColor(lightMode ? 0.5 - i * 0.06 : 0.22 - i * 0.04)} strokeWidth={lightMode ? (i === 0 ? 1.2 : 1.0) : 0.6} />
      ))}

      {/* House divider lines (12 segments) */}
      {signPositions.map((sp, i) => {
        const a = rad(sp.startAngle);
        return (
          <line key={i}
            x1={c + 33 * Math.cos(a)} y1={c + 33 * Math.sin(a)}
            x2={c + 110 * Math.cos(a)} y2={c + 110 * Math.sin(a)}
            stroke={dividerColor} strokeWidth={lightMode ? 0.8 : 0.5}
          />
        );
      })}

      {/* Zodiac sign labels */}
      {signPositions.map((sp, i) => {
        const a = rad(sp.midAngle);
        return (
          <text key={i} x={c + 119 * Math.cos(a)} y={c + 119 * Math.sin(a)}
            textAnchor="middle" dominantBaseline="central" fontSize={9.5} fill={signLabelColor}>
            {sp.sign}
          </text>
        );
      })}

      {/* Aspect lines (from real aspects) */}
      {chartAspects.map((asp, i) => {
        const a1 = resolvedPlanets.find(p => p.name === asp.p1.name);
        const a2 = resolvedPlanets.find(p => p.name === asp.p2.name);
        if (!a1 || !a2) return null;
        const ra = rad(a1.angle), rb = rad(a2.angle);
        const color = ASPECT_COLORS[asp.type] || (lightMode ? 'rgba(160,128,40,0.15)' : 'rgba(200,168,75,0.09)');
        return (
          <line key={`asp${i}`}
            x1={c + 76 * Math.cos(ra)} y1={c + 76 * Math.sin(ra)}
            x2={c + 76 * Math.cos(rb)} y2={c + 76 * Math.sin(rb)}
            stroke={color} strokeWidth={lightMode ? 1.2 : 0.7} strokeDasharray={lightMode ? '4,3' : '2,3'}
          />
        );
      })}

      {/* Planet dots */}
      {resolvedPlanets.map((p, i) => {
        const a = rad(p.angle);
        const x = c + 90 * Math.cos(a);
        const y = c + 90 * Math.sin(a);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={11.5} fill={planetDotBg} stroke={lightMode ? p.color : `${p.color}60`} strokeWidth={lightMode ? 1.5 : 1} />
            <text x={x} y={y + 3} textAnchor="middle" dominantBaseline="central" fontSize={10} fill={p.color}>{p.glyph}</text>
          </g>
        );
      })}

      {/* Center: Ascendant */}
      <circle cx={c} cy={c} r={26} fill={centerFill} stroke={centerStroke} strokeWidth={lightMode ? 1.0 : 0.8} />
      <text x={c} y={c - 2} textAnchor="middle" dominantBaseline="central" fontSize={17} fill={ascGlyphColor}>{ascSignSymbol}</text>
      <text x={c} y={c + 12} textAnchor="middle" dominantBaseline="central" fontSize={7} fill={ascLabelColor}>ASC</text>
    </svg>
  );
}
