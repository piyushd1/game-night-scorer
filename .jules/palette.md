## 2024-04-12 - Icon-only buttons lacking ARIA labels
**Learning:** The application uses several icon-only buttons via the Material Symbols font, which are visually clear but lack context for screen readers.
**Action:** Always verify icon-only buttons include an `aria-label` attribute explaining their function.

## 2024-05-26 - Keyboard navigation focus indicators
**Learning:** Tailwind CSS's preflight resets default browser focus outlines. When creating custom interactive elements (like `.btn-primary` and `.btn-secondary`), explicit `:focus-visible` styles must be added to ensure keyboard accessibility, otherwise they appear unfocusable to keyboard users.
**Action:** Always verify that custom buttons and interactive elements include explicitly defined `:focus-visible` styles.

## 2026-05-23 - Accessible Loading States
**Learning:** When replacing button text with a loading spinner (e.g. `<div class="spinner"></div>`), the button loses its accessible name. This causes screen readers to announce an empty button.
**Action:** Always include a visually hidden span with descriptive text (e.g., `<span class="sr-only">Loading...</span>`) alongside the spinner when injecting it into an interactive element's `innerHTML`.

## 2024-06-15 - Testing Tailwind Preflight Focus Styles
**Learning:** Tailwind's preflight reset strips default browser focus outlines, requiring explicit `focus-visible` styles to be manually added to all interactive elements to maintain basic keyboard accessibility, especially icon-only utility buttons which are often overlooked compared to primary styled buttons. Playwright testing often requires bypassing Firebase and directly injecting mocked DOM states using `page.evaluate` to reliably verify these transient visual states like focus rings.
**Action:** Always verify keyboard accessibility (`Tab` focus rings) on every custom or icon-only interactive element when using Tailwind, particularly when they don't inherit a global `.btn` style class. Ensure Playwright scripts simulate actual `Tab` key presses to verify `focus-visible` logic.
