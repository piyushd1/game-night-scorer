## 2026-04-18 - Semantic Tabs for Bottom Navigation
**Learning:** Interactive elements like bottom navigation tabs should use semantic `<button>` elements with `role='tab'` instead of `<div>` to ensure screen readers properly announce them as interactive tabs rather than generic text blocks. Sighted keyboard users also need visible focus indicators, so when resetting native button styles with `outline: none`, a `:focus-visible` fallback must be provided.
**Action:** When implementing custom navigation or tab components, ensure the container has `role="tablist"`, items use `<button>` tags with `role="tab"` and `aria-selected` attributes, non-semantic icons have `aria-hidden="true"`, and focus states are clearly visible via `:focus-visible`.

## 2024-05-04 - Screen Reader Compatibility for Material Symbols
**Learning:** Using text-based icon fonts like `material-symbols-outlined` causes screen readers to read the ligature string (e.g., "casino" or "group") out loud if the element isn't hidden from them.
**Action:** Always add `aria-hidden="true"` to `span.material-symbols-outlined` elements when they are used decoratively or within buttons that already have accessible text or labels.
