# What's changed [Sep 24, 2026]

## Explorer

- All has-relation edges are now implemented — HOL, AEE, IMP, SUS, A1S, A2S, SYN, ANT, PRR, SAR, IDE and REL were offered by the query builder but disabled (#2969)
- Inverse relation edges — subclasses, subordinates, instances, meronyms and Action/Event equivalents (I_R:SCL, I_R:SOE, I_R:CLA, I_R:HOL, I_R:AEE), labelled "(inv. X)" (#3199, #3271)
- Position-restricted "is in S" edges — subject, actant 1, actant 2, pseudoactant and action (IS:S, IS:A1, IS:A2, IS:PS, IS:A), with inverses I_IS:A and I_IS:PS (#3271)
- Statement classification / identification edges SC, SI and I_SI (#3271)
- Territory tree edges — "T has child T" (any / direct child) and "T has parent T" (CT:, CT:D, I_CT:), with EQ adding identified Territories and SUB widening "T has parent T" from direct children to the whole subtree; "T has S" (I_SUT:) (#3271)
- Inverse reference edge I_HR:R (the Resources an entity's references point at), and inverse property edges I_EP:T and I_HP:V ("is property: type / value") (#3271)
- An edge whose target has no picked entity and no status matches any target instead of nothing, and the class picked in the target suggester narrows HP:V, SP:V, I_SP:V and I_IS: (#3271)
- Relation edges constrain their target to the classes the relation rule allows, and the target class follows the query root (#2969)
- Entity status filter on search nodes; it narrows only an empty target, a picked entity is matched as is (#2969, #3271)
- EQ / SUB toggles are disabled until an entity is picked and where they do not apply, with a tooltip saying why (#3271)
- Edge type dropdown grouped by relation family, with forward and inverse pairs side by side and a tooltip describing each edge; edges that duplicate another (symmetric-relation inverses, SUT:D / I_SUT:D, inverse IMP / SUS / A1S / A2S, CT:G) are hidden (#2969, #3271)
- "Co-occurs with" filter in the floating search — matches entities sharing a Statement with any of the picked entities (#2969)
- Batch actions to set label language and part of speech, with an overwrite checkbox, for Admin and Owner (#2969)
- EQ / SUB toggles on a query node show how many entities they pull in, with a popover listing them (#3252)
- New columns: logical type, entity class and "Used in" (the first-level Territories whose Statements reference the entity) (#3227)
- Numbered rows in query results (#2954)
- Saved queries reject duplicate names on save and rename (#3234)
- Column name field in the new column panel moved below type and params, and fills itself from the picked type (#3232)
- Corrected query grid node tooltip and disabled-picker text (#3236)

## Annotator

- Sequential anchoring can attach several Entities to one match in one go (#3249)
- Syntax highlighting in the RAW (XML) view, in both light and dark mode (#3269)
- Ctrl/Cmd+F seeds the find panel with the current text selection
- Find & replace resumes at the correct occurrence after a replace

## Validation rules

- Each entity list in a rule ("classified as", "having superordinate entity", "Prop type", "Allowed Concepts", "Allowed Resources") can also accept equivalents (SYN, IDE, AEE) and subordinates; the rule sentence and the warning state the widening (#2527)
- Rules can reach Territories under a given one, as a Territory's parent is read as its superordinate (#2527)
- A wrong prop type or value is warned about even when the Entity has other valid props

## Other improvements and fixes

- Right-click context menu on EntityTag — open in detail, open Statement in editor / jump to Territory, copy label, copy id, toggle bookmark folders, unlink (#3244)
- Detail box tabs that do not fit collapse behind a caret list instead of shrinking, and the tab limit is raised to 100 (#3229)
- Entities picked from the caret list or double-clicked move to the front of the tab strip, and tab order survives a refetch
- Territory tree keeps unfolded branches open on navigation, with a new "fold all" button (#3252)
- Alternative label input takes the full width (#3253)
- Removed the new metaproperty / reference add buttons from the Detail box (#3235)
- Stacked modals handle Enter and Esc for the topmost modal only; Enter in an open modal no longer runs the Explorer search
- Dropdown menus close when their value is cleared, with tuned placement and height
- Muted text for notes and labels readable in dark mode
- Statement anchor texts are filled in when a Statement is fetched as an Entity
- Emails show a text wordmark when the logo asset is missing (e.g. in Docker images)
- User deletion toast says "deleted" instead of "removed"

## Development (Technical)

- One expansion resolver (`getNodeExpansionIds`) serves query edges, the EQ/SUB popover and validation rules
- Relation edges share one runner and one class/status filtering path (`RelationTargetSearchEdge`)
- "Used in" resolves Statement Territories in RethinkDB in chunked index passes, so only Territory ids cross the wire
- Failed sign-ins are logged with login, IP and reason (never the password)
- A-C-R export: emits the missing Action reference stubs and metaprop Values/Resources, writes each Value once, batches relation queries, and validates dangling ids before writing; `dataset-stats.ts` produces a `summary.md` beside any exported dataset
- Full production dumps (`datasets/production-*`) are git-ignored
