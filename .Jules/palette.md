## 2024-04-12 - Icon-only buttons lacking ARIA labels
**Learning:** The application uses several icon-only buttons via the Material Symbols font, which are visually clear but lack context for screen readers.
**Action:** Always verify icon-only buttons include an `aria-label` attribute explaining their function.

## 2024-04-14 - Generic divs for navigation buttons break keyboard accessibility
**Learning:** Using generic `<div>` elements for navigation (like bottom-nav items) breaks keyboard accessibility since they aren't naturally focusable and don't natively respond to 'Enter' or 'Space' keypresses.
**Action:** Always use semantic `<button>` elements for interactive navigation items that trigger JavaScript actions to ensure native keyboard focusability and interaction.
