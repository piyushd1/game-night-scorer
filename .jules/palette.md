## 2026-04-18 - Semantic Tabs for Bottom Navigation
**Learning:** Interactive elements like bottom navigation tabs should use semantic `<button>` elements with `role='tab'` instead of `<div>` to ensure screen readers properly announce them as interactive tabs rather than generic text blocks. Sighted keyboard users also need visible focus indicators, so when resetting native button styles with `outline: none`, a `:focus-visible` fallback must be provided.
**Action:** When implementing custom navigation or tab components, ensure the container has `role="tablist"`, items use `<button>` tags with `role="tab"` and `aria-selected` attributes, non-semantic icons have `aria-hidden="true"`, and focus states are clearly visible via `:focus-visible`.

## 2026-04-19 - Explicit Label and Helper Text Linking
**Learning:** Relying solely on visual proximity for form labels and helper text (like 'MIN 1') is insufficient for screen readers. Explicitly linking labels using the `for` attribute and associating helper text with inputs using `aria-describedby` ensures assistive technologies properly announce the full context of the input field.
**Action:** When creating form inputs, always connect the `<label>` using `for` to the input's `id`, and if there's supplemental helper text, give it an `id` and link it to the input via `aria-describedby`.
