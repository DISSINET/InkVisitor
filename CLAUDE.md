# Project guidance for Claude

## Git commits

- **Do not add Claude/Anthropic co-authorship to commits.** Never append a
  `Co-Authored-By: Claude ...` trailer (or any similar AI attribution) to commit
  messages or PR descriptions in this repository.
- Write commit messages in the normal style of the repo; reference the relevant
  GitHub issue number (e.g. `(#3001)`) when applicable.
- Only commit or push when explicitly asked.

## Code style

- Do not delete commented-out code. It may be kept intentionally for reference or future use.
- Name React component interfaces the same as the component, not with a `Props` suffix.
- Always use styled-components instead of inline `style={}` props. Prefer creating
  new styled components in the corresponding `*Styles.tsx` file.
- Always use theme values for colors (including black text: `theme.color["black"]`),
  font sizes, etc. Never hardcode color values — the app supports dark mode
  and hardcoded colors break it.
- If adding icon, first check Theme/icons.ts if this or similar icon exists in our app
