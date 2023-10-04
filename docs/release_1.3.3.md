## 1.3.3 Changelog [Sep 30 2023]

### New features:

- Filtering Territories functionality in the Territory tree
- Improved design for Territory tree
- Integrated improveded warnings for Entities and Statements
- Enabled copying Statement ID from Editor box #1727
- SOL relations generalized to SOE relations #1832
- New modality: Expectation #1830
- Enabled creating cross-entity-type Identification #1735
- Enabled combining two SYN clouds #1774
- Props design reworked #1750 #17 51
- Improved password management #1789
- Improved assigning T to users #1833
- Pause connection to the DB on no internet # 1802
- Statement tag tooltip improved #1824

### Bugs:

- Username not refreshed when changed in user settings #1729
- Removed unnecessary scroll in empty Actions list #1744
- Some inversed relations not showing up #1740
- C and A should not have IDE Relation (Identification) #1749
- Territory invalid move #1745
- Expanded meta props incorrectly aligned #1746
- Avoid copying legacyId parameter #1752 and inversed relations #1753
- Hide scrollbars when not needed #1758
- Graph tooltip appearing with problems #1777
- Removed some duplicates in array fields in data #1787
- Value class unavailable for creation #1795
- Deleting favorited T makes model invalid bug #1818
- T template with missing parent applies incorrectly #1834
- A wrong default select value in the "Create entity" modal #1838
- Problem with handling audits for deleted users #1797

### Code refactor:

- Pnpm is now used for bundling and package management #1767
- Npm scripts in packages (client, server, database) were standardized #1767
- RethinkDB now uses pool connection to reduce the overhead #1756
- Used package caching in CI #1772
- Checked ts-ignore for react-dnd #1773
- React-table migrated to v7 #1779
- React-router fully upgraded to a new version
