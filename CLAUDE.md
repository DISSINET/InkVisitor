# Project guidance for Claude

## Git commits

- **Do not add Claude/Anthropic co-authorship to commits.** Never append a
  `Co-Authored-By: Claude ...` trailer (or any similar AI attribution) to commit
  messages or PR descriptions in this repository.
- Write commit messages in the normal style of the repo; reference the relevant
  GitHub issue number (e.g. `(#3001)`) when applicable.
- Only commit or push when explicitly asked.

## API endpoints

- **When adding a new server endpoint, ask which user roles may call it.** A
  route with no `acl_permissions` row is auto-created with `roles: []`, so every
  non-admin gets "Endpoint not allowed". Once agreed, seed the row in
  `packages/database/datasets/{default,production}/acl_permissions.json` and add
  it to `packages/database/scripts/jobs/fix-editor-entity-acl.ts` so running
  databases get it too.

## Comments

- **Describe the code, not the change.** A comment is read by someone who never
  saw the diff, so it must make sense without it. Avoid "otherwise ...",
  "without this ...", "now ...", "instead of ...", "used to ..." — these narrate
  a before/after state that does not exist for the reader.
  - Bad: `// beforeSave otherwise reloads all relations per entity — load once`
  - Good: `// every relation here shares one type, so one shared context serves
    all the saves`
- Keep the constraint that explains the code's shape, since that cannot be
  recovered by reading it: an unindexed query, a contract the caller must
  uphold, an event that fires more often than it looks. Drop the rest.
- Do not delete commented-out code. It may be kept intentionally for reference or future use.

## Code style

- Name React component interfaces the same as the component, not with a `Props` suffix.
- Always use styled-components instead of inline `style={}` props. Prefer creating
  new styled components in the corresponding `*Styles.tsx` file.
- Always use theme values for colors (including black text: `theme.color["black"]`),
  font sizes, etc. Never hardcode color values — the app supports dark mode
  and hardcoded colors break it.
- If adding icon, first check Theme/icons.ts if this or similar icon exists in our app
