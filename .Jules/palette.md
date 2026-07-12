## 2024-04-12 - Icon-only buttons lacking ARIA labels
**Learning:** The application uses several icon-only buttons via the Material Symbols font, which are visually clear but lack context for screen readers.
**Action:** Always verify icon-only buttons include an `aria-label` attribute explaining their function.

## 2024-07-12 - Missing ARIA state on menu triggers
**Learning:** Interactive elements that trigger dropdown menus or overlays (like the host menu) lack `aria-haspopup` and dynamic `aria-expanded` attributes, making it difficult for screen reader users to understand their behavior and current state.
**Action:** When implementing or fixing interactive trigger elements that reveal or hide content, always add `aria-haspopup="menu"` and dynamically toggle `aria-expanded` between `'true'` and `'false'`.
