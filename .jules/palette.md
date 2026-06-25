## 2024-04-12 - Icon-only buttons lacking ARIA labels
**Learning:** The application uses several icon-only buttons via the Material Symbols font, which are visually clear but lack context for screen readers.
**Action:** Always verify icon-only buttons include an `aria-label` attribute explaining their function.

## 2024-05-26 - Keyboard navigation focus indicators
**Learning:** Tailwind CSS's preflight resets default browser focus outlines. When creating custom interactive elements (like `.btn-primary` and `.btn-secondary`), explicit `:focus-visible` styles must be added to ensure keyboard accessibility, otherwise they appear unfocusable to keyboard users.
**Action:** Always verify that custom buttons and interactive elements include explicitly defined `:focus-visible` styles.

## 2026-05-23 - Accessible Loading States
**Learning:** When replacing button text with a loading spinner (e.g. `<div class="spinner"></div>`), the button loses its accessible name. This causes screen readers to announce an empty button.
**Action:** Always include a visually hidden span with descriptive text (e.g., `<span class="sr-only">Loading...</span>`) alongside the spinner when injecting it into an interactive element's `innerHTML`.

## 2024-06-25 - Icon-only buttons lack focus indicators
**Learning:** Many interactive icon-only buttons using the `material-symbols-outlined` class had `focus:outline-none` or lacked focus styling entirely, rendering them invisible to keyboard navigation. Tailwind's preflight resets focus outlines, and `focus:outline-none` explicitly suppresses it.
**Action:** When working with interactive elements (like `.material-symbols-outlined` icon buttons) using Tailwind CSS, ensure they do not use `focus:outline-none` which disables keyboard focus visibility. Remove this anti-pattern and apply explicit Tailwind `:focus-visible` utilities (e.g., `focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`) to guarantee accessibility.
