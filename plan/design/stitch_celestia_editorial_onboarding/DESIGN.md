---
name: Celestia
colors:
  surface: '#fff8f5'
  surface-dim: '#e1d8d4'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf2ed'
  surface-container: '#f5ece7'
  surface-container-high: '#efe6e2'
  surface-container-highest: '#e9e1dc'
  on-surface: '#1e1b18'
  on-surface-variant: '#544341'
  inverse-surface: '#34302c'
  inverse-on-surface: '#f8efea'
  outline: '#877270'
  outline-variant: '#dac1bf'
  surface-tint: '#954742'
  primary: '#2a0002'
  on-primary: '#ffffff'
  primary-container: '#4a0e0e'
  on-primary-container: '#cc726d'
  inverse-primary: '#ffb3ad'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#0f100e'
  on-tertiary: '#ffffff'
  tertiary-container: '#242523'
  on-tertiary-container: '#8c8c89'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad7'
  primary-fixed-dim: '#ffb3ad'
  on-primary-fixed: '#3d0506'
  on-primary-fixed-variant: '#77302d'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#e4e2de'
  tertiary-fixed-dim: '#c8c6c3'
  on-tertiary-fixed: '#1b1c1a'
  on-tertiary-fixed-variant: '#474744'
  background: '#fff8f5'
  on-background: '#1e1b18'
  surface-variant: '#e9e1dc'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0em
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  ceremonial-label:
    fontFamily: Playfair Display
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
  utility-label:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 32px
  xl: 64px
  margin-mobile: 24px
  margin-desktop: 80px
  gutter: 24px
---

## Brand & Style
This design system is built upon the concept of "The Quiet Observation." It rejects the chaotic, neon-drenched aesthetics often associated with modern astrology in favor of a sophisticated, editorial atmosphere reminiscent of a high-end Sunday supplement or a literary journal. 

The personality is intellectual, serene, and intentional. It treats astrological insights not as entertainment, but as thoughtful prose. The visual style is a blend of **Modern Minimalism** and **Classical Editorial**, prioritizing legibility, "breathing room," and tactile elegance. By using generous whitespace and restrained ornamentation, the interface directs all focus to the quality of the content, evoking a sense of calm and clarity for the user.

## Colors
The palette is deeply rooted in traditional printing. The foundation is a warm, light-absorbing cream (#FDFBF7) that mimics premium paper stock, reducing eye strain and providing a soft backdrop for the content. 

Text and primary structural elements use a rich, deep burgundy (#4A0E0E), providing high contrast and an air of authority. A muted gold (#D4AF37) is used sparingly as a singular accent—intended to draw the eye to specific moments of celestial importance or primary actions—without breaking the calm, restrained aesthetic.

## Typography
Typography is the cornerstone of this design system. It employs a high-contrast pairing that balances tradition and modern utility.

**Playfair Display** is used for headlines and "ceremonial" moments. It should be typeset with careful attention to kerning. Large display sizes may use tighter tracking to emphasize the elegant stroke contrast.

**Inter** provides a clean, neutral counterpoint for body copy and functional labels. Its generous x-height and open apertures ensure maximum readability against the cream background. Maintain ample line-height (1.5–1.6) for body text to preserve the "airy" feel of an editorial column.

## Layout & Spacing
The layout philosophy follows a **Fixed Grid** approach inspired by print broadsheets. Content is centered within a controlled measure to prevent line lengths from becoming unreadable.

Generous margins (24px on mobile, upwards of 80px on desktop) act as a frame for the content. Horizontal "hairline" rules (0.5pt to 1pt) should be used to separate sections rather than heavy blocks or varied background colors. Vertical rhythm is strictly enforced using a 4px baseline grid, ensuring that even with significant whitespace, the page feels structured and balanced.

## Elevation & Depth
This design system avoids shadows entirely. Depth is communicated through **Tonal Layers** and **Hairline Outlines**.

Elements do not "float" above the page; they are either etched into it or rest flat upon it. To distinguish between containers, use a 0.5px border in Burgundy at 20% opacity, or a subtle shift in the background color to a slightly more "aged" cream. Layers should feel like stacked sheets of vellum—thin, tactile, and precise.

## Shapes
In keeping with the editorial Sunday-magazine style, the shape language is **Sharp**. Right angles convey a sense of architectural permanence and precision. 

Avoid rounded corners on buttons, cards, and input fields. The only exception is the use of perfect circles for specific celestial symbols or small decorative orbs, which should be rendered as thin outlines rather than solid fills.

## Components
### Buttons
*   **Ceremonial (Brand-Anchor):** Set in Playfair Display. These buttons feature a 1px Burgundy border, no fill, and centered text. They are used for primary transitions (e.g., "Enter the Archive"). On hover, a subtle Muted Gold underline appears.
*   **Utility:** Set in Inter. These are smaller, text-only or hairline-enclosed actions for functional tasks (e.g., "Save," "Share"). They are strictly utilitarian and should never compete with Ceremonial buttons.

### Cards & Containers
Cards are defined by 1px hairline borders in Burgundy. There are no background fills or shadows. Use internal padding of at least 24px (lg) to ensure the text within doesn't feel crowded.

### Inputs
Text inputs consist of a single bottom hairline in Burgundy. Labels are set in the 'utility-label' style, positioned above the line. There are no box enclosures.

### Iconography
Icons must be "hairline" style (0.5px to 1px stroke weight). They should be used only when text alone is insufficient. Icons should be abstracted and geometric, never illustrative or "cosmic."

### Ornaments
Small, restrained decorative elements—such as a single gold dot or a thin vertical line—can be used to mark the end of an article or the transition between horoscope sections, mirroring the stylistic flourishes of a luxury magazine.