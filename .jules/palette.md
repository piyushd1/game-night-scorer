## 2026-05-02 - ARIA Hidden for Material Symbols
**Learning:** Material Symbols use text ligatures (e.g., "casino", "arrow_forward") to render icons. Without `aria-hidden="true"`, screen readers read these ligatures out loud alongside the actual text (e.g., "casino NEW GAME").
**Action:** Always add `aria-hidden="true"` to pure decorative `material-symbols-outlined` icon spans to prevent screen readers from announcing the ligature string.
