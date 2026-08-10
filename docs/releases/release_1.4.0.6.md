## 1.4.0.6 Changelog [Nov 12 , 2024]

### New Features:

- Added ability to select highglihted entity classes in Annotator (#2119)
- Re-unlocked epistemic level 1 and 2 in metaproperties (#2390)
- Added new focus and underline highlight mode in Annotator (#2385)

### Bug Fixes and Improvements:

- Fixed word selection in Annotator (#2389)
- Improved Annotator highlighting (#2410)
- Fixed line breaks in Annotator (#2412)
- Fixed Annotator scrolling issue + size
- Fixed auto-opening actions when statement warning list opened (#2427)
- Fixed incorrect anchor range in Annotator (#2412)
- Fixed repeated anchor is not highlighted (#2395)
- Improved Annotator cursor placement (#2432)
- Fixed recognized highlight area when changing width of the browser (#2434)
- Removed selection on scrolling (#2409)
- Improved notification on attempt to use subclass as superclass (#2381)
- Spelling variants hidden for statements (#2399)
- Added spelling variants to the tooltips (#2393)
- Improved guest-allowed login modal (#2398)
- Fixed reporting the error of server down as unknown error (#2376)
- Removed deprecated `statementOrder` attribute from data

### Code Refactor:

- Fixed observer warnings
- Update package tools version to newer version (#2425)
- Fixed hot reload in webpack
- Disabled github actions to prevent security breaches
- Improved build process
- Improved import script
- Added new button size variable (#2379)
- Fixed redirection to login path if ROOT_URL is set
