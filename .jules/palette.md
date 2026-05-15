## 2026-04-18 - Semantic Tabs for Bottom Navigation
**Learning:** Interactive elements like bottom navigation tabs should use semantic `<button>` elements with `role='tab'` instead of `<div>` to ensure screen readers properly announce them as interactive tabs rather than generic text blocks. Sighted keyboard users also need visible focus indicators, so when resetting native button styles with `outline: none`, a `:focus-visible` fallback must be provided.
**Action:** When implementing custom navigation or tab components, ensure the container has `role="tablist"`, items use `<button>` tags with `role="tab"` and `aria-selected` attributes, non-semantic icons have `aria-hidden="true"`, and focus states are clearly visible via `:focus-visible`.

## 2026-04-19 - Accessible Loading Spinners when replacing innerHTML
**Learning:** When dynamically replacing button content with a loading spinner via `innerHTML`, screen readers won't announce the loading state unless explicitly provided. Visually hidden text using classes like `sr-only` is required alongside the spinner element to convey the "Loading..." state to assistive technologies.
**Action:** Always include a visually hidden span (e.g., `<span class="sr-only">Loading...</span>`) alongside decorative elements like `<div class="spinner"></div>` when replacing interactive element content.
