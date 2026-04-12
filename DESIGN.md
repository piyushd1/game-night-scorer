# Design System Strategy: The Analog Architect

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Analog Architect."** This system rejects the "bubbled," soft aesthetic of modern OS defaults in favor of a precision-engineered, editorial look inspired by mid-century blueprinting and high-end Swiss typography. 

By utilizing **Brutalist-adjacent minimalism**, we emphasize the raw structure of the data. We break the "template" look through **intentional asymmetry**: score totals may be offset to the far right, while player names sit tight-left, separated by expansive negative space. The goal is to make a digital scoring app feel like a premium, tactile artifact—as intentional and well-designed as the board games it tracks.

---

## 2. Colors & Tonal Depth
The palette is rooted in high-contrast neutrality, punctuated by aggressive, pure-pigment accents.

*   **Primary (#1A1A1A):** The ink. Used for authoritative text and primary structural elements.
*   **Background (#F4F4F2):** The paper. A warm, off-white that prevents eye strain during long gaming sessions.
*   **Surface (#FFFFFF):** The highlight. Reserved for active input areas or cards that need to "pop" against the background.
*   **Player Accents:** (#0047FF, #FF2E2E, #FFB800, #00B85C). Use these sparingly as "highlighters"—1px underlines, small status pips, or active player indicators.

### The "No-Shadow" Mandate
Traditional elevation (shadows) is strictly prohibited. Depth is achieved through **Tonal Layering**:
*   **Nesting:** Place a `surface_container_lowest` (#FFFFFF) input field inside a `surface_container_low` (#F4F4F2) card to define hierarchy.
*   **The 1px Rule:** Unlike standard editorial systems, we lean into our Brutalist roots using `outline` (#777777) for 1px solid borders. However, these must be used to create a "grid" feel, not just to box things in. If a section doesn't require a hard boundary, use a shift to `surface_container_high` (#E8E8E6) instead.

---

## 3. Typography
We use a dual-typeface system to distinguish between human-readable content and machine-perfect data.

*   **Headings & Body (Satoshi/Manrope):** The "Human" element. Satoshi provides a geometric yet approachable feel. We use heavy weights (Bold/Black) for headlines to anchor the page.
*   **Numbers & Data (Space Mono):** The "Engine" element. All scores, timers, and mathematical data must use Space Mono. The fixed-width nature ensures that shifting scores don't cause layout jumps and reinforces the "technical instrument" aesthetic.

**Hierarchy Strategy:**
*   **Display-LG (3.5rem):** Reserved for the winning player’s final score.
*   **Headline-MD (1.75rem):** Game titles and "Game Over" states.
*   **Label-MD (Space Mono, 0.75rem):** All secondary data (e.g., "Round 4", "Avg Score").

---

## 4. Elevation & Depth (The Monolithic Approach)
This system achieves "lift" through contrast and edge definition rather than light physics.

*   **The Layering Principle:** Use the `surface_container` tiers to stack information. A search bar in a rulebook should be `surface_container_highest` (#E2E3E1) to sit "above" the text content.
*   **Hard Edges:** All containers must adhere to a `0px` to `4px` corner radius. `0px` is preferred for primary layout blocks (Header, Footer, Navigation) to maintain a monolithic, architectural feel.
*   **The Ghost Border:** For searchable interfaces, use a 1px border of `outline_variant` (#C6C6C6). It should feel like a hairline trigger—precise and thin.

---

## 5. Components

### Buttons
*   **Primary:** `primary` (#000000) background, `on_primary` (#FFFFFF) text. 0px radius. High-contrast.
*   **Secondary:** `surface` (#FFFFFF) background, 1px `primary` border. 
*   **Tertiary:** No border, all caps Satoshi Bold, 1px underline.

### Input Fields
*   **Score Input:** Large Space Mono text. Bottom-border only (2px `primary`) to mimic a physical ledger.
*   **Search:** 1px `outline` box, 0px radius. Use `surface_container_low` as the internal fill to distinguish from the main page background.

### Cards & Lists
*   **Scoreboard Row:** Forbid the use of horizontal dividers where possible. Instead, use a `surface_container_high` background for every second row (zebra-striping) to maintain legibility without cluttering the UI with lines.
*   **Rulebook Snippets:** Use "Asymmetric Padding." Give the left side 24px padding and the right side 40px to create an editorial, magazine-style layout.

### Player Tokens (Custom Component)
*   Instead of avatars, use 1px bordered boxes with the player's accent color as a top-border "accent bar" (3px height). This keeps the focus on the data while providing immediate color recognition.

---

## 6. Do's and Don'ts

### Do:
*   **Use Mono for Math:** Always use Space Mono for anything that can be added, subtracted, or timed.
*   **Embrace the Edge:** Keep corner radii at 0px for 90% of the UI. Use 4px only for small interactive elements like Chips or Checkboxes to make them "touchable."
*   **Aggressive White Space:** If a screen feels cluttered, do not add borders. Add 16px of additional margin.

### Don't:
*   **No Gradients/Shadows:** These are strictly forbidden. The UI must feel like it was printed on a high-end laser printer.
*   **No Soft Colors:** Avoid pastels. Use the neutral palette for 90% of the app and the pure Player Accents for the remaining 10%.
*   **No Centered Text in Lists:** Keep data left-aligned or right-aligned to create "columns of intent." Centered text breaks the architectural grid.