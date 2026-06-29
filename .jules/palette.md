## 2024-04-12 - Icon-only buttons lacking ARIA labels
**Learning:** The application uses several icon-only buttons via the Material Symbols font, which are visually clear but lack context for screen readers.
**Action:** Always verify icon-only buttons include an `aria-label` attribute explaining their function.

## 2024-05-26 - Keyboard navigation focus indicators
**Learning:** Tailwind CSS's preflight resets default browser focus outlines. When creating custom interactive elements (like `.btn-primary` and `.btn-secondary`), explicit `:focus-visible` styles must be added to ensure keyboard accessibility, otherwise they appear unfocusable to keyboard users.
**Action:** Always verify that custom buttons and interactive elements include explicitly defined `:focus-visible` styles.

## 2026-05-23 - Accessible Loading States
**Learning:** When replacing button text with a loading spinner (e.g. `<div class="spinner"></div>`), the button loses its accessible name. This causes screen readers to announce an empty button.
**Action:** Always include a visually hidden span with descriptive text (e.g., `<span class="sr-only">Loading...</span>`) alongside the spinner when injecting it into an interactive element's `innerHTML`.
## 2024-06-25 - Fix focus styles on icon-only buttons
**Learning:** Tailwind's default preflight combined with `.material-symbols-outlined` buttons using `focus:outline-none` completely hides keyboard focus, breaking accessibility for interactive icon buttons like back, share, and clear.
**Action:** When working with `.material-symbols-outlined` interactive elements, never use `focus:outline-none`. Always apply explicit `:focus-visible` utility classes (`focus-visible:outline focus-visible:outline-primary focus-visible:outline-offset-2`) to guarantee keyboard navigation visibility.
