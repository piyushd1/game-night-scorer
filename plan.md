1. **Change Spinner CSS:**
   - In `public/css/app.css`, change the `.spinner` class so that `border-top-color` is set to `currentColor` instead of hardcoded `#000000`, and the border color itself has an opacity so that it looks good on both black and white backgrounds.
   - This improves UX by making the spinner legible on `btn-primary` (black background) and `btn-secondary` (white background).

2. **Add Missing ARIA Labels:**
   - Ensure the modal back button and any other unlabelled icon buttons have `aria-label`s.
   - We already checked a lot of buttons, most have aria labels.

3. **Pre-commit Checks:**
   - Call `pre_commit_instructions` and follow steps to verify code before committing.

4. **Submit:**
   - Submit the PR.
