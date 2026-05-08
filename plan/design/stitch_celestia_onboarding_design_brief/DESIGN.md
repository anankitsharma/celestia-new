---
name: Liquid Glass Editorial
colors:
  surface: '#fbf9f8'
  surface-dim: '#dbd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#544341'
  inverse-surface: '#303030'
  inverse-on-surface: '#f2f0f0'
  outline: '#877270'
  outline-variant: '#dac1bf'
  surface-tint: '#954742'
  primary: '#2a0002'
  on-primary: '#ffffff'
  primary-container: '#4a0e0e'
  on-primary-container: '#cc726d'
  inverse-primary: '#ffb3ad'
  secondary: '#775a19'
  on-secondary: '#ffffff'
  secondary-container: '#fed488'
  on-secondary-container: '#785a1a'
  tertiary: '#10100e'
  on-tertiary: '#ffffff'
  tertiary-container: '#252523'
  on-tertiary-container: '#8d8c89'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ad'
  on-primary-fixed: '#3d0506'
  on-primary-fixed-variant: '#77302d'
  secondary-fixed: '#ffdea5'
  secondary-fixed-dim: '#e9c176'
  on-secondary-fixed: '#261900'
  on-secondary-fixed-variant: '#5d4201'
  tertiary-fixed: '#e5e2de'
  tertiary-fixed-dim: '#c8c6c2'
  on-tertiary-fixed: '#1c1c1a'
  on-tertiary-fixed-variant: '#474744'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e2'
typography:
  display-ceremonial:
    fontFamily: Playfair Display
    fontSize: 42px
    fontWeight: '400'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-h1:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.3'
  headline-h2:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.4'
  body-main:
    fontFamily: DM Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-italic:
    fontFamily: Newsreader
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  label-ui:
    fontFamily: DM Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.0'
  kicker:
    fontFamily: DM Sans
    fontSize: 10px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 2px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  margin-safe: 24px
  gutter: 16px
---

## Brand & Style

This design system is anchored in a "Liquid Glass" editorial aesthetic—a fusion of high-end print journalism and ethereal, tactile digital surfaces. The personality is ceremonial, calm, and scholarly, moving away from the "neon-occult" tropes of typical astrology apps in favor of a sophisticated, museum-quality experience.

The visual style leans heavily into **Minimalism** with **Glassmorphic** influences. It prioritizes vast amounts of negative space to allow complex astrological charts to breathe. Surfaces feel like polished vellum or softly frosted glass layered over a warm, incandescent glow. Every interaction is designed to feel intentional and weighted, evoking the sensation of turning the pages of a heavy, linen-bound archive.

## Colors

The palette avoids the coldness of pure white and the harshness of pure black. 

- **Primary (Burgundy):** Reserved for "Hero" moments—the primary call-to-action or significant ritualistic anchors. 
- **Secondary (Muted Gold):** Used sparingly for "Kickers" (small overlines), active toggle states, and signals of premium insight.
- **Neutral (Stone-Grey):** All body copy and UI borders use this softened grey to maintain a low-contrast, easy-reading experience.
- **Surface (Warm-Grey):** Used for card backgrounds to provide a subtle lift from the cream base without breaking the warmth of the environment.

## Typography

The typographic scale is designed for deep reading. **Playfair Display** serves as the ceremonial voice, used for section headers and major astrological titles. **Newsreader** (Italic) provides an editorial "inner voice" for interpretations and personal insights, creating a clear distinction between data and wisdom.

**DM Sans** handles the functional "chrome" of the app. It is used for buttons, navigation, and data labels to ensure clarity and modern utility. The **Kicker** style is a critical brand element, always rendered in Muted Gold to categorize content sections with a precise, high-fashion flair.

## Layout & Spacing

This design system utilizes a **Fluid Grid** with generous safe margins (24px) to ensure content never feels cramped. The spacing rhythm is based on a 4px baseline, but defaults to larger increments (16px, 24px, 40px) to maintain the editorial breathability.

Alignment is primarily centered for ceremonial headers and interpretation blocks, while functional lists and data grids follow a traditional left-aligned structural grid. Elements are often grouped within "containers" that span the full width minus margins to create a clean, vertical scroll narrative.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Layers** and **Glassmorphism** rather than heavy shadows.

- **The Base:** The Cream (#FFFDF9) background acts as the canvas.
- **The Surface:** Cards use Warm-Grey (#F5F2EE) with a 1px hairline stroke in a slightly darker stone-grey (10% opacity).
- **The Shadow:** Use "Tiny Shadows"—a 2px blur with 5% opacity, intended only to provide a psychological lift rather than a physical one.
- **Glass Effects:** Overlays (modals or bottom sheets) should utilize a backdrop-blur (12px-20px) with a semi-transparent cream tint to maintain the "Liquid Glass" feeling, allowing the astrological charts beneath to shimmer through.

## Shapes

The shape language is sophisticated and soft. The standard corner radius is **16px (rounded-lg)** for content cards and primary containers. 

Interactive elements like buttons follow this 16px rule, while smaller UI components like tags or chips may use a fully pill-shaped (rounded-full) geometry to differentiate them from structural layout blocks. Hairline strokes (1px) must be applied to all defined shapes to maintain the crisp, editorial edges required by the "Liquid Glass" aesthetic.

## Components

- **Buttons:** Primary buttons are filled with Deep Burgundy (#4A0E0E) with DM Sans text in Cream. Secondary buttons use a 1px hairline stroke with no fill.
- **Cards:** These are the primary containers. They feature a 16px radius, a #F5F2EE fill, and a subtle stone-grey hairline border. Padding within cards is a mandatory 24px.
- **Inputs:** Text fields are minimal, consisting of a single bottom border or a very soft-tinted box with a 1px stroke. Labels use the "Kicker" style.
- **Astrological Charts:** Use hairline strokes for all planetary aspects. The muted gold accent should be used to highlight the user's specific placements or active transits.
- **Transitions:** All component states (hover, press, active) must transition over 150-250ms. Use a spring-curve for "magic moments," such as a card expanding or a new astrological insight appearing, to give a sense of organic movement.
- **Bottom Sheets:** Use heavy backdrop blurs and a soft grab-handle to reinforce the glass-like materiality of the interface.