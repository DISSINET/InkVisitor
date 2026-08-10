## 1.3.4 Changelog [Nov 3 2023]

### New features:

- Added a new funding body (Czech Ministry of Education, Youth and Sports & European Union). (#1844)
- Added interactive warning indicators for Statements right into the statement list. (#1855)
- Added functionality to open the detail of the relevant Action when unfolding the warning toggle in the statement editor. (#1857)
- Integrated new warning type - AVAL (Asymmetrical valency). (#1817)


### Bug fixes and improvements:

- Fixed the rules for warning messages. (#1854)
- Improved error messages and ping on connection problems (#1849, #1883, #1877), the default message "Something bad happened" changed to "Unknown error occured".
- Improved visuals of the warning messages and general user experience.
- Improved the select template dropdown. (#1845)
- Allowed Superordinate Entity (SOE) to be used between Events and Statements, and vice versa. (#1868)
- Warnings in detail are divided into two sections - Valency and Relations.


### Code refactor:

- Improved the editor and detail content refresh (#1856), a large refactor is anticipated in the next version.