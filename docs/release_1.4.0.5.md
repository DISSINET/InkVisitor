## 1.4.0.5 Changelog [Oct , 2024]

### New Features:

- Added a new spelling variants entity attribute (#2367)
- Added a (repeated) login security check
- Added auto redirect when logged-out
- Created deployment-specific login settings - guest mode, welcome text

### Bug Fixes and Improvements:

- Added statement list whole-row click interactivity (#2383)
- Fixed VETM warnings (#2380)
- Fixed `whereResourcesHasDocument` missing document entry
- Improved annotator menu - closing by Escape (#2319)
- Improved annotator InkV integration - dark mode switching (#2326) and highlighting
- Improved core annotator - fixed ENTER (#2320) and END keys (#2321), newline and blocks handling
- Made annotator hidden on default
- Fixed uncentered valency type
- Disabled statement items ordering for viewer rights (#2386)
- Increased `perPage` parameter for detail tables (#2339)
- Changed batch action label to `relate to superordinate entity` (#2097)

### Code Refactor:

- Updated webpack css files handling
- Added client eslintrc file
