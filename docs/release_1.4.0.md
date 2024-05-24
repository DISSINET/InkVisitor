## 1.4.0 Changelog [May 24, 2024]

### New Features:

- Integrated full text management of documents, including upload, export, and editing.
- Created the Annotator package for easier document management and work.
- Integrated new Python Flast server into the infrastructure
- Introduced new user administration features, including user registration, improved UX, user verification, and enhanced password management #1920 #1919 #1918 #1917.
- Implemented a new finely-tuned dark theme.
- Added new Territory protocols #1960 #2086 #2087.
- Implemented T-based validation with new warnings in the Editor and a new entity detail section #1924.
- Redesigned the search box #1891, and added search by Reference #1958.
- Added new validations: "Entity type should be filled in" #1939, "Part of speech is empty," and "Language is missing" #1952.
- Enabled reordering of references in Detail and Editor #1941.
- Allowed viewing and editing of root T entity (when having rights).

### Bug Fixes and Improvements:

- Resolved toast multiplication issue #1878.
- Fixed websocket connectivity problems #1877.
- Improved the entity type selectors #1894.
- Fixed mouseover text on the refresh button #1902.
- Updated relation models #1903 #2147 #2129 #1868.
- Included Statement itself in the validation #2099.
- Refactored Dropdown component #1913.
- Modified display of self for Synonyms #1943.
- Made the graph depiction of relations directed #1944.
- Fixed disappearance of Suggester upon removal of some Relation in Detail #1945.
- Added "copy value" button to References #1937.
- Added part of speech to entity tooltip #2011.
- Improved changing actant type to elvl3 when the language does not fit the user setting #2024.
- Enabled using Statement as an actant of another Statement #2021.
- Fixed issue where adding action/actant and then unlinking from actant row object made the data model invalid #2042.
- Improved the user customization modal #2073 #2037.
- Enhanced the statement list header #2084 #2082 #2090.
- Improved the general UI/UX #2027 #2040 #2031 #1950.

### Code Refactor:

- Performed a full upgrade of all development packages and improved the building/deploying process #1962 #1961 #1966 #1972.
- Significantly improved database management and import scripts.
- Overrode dropdown native components #1922.
- Added Jest for frontend testing.
