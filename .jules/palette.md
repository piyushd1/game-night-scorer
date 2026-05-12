## 2026-04-18 - Semantic Tabs for Bottom Navigation
**Learning:** Interactive elements like bottom navigation tabs should use semantic `<button>` elements with `role='tab'` instead of `<div>` to ensure screen readers properly announce them as interactive tabs rather than generic text blocks. Sighted keyboard users also need visible focus indicators, so when resetting native button styles with `outline: none`, a `:focus-visible` fallback must be provided.
**Action:** When implementing custom navigation or tab components, ensure the container has `role="tablist"`, items use `<button>` tags with `role="tab"` and `aria-selected` attributes, non-semantic icons have `aria-hidden="true"`, and focus states are clearly visible via `:focus-visible`.

## 2024-05-13 - Spinner innerHTML Screen Reader Context
**Learning:** Replacing an interactive element's `innerHTML` with a loading spinner `div` causes screen readers to encounter an empty/unlabeled button, completely dropping context for visually impaired users.
**Action:** When replacing interactive element contents with a loading spinner via `innerHTML`, ensure accessibility is maintained by including a visually hidden text element (e.g., `<span class="sr-only">Loading...</span>`) alongside the spinner.
