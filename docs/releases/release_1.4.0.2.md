## 1.4.0.2 Changelog [Jul 24, 2024]

### New Features:

- Added batch remove action. (#2233)
- Created new batch actions for relations ("relate ti SOE" and "classify as" ) (#2239)
- Added annotatot state (open/close) to the URL (#2236)
- Added in-entity-tag button to open statement from searchbox (#2249)
- Automatically show new row for a reference and prop in detail (#2254)

### Bug Fixes and Improvements:

- Improved caching of tree
- Fixed visuals of Entity create modal
- Fixed double-fetching entities for suggester (#2240)
- Fixed negative annotator x-line selector
- Refactored re-rendering of Territory tree box

### Code Refactor:

- Used partial interface for handling changes in Entities
- Removed (not-used) swagger files
- Users are now not deleted, only tagged appropriately
- Updated DB values in env files
- Cleaned tsconfigs
