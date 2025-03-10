## 1.4.1.1 Changelog [Mar 9 , 2025]

### Bug Fixes and Improvements:

- Remove anchor from detail anchors section #2445
- Add button "+ new validation rule" also to the end of validations #2532
- Enable long text selection to declare it as territory Ctrl+A #2466
- Default actant role should be subject, not pseudo-actant #2546
- Global validations modal: only one button to close the modal #2530
- Add Polish, Portuguese, Dutch, Chinese and Japanese to label languages #2529
- Add mouseover to action button in statement list - territory suggester (move or duplicate current territory) #2562
- Prevent copy entity label on double click #2567
- Error when searching or creating an entity with longer (or parenthesis-containing?) entity #2518
- Ctrl+X in text edit and raw mode should delete text while putting it in clipboard #2465
- Add missing new T button for owner
- Fix editing statement template triggers error #2581
- Unify the mouseover label of the locate anchor buttons #2578
- Put newly created first-level Ts at the end, not at the beginning of the territory tree #2586
- Change import behaviour when importing entities of some type into a new deploy #1987
- show legacyId in the JSON entity display and in detail only on a specific instance (can be turned on in env file) #2589
- Add owner user to all instances #2497
- Improve anchor modal (annotator highlight menu) especially to show higher amount of entities related to highlight of the whole document #2596
- Add Territory should trigger entity creation modal #2504
- Increase width of entity creation modal #2519
- Increase width of suggester fields in Detail #2525
- Ignore AltGr and all function keys in annotator unless they have specified functionality #2537
- Highlight sometimes does not show (disappears) #2585
- Fix annotator semi-mode char add & delete char

### Dev improvements

- Render modal through portal - this makes modal independent on the rest of the UI
- Simplified README for deploy / development
- Define persecutio data import instance build
- Add users and audit tables to the download-production script

### Bug fixes after release of 1.4.1 (divided into 3 hotfix versions distinguished by release date)

- annotator - shift+home/end, ctrl+shift+home/end, pgup/pgdown+shift #2193
- pgup/pgdown+arrows #2188
- loading and filtering of templates in template box #2508
- more compact UI of annotator - better integrated search in the UI #2513
  & shorter "no anchor" caption
- Increased width of entity creation modal #2523
- Renamed validation input labels #2516
- Fixed creation of duplicate relations when using batch action for CLA (or SOE) from statement list (#2543)
- Improved highlight of active T anchor in annotator (#2323)
- Improvements related to creating of sub T from anchor modal - open new T in detail (#2499), order new T as last under the parent (#2500)
- Small visual fixes (full height of annotator, only one tooltip on the tag - either name or button tooltip not both)

- fix build and deploy after the major version update in docker hub
