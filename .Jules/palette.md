## 2024-04-12 - Icon-only buttons lacking ARIA labels
**Learning:** The application uses several icon-only buttons via the Material Symbols font, which are visually clear but lack context for screen readers.
**Action:** Always verify icon-only buttons include an `aria-label` attribute explaining their function.

## 2024-05-22 - Replacing interactive content with loading spinners
**Learning:** When a button enters a loading state and its innerHTML is replaced with just a spinner (`<div class="spinner"></div>`), it loses context for screen reader users as the button text disappears.
**Action:** Ensure loading spinners replacing text in interactive elements always include visually hidden text (e.g., `<span class="sr-only">Loading...</span>`) to maintain accessibility context.
