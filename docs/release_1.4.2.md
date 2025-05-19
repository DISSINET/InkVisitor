## 1.4.2 Changelog [May 17 , 2025]

Main topics:
Annotator optimization and integration with the current InkVisitor functionality.
Statement list header redesign to lower the amount of visual elements while preserving the functionality and create more space for Annotator and Statement list.

### New Features:

- Annotator optimization (#2592)
- Redesign of Statement list header to save space and make the interface cleaner
- Statement anchors are now in attribute labels, it's visible on Statement tooltip, in Statement editor and in Statement list table in text column (#2594)
- Apply template modal now also appends relations and references, metaprops are now being appended instead of replaced (#2520)
- Allow creation of sub T vs same level T from annotator menu (#2622)
- Territory tree box and last panel (with Search etc.) is now resizable (#2050, #2560)

### Bug Fixes and Improvements:

- Improve used in documents (anchors) table in detail (#2557)
- Visual improvements on annotator menu
- Fix diacritics and special character search (#2640, #2611)
- Minimize detail box on main page (#2498)
- Preserve the internal order upon statement batch move (#2607)
- Added following languages: Polish, Portuguese, Dutch, Chinese and Japanese to languages, Old Church Slavonic, Old French, Old Italian, Old Occitan, Middle High German, Middle French, Old Norse, Old English
- Ctrlx in text edit and raw mode should delete text while putting it in clipboard (#2465)
- Prevent copy label on double click (#2567)
- Add territory in the by the new T button should trigger entity creation modal (#2504)
- Creation of subt from annotator must trigger the entity creation modal (#2623)
- Added the option of applying template to entity creation modal (#2577)
- Added drag and drop for rows to shrinked statement list table (#2595)
- Concat baseUrl with label without slash - allows creating external link leading to InkVisitor instance (#2609)
- Highlight selection is now one row to save space (#2563)
- Add copy JSON button to JSONExplorer (#2606)
- Fix resource and documents sometimes not reloading on T change (#2645)
- Fix guiding actant position (#2546)
- Added source T to T-based warnings (#2549)
- Fix metaprop append from template (#2646)
- Max username length is now 20 char
- put customization settings under main menu (#2615)
- Change admin icon to a more gender-neutral one (#2639)
-

### Dev refactor

- Optimized data model for documents for more efficient response (and wider usage for further programming)
