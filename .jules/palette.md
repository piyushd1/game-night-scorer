## 2024-04-12 - Icon-only buttons lacking ARIA labels
**Learning:** The application uses several icon-only buttons via the Material Symbols font, which are visually clear but lack context for screen readers.
**Action:** Always verify icon-only buttons include an `aria-label` attribute explaining their function.

## 2024-05-26 - Keyboard navigation focus indicators
**Learning:** Tailwind CSS's preflight resets default browser focus outlines. When creating custom interactive elements (like `.btn-primary` and `.btn-secondary`), explicit `:focus-visible` styles must be added to ensure keyboard accessibility, otherwise they appear unfocusable to keyboard users.
**Action:** Always verify that custom buttons and interactive elements include explicitly defined `:focus-visible` styles.

## 2026-05-23 - Accessible Loading States
**Learning:** When replacing button text with a loading spinner (e.g. `<div class="spinner"></div>`), the button loses its accessible name. This causes screen readers to announce an empty button.
**Action:** Always include a visually hidden span with descriptive text (e.g., `<span class="sr-only">Loading...</span>`) alongside the spinner when injecting it into an interactive element's `innerHTML`.

## 2024-07-05 - Missing ARIA attributes on interactive menus
**Learning:** Interactive UI elements that control dropdowns or overlay menus (like the 3-dot trigger in the host menu) often lack the `aria-haspopup` and `aria-expanded` attributes, which leaves screen reader users without context about the element's purpose and current state.
**Action:** When implementing or fixing interactive trigger elements that reveal or hide menus, always ensure they include `aria-haspopup="menu"` and dynamically toggle `aria-expanded` between `'true'` and `'false'`.
