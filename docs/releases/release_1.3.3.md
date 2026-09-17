## 1.3.3 Changelog [Sep 30 2023]

### New features:

- Added functionality for filtering Territories in the Territory tree.
- Redesigned the Territory tree for improved user experience.
- Integrated enhanced warnings for Entities and Statements.
- Introduced feature to copy Statement ID directly from the Editor box. (#1727)
- Generalized SOL relations to SOE relations. (#1832)
- Introduced new modality: Expectation. (#1830)
- Enabled creation of cross-entity-type Identification. (#1735)
- Introduced feature to combine two SYN clouds. (#1774)
- Reworked Props design in Editor. (#1750, #1751)
- Enhanced password management system. (#1789)
- Improved the process of assigning Ts to users. (#1833)
- Implemented automatic pause of connection to the DB during internet outages. (#1802)
- Enhanced the Statement tag tooltip. (#1824)

### Bug fixes:

- Fixed issue where username was not updating after being changed in user settings. (#1729)
- Removed unnecessary scroll in an empty Actions list. (#1744)
- Addressed issues with some inversed relations not displaying. (#1740)
- Ensured C and A no longer have the IDE Relation (Identification). (#1749)
- Fixed issue with invalid Territory moves. (#1745)
- Corrected alignment of expanded meta props. (#1746)
- Prevented copying of legacyId parameter and inversed relations. (#1752, #1753)
- Improved UI by hiding scrollbars when not in use. (#1758)
- Addressed issues with Graph tooltip display. (#1777)
- Removed duplicates in array fields within data. (#1787)
- Addressed unavailability of Value class for creation. (#1795)
- Fixed bug where deleting a favorited T invalidates the model. (#1818)
- Resolved issue with T template incorrectly applying when parent is missing. (#1834)
- Fixed default select value error in the "Create entity" modal. (#1838)
- Addressed issues in handling audits for deleted users. (#1797)

### Code refactor:

- Transitioned to pnpm for bundling and package management. (#1767)
- Standardized npm scripts across packages (client, server, database). (#1767)
- Optimized RethinkDB by using pool connection to reduce overhead. (#1756)
- Implemented package caching in CI for efficiency. (#1772)
- Addressed ts-ignore checks for react-dnd. (#1773)
- Upgraded React-table to version 7. (#1779)
- Completed upgrade of React-router to its latest version.
