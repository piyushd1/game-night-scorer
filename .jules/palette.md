## 2024-04-12 - Icon-only buttons lacking ARIA labels
**Learning:** The application uses several icon-only buttons via the Material Symbols font, which are visually clear but lack context for screen readers.
**Action:** Always verify icon-only buttons include an `aria-label` attribute explaining their function.

## 2024-05-26 - Keyboard navigation focus indicators
**Learning:** Tailwind CSS's preflight resets default browser focus outlines. When creating custom interactive elements (like `.btn-primary` and `.btn-secondary`), explicit `:focus-visible` styles must be added to ensure keyboard accessibility, otherwise they appear unfocusable to keyboard users.
**Action:** Always verify that custom buttons and interactive elements include explicitly defined `:focus-visible` styles.

## 2026-05-23 - Accessible Loading States
**Learning:** When replacing button text with a loading spinner (e.g. `<div class="spinner"></div>`), the button loses its accessible name. This causes screen readers to announce an empty button.
**Action:** Always include a visually hidden span with descriptive text (e.g., `<span class="sr-only">Loading...</span>`) alongside the spinner when injecting it into an interactive element's `innerHTML`.
## 2025-02-12 - Missing ARIA state on interactive dropdown menus
**Learning:** Found an interactive trigger element (the host-menu toggle) that correctly managed visual display and focus shifting, but completely lacked state communication for screen readers (no `aria-haspopup` or `aria-expanded`). This meant assistive tech users wouldn't know the button controlled a menu or whether that menu was currently open.
**Action:** When working on interactive elements that toggle the visibility of menus, overlays, or popovers, ensure that `aria-haspopup="menu"` (or appropriate role) is set on the trigger, and dynamically update `aria-expanded` between `'true'` and `'false'` in sync with the visual state.
