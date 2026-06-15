## 2024-04-12 - Icon-only buttons lacking ARIA labels
**Learning:** The application uses several icon-only buttons via the Material Symbols font, which are visually clear but lack context for screen readers.
**Action:** Always verify icon-only buttons include an `aria-label` attribute explaining their function.

## 2024-05-26 - Keyboard navigation focus indicators
**Learning:** Tailwind CSS's preflight resets default browser focus outlines. When creating custom interactive elements (like `.btn-primary` and `.btn-secondary`), explicit `:focus-visible` styles must be added to ensure keyboard accessibility, otherwise they appear unfocusable to keyboard users.
**Action:** Always verify that custom buttons and interactive elements include explicitly defined `:focus-visible` styles.

## 2026-05-23 - Accessible Loading States
**Learning:** When replacing button text with a loading spinner (e.g. `<div class="spinner"></div>`), the button loses its accessible name. This causes screen readers to announce an empty button.
**Action:** Always include a visually hidden span with descriptive text (e.g., `<span class="sr-only">Loading...</span>`) alongside the spinner when injecting it into an interactive element's `innerHTML`.

## 2024-05-27 - Dialog Accessibility and Focus Management
**Learning:** Custom overlay menus and modals (like the QR code modal) in this app often lack proper dialog semantics and focus management. Without `role="dialog"`, `aria-modal="true"`, an accessible name, and explicit focus shifting (via `requestAnimationFrame`), screen reader and keyboard users lose context when the modal opens and closes.
**Action:** Always verify that newly created or modified custom overlays include `role="dialog"`, `aria-modal="true"`, an appropriate `aria-label`, manage focus upon opening (e.g., to the close button or first interactive element), trap focus or support closure via the `Escape` key, and return focus to the trigger element when closed.
