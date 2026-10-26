# What's changed [Jul 10, 2026]

## Annotator

- Proportional font - toggle with other settings in context menu (right click in Annotator) (#2487)
- Move already anchored annotation spans with buttons (#2885)
- Sort selection anchors from inside outwards (#2051)
- Copy with natural paragraph breaks, not soft-wrap line breaks (#2551)
- Statement and Territory creation from anchor modal in correct territory (#3097)
- Territory anchors visible as corner markers (#2887)
- Fixed cursor movement tracking during word recalculation (#3145)
- Soft-wrap caret navigation & no leading-whitespace wrapping (#3163)

## Explorer

- Include subordinates (inverse SCL / SOE / HOL + child territories, all levels) and include equivalents (SYN / IDE / AEE) expansion, surfaced and badged (sub / eq) in the Explorer node-edge Entity Suggester, toggled from the Explorer floating search popup (#2969)
- Add EUT: "used in statements directly under a Territory" edge (#2969)
- Add EUT:C "Used in Statement under T: children" edge (#3187)
- I_IS: edge - "S has: in any position" for statement co-occurrence edge (#2969)
- Inverse in-statement actant-role edges S has: subject / actant1 / actant2 (I_IS:S / I_IS:A1 / I_IS:A2) to find statement chains (statements connecting to substatements) (#2969)
- Implement SUT:C "S under T: children" query edge (#2333)
- Implement IS: "X is in S: any position" query edge (#2332)
- Column reorder by drag-and-drop and icon buttons (#3071)
- Allow minimizing Search and Explorer box (#3062)

## Other improvements and fixes

- Add Relations to audit and show in Detail and add it to Statistics page (new tab) (#3075)
- Warn when deleting metaproperty with child properties (and customization) (#3166)
- Add user attribute: working languages (new customization) (#2025)
- Add ISO 639-2 extensive list of languages (#2014)
- Modernize core UI components & refactor layout (#2447)
- Fix bad handling of expired access (#2306)
- Easier starred Ts access (#2882)
- Improve document deletion dialogue (#2797)
- Prevent multiple menus being opened at once (#2301)
- Unify clicking area in append/replace switch (#2533)

## Development (Technical)

- Replace JWT session auth with RethinkDB cookie sessions (#3117)
- Fix and stabilize server test suite (#3143)
- Optimize territory detail endpoint queries (#3160)
- Stop rebuilding territory tree on tree-irrelevant statement writes (#3155)
- Minimize API calls & deduplicate queries (client optimization) (#2931)
