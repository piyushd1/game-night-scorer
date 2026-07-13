## 2024-04-12 - Icon-only buttons lacking ARIA labels
**Learning:** The application uses several icon-only buttons via the Material Symbols font, which are visually clear but lack context for screen readers.
**Action:** Always verify icon-only buttons include an `aria-label` attribute explaining their function.

## 2024-05-26 - Keyboard navigation focus indicators
**Learning:** Tailwind CSS's preflight resets default browser focus outlines. When creating custom interactive elements (like `.btn-primary` and `.btn-secondary`), explicit `:focus-visible` styles must be added to ensure keyboard accessibility, otherwise they appear unfocusable to keyboard users.
**Action:** Always verify that custom buttons and interactive elements include explicitly defined `:focus-visible` styles.

## 2026-05-23 - Accessible Loading States
**Learning:** When replacing button text with a loading spinner (e.g. `<div class="spinner"></div>`), the button loses its accessible name. This causes screen readers to announce an empty button.
**Action:** Always include a visually hidden span with descriptive text (e.g., `<span class="sr-only">Loading...</span>`) alongside the spinner when injecting it into an interactive element's `innerHTML`.
## 2024-07-13 - Icon Button Focus Rings & Menu Accessibility
**Learning:** Tailwind icon buttons using `material-symbols-outlined` combined with `focus:outline-none` completely hide keyboard focus rings. Furthermore, dynamically rendered icon buttons serving as overlay triggers require `aria-haspopup="menu"` and dynamic `aria-expanded` state tracking to be screen-reader accessible.
**Action:** When adding or auditing icon buttons, explicitly remove `focus:outline-none` and apply Tailwind focus-visible utilities (e.g., `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`). For menu triggers, ensure `aria-haspopup="menu"` is set and `aria-expanded` is toggled programmatically when the overlay is shown/hidden.
