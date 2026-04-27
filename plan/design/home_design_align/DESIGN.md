# Design System Specification: The Ethereal Editorial

## 1. Overview & Creative North Star
**Creative North Star: "The Modern Mystic"**

This design system rejects the clinical, high-contrast rigidity of traditional utility apps. Instead, it adopts a "High-End Editorial" aesthetic—blending the tactile soul of a luxury print magazine with the fluid, intuitive nature of modern digital interfaces. 

To achieve this, we move away from standard grids and borders. We embrace **intentional asymmetry**, where celestial elements might break the container's edge, and **tonal layering**, where depth is felt rather than seen. The layout should breathe, using "Airy Spacing" to guide the user through their cosmic journey without the clutter of traditional UI chrome.

---

## 2. Colors & Surface Philosophy

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections or containers. Boundary definition must be achieved through:
1.  **Background Color Shifts:** Placing a `surface-container-low` card on a `surface` background.
2.  **Shadow Depth:** Using ambient, tinted shadows to lift an element.
3.  **Negative Space:** Using the spacing scale (e.g., `8` or `12`) to create mental groupings.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of fine, handmade paper.
*   **Base:** `surface` (#fdf9f4) acts as the canvas.
*   **Nesting:** Use `surface-container-lowest` (#ffffff) for high-importance interaction cards to make them "pop" against the cream base. Use `surface-container-high` (#ebe8e3) for recessed utility areas (like navigation bars).

### The "Glass & Gradient" Rule
To capture the "ethereal" quality, use **Glassmorphism** for floating elements (e.g., top navigation or floating action buttons). 
*   **Recipe:** `surface` color at 70% opacity + 20px Backdrop Blur.
*   **Signature Textures:** Use a linear gradient from `primary` (#874c38) to `primary-container` (#a4644e) for Hero CTAs to give them a "sun-baked" terracotta glow.

---

## 3. Typography: The Editorial Voice

The typography system relies on the interplay between the "Mystical Serif" and the "Grounded Sans."

*   **Display & Headline (Noto Serif):** These are your "Soul" fonts. Use `display-lg` for daily horoscopes and `headline-md` for section titles. The serif evokes wisdom and tradition.
*   **Body & Title (Plus Jakarta Sans):** These are your "Logic" fonts. They provide the modern grounding necessary for legibility. Use `body-md` for long-form readings and `label-md` for metadata.

**Hierarchy Note:** Always lead with high-contrast scale. A `display-md` headline should sit closely to a `body-sm` date label to create that "Signature" editorial look.

---

## 4. Elevation & Depth: Tonal Layering

Traditional "Material" shadows are too heavy for this system. We use **Ambient Shadows**.

*   **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card on a `surface-container-low` section. The slight color shift creates "Soft Lift."
*   **Floating Elements:** When a shadow is required, it must be tinted. Use `on-surface` (#1c1c19) at 4% opacity with a Blur of 32px and a Y-offset of 8px. It should look like a soft glow, not a dark drop-shadow.
*   **The Ghost Border Fallback:** If a container *must* have a stroke (e.g., for accessibility in forms), use `outline-variant` (#d8c2bb) at **15% opacity**. High-contrast borders are forbidden.

---

## 5. Components & Interface Elements

### Buttons
*   **Primary:** Terracotta (`primary`) background with `on-primary` text. Use `xl` (1.5rem) rounded corners.
*   **Secondary:** Sage Green (`secondary_container`) background with `on-secondary_container` text.
*   **Tertiary:** Muted Gold (`tertiary`) text only, with a `surface-bright` background on hover.

### Input Fields & Forms
*   **Style:** Minimalist. No bottom line or full box. Use a `surface-container-low` background with a subtle `sm` (0.25rem) corner radius.
*   **Focus State:** Transition the background to `surface-container-highest` and add a "Ghost Border" of `primary` at 20% opacity.

### Cards & Lists
*   **The No-Divider Rule:** Forbid 1px dividers. Use vertical spacing (`spacing.4` or `spacing.6`) to separate list items. 
*   **Astrology Insight Cards:** Use `surface-container-lowest` with an `xl` corner radius. Incorporate a delicate `tertiary_fixed` (#fddfa6) icon in the top right.

### Specialized Components
*   **Celestial Transit Chips:** Use `secondary_fixed` (Sage) for Mercury/Moon phases to provide a cooling contrast to the terracotta primary.
*   **Zodiac Progress Rings:** Use `muted gold` (`tertiary`) with a very thin stroke (2px) to denote moon cycles or birth chart progress.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts. Let an image or icon hang 10px off the edge of a card to create a "custom" feel.
*   **Do** use the `20` (7rem) spacing token for hero sections to create a sense of vastness and "Airy" luxury.
*   **Do** tint all neutrals. Ensure your "whites" are creamy (`surface`) and your "blacks" are warm charcoal (`on-surface`).

### Don’t
*   **Don’t** use pure black (#000000) or pure white (#FFFFFF) unless it's for `surface-container-lowest`.
*   **Don’t** use sharp 90-degree corners. Everything must feel "eroded" and soft, like a river stone.
*   **Don’t** crowd the interface. If a screen feels busy, increase the spacing tokens and reduce the number of visible containers. Let the typography do the work.

---

## 7. Token Summary Reference

| Category | Token | Value | Application |
| :--- | :--- | :--- | :--- |
| **Color** | `background` | #fdf9f4 | Primary canvas |
| **Color** | `primary` | #874c38 | Primary CTA (Terracotta) |
| **Color** | `secondary` | #58614e | Subtle accents (Sage) |
| **Color** | `tertiary` | #6e592c | Mystical highlights (Gold) |
| **Spacing** | `12` | 4rem | Large editorial gutters |
| **Rounding** | `xl` | 1.5rem | Cards and primary containers |
| **Type** | `display-lg` | Noto Serif / 3.5rem | Hero Headlines |
| **Type** | `body-md` | Plus Jakarta / 0.875rem | Reading content |