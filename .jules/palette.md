## 2024-04-12 - Icon-only buttons lacking ARIA labels
**Learning:** The application uses several icon-only buttons via the Material Symbols font, which are visually clear but lack context for screen readers.
**Action:** Always verify icon-only buttons include an `aria-label` attribute explaining their function.

## 2024-05-26 - Keyboard navigation focus indicators
**Learning:** Tailwind CSS's preflight resets default browser focus outlines. When creating custom interactive elements (like `.btn-primary` and `.btn-secondary`), explicit `:focus-visible` styles must be added to ensure keyboard accessibility, otherwise they appear unfocusable to keyboard users.
**Action:** Always verify that custom buttons and interactive elements include explicitly defined `:focus-visible` styles.

## 2026-05-23 - Accessible Loading States
**Learning:** When replacing button text with a loading spinner (e.g. `<div class="spinner"></div>`), the button loses its accessible name. This causes screen readers to announce an empty button.
**Action:** Always include a visually hidden span with descriptive text (e.g., `<span class="sr-only">Loading...</span>`) alongside the spinner when injecting it into an interactive element's `innerHTML`.
## 2024-05-31 - Improved QR Modal Accessibility
**Learning:** Custom Javascript overlays/modals in this SPA pattern often lack native dialog accessibility features (`role`, `aria-modal`) and fail to manage focus correctly when toggled via `display: block`/`display: none`. Furthermore, when adding global event listeners (like `Escape` key handlers) within a function that might be called multiple times, they must be guarded (e.g., using a `_bound` variable) to prevent duplicate event bindings.
**Action:** When creating or modifying custom overlays, ensure they include `role="dialog"` and `aria-modal="true"`. Use `requestAnimationFrame` to shift focus to the first interactive element upon opening, save the triggering element to return focus upon closing, and guard global event listeners to ensure they are only attached once.
