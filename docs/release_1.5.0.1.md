## 1.5.0.1 Changelog [Mar 24, 2026]

### Annotator

- Draggable annotator highlight menu modal #2866
- Used less Retro monotype font (Roboto mono) #2890
- Redesign Annotator UI (line numbers, scroller, wrapper, increased line height, narrower centered highlight)
- Improved essentials like fluent scroll, minimum height of scroller
- Keep cursor across mode switching and stay on the same position when switching to xml #2879, #2865
- Ctrl+F or Cmd+F now focuses annotator search input #2874
- F3 and Shift+F3 moves between occurrences #2876
- Smarter word / tag selection #2878
- Added mac shortcuts for highlight (combinations of cmd+shift+arrows and alt+shift+arrows)
- Fixed wrapping anchors #2863
- Fixed removing anchor from highlight menu doesn't refresh the highlight and the entities in the highlight menu #2868
- Fixed discard button not disabled after cancelling the changes
- Fixed annotator overwrite selection #2849
- Fixed one ID anchored repeatedly in one document causes highlight to multiply #2895

### Bug Fixes and Improvements:

- Batch operations over search results in a list (explorer page): add metaprops and metarelations #2117
- Make advanced search options (main page) modular #2845
- Added full-text export functionality also to Annotator #2850
- Redesigned alternative labels + added shortcuts (and icons) for save edit or exit #2790
- Added check for Action synonyms for same AEE or its SYN #2371
- Inverse relations are now paginated #2747
- Annotator vs. List buttons are now tabs #2860
- Fixed adding tree node to favorites doesn't refresh the entity tag
