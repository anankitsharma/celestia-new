// CelestiaMotif — 10-icon fine-line editorial motif library.
//
// Mirrors the designer's icon set in
// /references/stitch_celestial_swipe_cards_2/a_set_of_10_minimalist_fine_line_editorial_icons_for_an_astrology_app._symbols.
//
// Usage:
//   <CelestiaMotif kind="today" size={28} color="#1A1410" />
//
// Each motif is drawn at a 100×100 viewBox and scales via the `size` prop.
// 1px-equivalent stroke (computed against viewBox), open-ended paths,
// rounded line caps. Single color (defaults to current text color).

import React from 'react';
import Svg, {
  Circle, Line, Path, Polygon, G, Polyline,
} from 'react-native-svg';

export default function CelestiaMotif({ kind, size = 28, color = '#1A1410', strokeWidth = 1.5 }) {
  const props = { stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const fillProps = { fill: color, stroke: color, strokeWidth: 0 };
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {renderKind(kind, props, fillProps)}
    </Svg>
  );
}

function renderKind(kind, p, fp) {
  switch (kind) {
    // 1. TODAY — eye with rays
    case 'today':
      return (
        <G>
          {/* eye almond */}
          <Path d="M22 50 Q50 30 78 50 Q50 70 22 50 Z" {...p} />
          <Circle cx={50} cy={50} r={9} {...p} />
          <Circle cx={50} cy={50} r={3} {...fp} />
          {/* rays */}
          <Line x1={50} y1={20} x2={50} y2={12} {...p} />
          <Line x1={50} y1={88} x2={50} y2={80} {...p} />
          <Line x1={20} y1={50} x2={12} y2={50} {...p} />
          <Line x1={88} y1={50} x2={80} y2={50} {...p} />
          <Line x1={28} y1={28} x2={22} y2={22} {...p} />
          <Line x1={72} y1={28} x2={78} y2={22} {...p} />
          <Line x1={28} y1={72} x2={22} y2={78} {...p} />
          <Line x1={72} y1={72} x2={78} y2={78} {...p} />
        </G>
      );

    // 2. LOVE — faceted geometric heart
    case 'love':
      return (
        <G>
          <Path d="M50 80 L20 50 Q14 38 25 30 Q38 24 50 38 Q62 24 75 30 Q86 38 80 50 Z" {...p} />
          {/* internal facet lines */}
          <Line x1={50} y1={38} x2={50} y2={80} {...p} />
          <Line x1={28} y1={42} x2={50} y2={50} {...p} />
          <Line x1={72} y1={42} x2={50} y2={50} {...p} />
          <Line x1={50} y1={50} x2={35} y2={68} {...p} />
          <Line x1={50} y1={50} x2={65} y2={68} {...p} />
        </G>
      );

    // 3. CAREER — diamond
    case 'career':
      return (
        <G>
          <Polygon points="50,15 22,42 50,85 78,42" {...p} />
          <Line x1={22} y1={42} x2={78} y2={42} {...p} />
          {/* internal facets */}
          <Line x1={50} y1={15} x2={50} y2={42} {...p} />
          <Line x1={36} y1={42} x2={50} y2={85} {...p} />
          <Line x1={64} y1={42} x2={50} y2={85} {...p} />
        </G>
      );

    // 4. VITALITY — ECG / pulse line
    case 'vitality':
      return (
        <Polyline
          points="10,50 25,50 32,30 42,72 52,18 62,62 72,50 90,50"
          {...p}
        />
      );

    // 5. GROWTH — spiral with leaf
    case 'growth':
      return (
        <G>
          {/* spiral */}
          <Path
            d="M50 50 Q50 38 62 38 Q78 38 78 56 Q78 78 52 78 Q22 78 22 50 Q22 18 56 18"
            {...p}
          />
          {/* leaf */}
          <Path d="M56 18 Q70 8 78 18 Q70 28 56 22" {...p} />
          <Line x1={66} y1={18} x2={70} y2={22} {...p} />
        </G>
      );

    // 6. SOCIAL — interconnected constellation network
    case 'social':
      return (
        <G>
          {/* nodes */}
          <Circle cx={50} cy={20} r={3} {...fp} />
          <Circle cx={20} cy={45} r={3} {...fp} />
          <Circle cx={80} cy={45} r={3} {...fp} />
          <Circle cx={32} cy={75} r={3} {...fp} />
          <Circle cx={68} cy={75} r={3} {...fp} />
          <Circle cx={50} cy={55} r={3} {...fp} />
          {/* edges */}
          <Line x1={50} y1={20} x2={20} y2={45} {...p} />
          <Line x1={50} y1={20} x2={80} y2={45} {...p} />
          <Line x1={50} y1={20} x2={50} y2={55} {...p} />
          <Line x1={20} y1={45} x2={50} y2={55} {...p} />
          <Line x1={80} y1={45} x2={50} y2={55} {...p} />
          <Line x1={20} y1={45} x2={32} y2={75} {...p} />
          <Line x1={80} y1={45} x2={68} y2={75} {...p} />
          <Line x1={32} y1={75} x2={50} y2={55} {...p} />
          <Line x1={68} y1={75} x2={50} y2={55} {...p} />
          <Line x1={32} y1={75} x2={68} y2={75} {...p} />
        </G>
      );

    // 7. SKY — Saturn with ring
    case 'sky':
      return (
        <G>
          <Circle cx={50} cy={50} r={20} {...p} />
          {/* ring (ellipse via two arcs) */}
          <Path d="M22 56 Q50 70 78 56 Q50 70 22 56 M22 56 Q50 42 78 56" {...p} />
          {/* tilted ring tips */}
          <Line x1={20} y1={56} x2={14} y2={58} {...p} />
          <Line x1={80} y1={56} x2={86} y2={54} {...p} />
        </G>
      );

    // 8. REFLECT — 8-point sparkle / star
    case 'reflect':
      return (
        <G>
          <Line x1={50} y1={10} x2={50} y2={90} {...p} />
          <Line x1={10} y1={50} x2={90} y2={50} {...p} />
          <Line x1={22} y1={22} x2={78} y2={78} {...p} />
          <Line x1={78} y1={22} x2={22} y2={78} {...p} />
          <Circle cx={50} cy={50} r={3} {...fp} />
        </G>
      );

    // 9. TRIGGER — crescent moon
    case 'trigger':
      return (
        <Path
          d="M68 22 Q40 30 38 50 Q40 70 68 78 Q42 78 32 50 Q42 22 68 22 Z"
          {...p}
        />
      );

    // 10. CLOSING — sun setting over horizon
    case 'closing':
      return (
        <G>
          {/* horizon */}
          <Line x1={10} y1={68} x2={90} y2={68} {...p} />
          {/* half sun above horizon */}
          <Path d="M28 68 Q28 42 50 42 Q72 42 72 68" {...p} />
          {/* short rays */}
          <Line x1={50} y1={32} x2={50} y2={26} {...p} />
          <Line x1={32} y1={42} x2={28} y2={38} {...p} />
          <Line x1={68} y1={42} x2={72} y2={38} {...p} />
          <Line x1={20} y1={56} x2={14} y2={56} {...p} />
          <Line x1={80} y1={56} x2={86} y2={56} {...p} />
        </G>
      );

    // 11. JOURNAL — open book with center spine + writing lines
    case 'journal':
      return (
        <G>
          {/* book outer outline */}
          <Path d="M18 28 L46 36 L46 80 L18 72 Z" {...p} />
          <Path d="M82 28 L54 36 L54 80 L82 72 Z" {...p} />
          {/* center spine */}
          <Line x1={46} y1={36} x2={54} y2={36} {...p} />
          <Line x1={46} y1={80} x2={54} y2={80} {...p} />
          <Line x1={50} y1={36} x2={50} y2={80} {...p} />
          {/* lines on left page */}
          <Line x1={24} y1={48} x2={42} y2={53} {...p} />
          <Line x1={24} y1={56} x2={42} y2={61} {...p} />
          <Line x1={24} y1={64} x2={36} y2={67} {...p} />
          {/* lines on right page */}
          <Line x1={58} y1={53} x2={76} y2={48} {...p} />
          <Line x1={58} y1={61} x2={76} y2={56} {...p} />
          <Line x1={58} y1={67} x2={70} y2={64} {...p} />
        </G>
      );

    // 12. CIRCLE — two interlocking circles (Venn-style)
    case 'circle':
      return (
        <G>
          <Circle cx={36} cy={50} r={22} {...p} />
          <Circle cx={64} cy={50} r={22} {...p} />
          {/* small accent dot at the intersection top */}
          <Circle cx={50} cy={36} r={2} {...fp} />
          <Circle cx={50} cy={64} r={2} {...fp} />
        </G>
      );

    default:
      return null;
  }
}
