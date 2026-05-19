## 2026-04-18 - Semantic Tabs for Bottom Navigation
**Learning:** Interactive elements like bottom navigation tabs should use semantic `<button>` elements with `role='tab'` instead of `<div>` to ensure screen readers properly announce them as interactive tabs rather than generic text blocks. Sighted keyboard users also need visible focus indicators, so when resetting native button styles with `outline: none`, a `:focus-visible` fallback must be provided.
**Action:** When implementing custom navigation or tab components, ensure the container has `role="tablist"`, items use `<button>` tags with `role="tab"` and `aria-selected` attributes, non-semantic icons have `aria-hidden="true"`, and focus states are clearly visible via `:focus-visible`.

## 2026-05-19 - Accessible Overlay Menus
**Learning:** Custom overlay menus (like the host menu) must include `role="dialog"` and `aria-modal="true"` attributes to be properly announced by screen readers. They also require active focus management: shifting focus to the first interactive element upon opening, and returning focus to the trigger element when closed via UI or the Escape key.
**Action:** When creating custom overlays or modals, always ensure proper ARIA roles are added to the container, bind an Escape key listener to close the overlay, and manage focus by saving `document.activeElement` on open and restoring it on close.
