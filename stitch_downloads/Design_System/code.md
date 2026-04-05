# Design System Specification: Occupational Excellence

## 1. Overview & Creative North Star
### The Creative North Star: "The Architectural Guardian"
In the high-stakes world of NR-01 compliance, design is not merely aesthetic—it is a tool for risk mitigation. This design system moves away from the "disposable" feel of standard SaaS platforms toward a "Digital Ledger" aesthetic. We utilize high-contrast editorial typography and architectural layering to create an atmosphere of absolute authority and calm precision.

The system breaks the "template" look by favoring **intentional asymmetry** and **tonal depth** over rigid grids. By utilizing expansive whitespace and a "No-Line" philosophy, we ensure that the focus remains entirely on critical safety data, making the complex feel manageable and the urgent feel clear.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the authority of deep obsidian blues, balanced by a clinical, high-focus environment of tiered whites and greys.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section off content. Structural boundaries must be defined solely through background color shifts or subtle tonal transitions.
*   *Implementation:* A `surface-container-low` section sitting on a `surface` background is the standard for content separation.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine paper.
*   **Base:** `surface` (#f7f9fb)
*   **Sectioning:** `surface-container-low` (#f2f4f6)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff)
*   **Elevated Overlays:** `surface-container-high` (#e6e8ea)

### The "Glass & Gradient" Rule
To elevate the "enterprise-grade" feel, use **Glassmorphism** for floating elements (like side navigation or floating action bars) using `surface-variant` with a 60% opacity and a 20px backdrop-blur. 
*   **Signature Textures:** For primary CTAs and Hero headers, use a subtle linear gradient from `primary` (#091426) to `primary-container` (#1e293b) at a 135-degree angle. This adds "visual soul" and a premium finish that flat hex codes cannot replicate.

---

## 3. Typography
We use a dual-typeface system to balance editorial sophistication with functional clarity.

*   **Display & Headlines (Manrope):** Chosen for its geometric stability and modern "architectural" feel. Use `display-lg` through `headline-sm` for high-level data summaries and page titles.
*   **Body & Labels (Inter):** The workhorse of the system. Inter’s tall x-height ensures that dense compliance documentation remains legible even at `body-sm` (0.75rem).
*   **Hierarchy as Authority:** Use extreme weight contrast. Pair a `headline-lg` (Bold, Primary) with a `body-md` (Regular, On-Surface-Variant) to create an immediate sense of information importance.

---

## 4. Elevation & Depth
Traditional drop shadows are too "software-standard." We utilize **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by "stacking." Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural lift.
*   **Ambient Shadows:** If a "floating" effect is required (e.g., a modal), use a diffused shadow: `box-shadow: 0 20px 40px rgba(9, 20, 38, 0.05)`. Note the tint—the shadow uses the `primary` hue, not black, to mimic natural ambient light.
*   **The "Ghost Border" Fallback:** For high-density data tables where separation is critical, use a "Ghost Border": `outline-variant` (#c5c6cd) at 15% opacity. Never use 100% opaque lines.

---

## 5. Components

### Data Monitoring Tables
*   **Style:** Forbid the use of vertical or horizontal divider lines.
*   **Layout:** Use alternating row fills (`surface` vs `surface-container-low`) or simply generous vertical padding (16px–24px) to define rows.
*   **Header:** `label-md` in uppercase with 0.05em letter spacing for an "archival" look.

### Status Indicators (Compliance Badges)
*   **Compliant:** `on-primary-fixed-variant` text on a `primary-fixed` background.
*   **Pending/Warning:** `on-tertiary-container` text on a `tertiary-fixed` background.
*   **Expired/Critical:** `on-error-container` text on an `error-container` background.
*   **Shape:** Use `rounded-full` for status pills to contrast against the `rounded-md` (0.375rem) corners of the main containers.

### Progress & Certification
*   **Progress Bars:** Use a "Dual Tone" approach. The track is `surface-container-highest`, and the indicator is a gradient of `primary` to `primary-container`.
*   **Input Fields:** Ghost-styled. No bottom line or full border. Use `surface-container-low` as a subtle fill with a 2px bottom-focus state in `primary`.

### Navigation
*   **Side Rail:** Use `surface-container-lowest` with a "Ghost Border" on the right. Active states should not use a box; use a 4px vertical "pill" of `primary` on the far left of the active menu item.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use whitespace as a structural element. If a section feels cluttered, increase the padding rather than adding a border.
*   **DO** use "Primary Fixed" colors for background chips to keep the UI light and modern while maintaining the color's meaning.
*   **DO** prioritize `Manrope` for all numerical data in dashboards; its geometric nature feels more "calculated" and precise.

### Don't
*   **DON'T** use pure black (#000000) for text. Use `on-surface` (#191c1e) to maintain a premium, ink-on-paper feel.
*   **DON'T** use standard "Material Design" ripples for buttons. Use subtle opacity shifts (e.g., 90% opacity on hover) to maintain a serious, enterprise atmosphere.
*   **DON'T** use rounded corners larger than `xl` (0.75rem) for main containers. Too much roundness feels "bubbly" and diminishes the serious nature of safety compliance.