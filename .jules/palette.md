## 2024-04-12 - Icon-only buttons lacking ARIA labels
**Learning:** The application uses several icon-only buttons via the Material Symbols font, which are visually clear but lack context for screen readers.
**Action:** Always verify icon-only buttons include an `aria-label` attribute explaining their function.

## 2024-05-26 - Keyboard navigation focus indicators
**Learning:** Tailwind CSS's preflight resets default browser focus outlines. When creating custom interactive elements (like `.btn-primary` and `.btn-secondary`), explicit `:focus-visible` styles must be added to ensure keyboard accessibility, otherwise they appear unfocusable to keyboard users.
**Action:** Always verify that custom buttons and interactive elements include explicitly defined `:focus-visible` styles.

## 2026-05-23 - Accessible Loading States
**Learning:** When replacing button text with a loading spinner (e.g. `<div class="spinner"></div>`), the button loses its accessible name. This causes screen readers to announce an empty button.
**Action:** Always include a visually hidden span with descriptive text (e.g., `<span class="sr-only">Loading...</span>`) alongside the spinner when injecting it into an interactive element's `innerHTML`.
## 2024-06-25 - Dynamic Counters Screen Reader Accessibility
**Learning:** When using custom counter buttons (+ / -) that dynamically update adjacent text nodes in Vanilla JS, screen readers will not announce the updated values unless the container elements use `aria-live="polite"`. Furthermore, textual symbols like `+` and `-` in buttons may not be read descriptively enough.
**Action:** Always add `aria-live="polite"` to dynamic text spans/divs updated by scripts. Always add explicit `aria-label` attributes to icon or symbol-only increment/decrement buttons.
