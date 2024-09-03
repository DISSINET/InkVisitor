## 1.4.0.3 Changelog [Sep 3, 2024]

### New Features:

- Added a button to link the URL in reference values (#2300).
- Enabled the ability to toggle any T validation rules on/off (#2260).
- Added buttons to append or replace validation rules from another T (#2269).
- Implemented auto-scroll to the T entity anchor in the annotator when a T is opened (#2274).

### Bug Fixes and Improvements:

- Developed a custom scroll solution to fix the statement list positioning issue (#2278).
- Disabled multiple reference entities in validation rules.
- Fixed page-up/page-down functionality in the annotator (#2271) and addressed the scrollbar click issue (#2277).
- Enhanced resizing functionality in the annotator (#2276).
- Added functionality to retain the annotator’s scroll position after a context change (#2293).
- Improved the rendering of the annotator menu—now shown only on mouse release (#2292).
- Provided more detailed information on TVERE warnings (#2290).
- Added the main page to the menu (#2258).
- Fixed a bug where an additional entities attribute was being stored in the database (#2279).

### Code Refactor:

- Upgraded several client packages.
- Updated some server tests.
- Updated the Node.js version.
- Upgraded pnpm versions.
- Fixed the tslib integration issue.
