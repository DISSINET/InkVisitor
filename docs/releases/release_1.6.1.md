# What's changed [Oct 7, 2026]

## Explorer

- Edges that were greyed out in the edge type dropdown are now implemented and can be used in queries (#2969 [8], #3199, #3271)

<details>
<summary>List of the newly implemented edges</summary>

- Has-relation edges — HOL, AEE, IMP, SUS, A1S, A2S, SYN, ANT, PRR, SAR, IDE and REL (#2969 [8])
- Inverse relation edges — subclasses, subordinates, instances, meronyms and Action/Event equivalents (I_R:SCL, I_R:SOE, I_R:CLA, I_R:HOL, I_R:AEE), labelled "(inv. X)" (#3199, #3271)
- Position-restricted "is in S" edges — subject, actant 1, actant 2, pseudoactant and action (IS:S, IS:A1, IS:A2, IS:PS, IS:A), with inverses I_IS:A and I_IS:PS (#3271)
- Statement classification / identification edges SC, SI and I_SI (#3271)
- Territory tree edges — "T has child T" (any / direct child) and "T has parent T" (CT:, CT:D, I_CT:), with EQ adding identified Territories and SUB widening "T has parent T" from direct children to the whole subtree; "T has S" (I_SUT:) (#3271)
- Inverse reference edge I_HR:R (the Resources an entity's references point at), and inverse property edges I_EP:T and I_HP:V ("is property: type / value") (#3271)

</details>

- Saved queries can carry the table columns, in their order and with their names; an "include columns" checkbox (checked by default) decides it, and loading the query restores them (#3233)
- EQ / SUB toggles on a query node show how many entities they pull in, with a popover listing them (#3252)
- New columns: logical type, entity class and "Used in" (the first-level Territories whose Statements reference the entity) (#3227)
- Saved queries reject duplicate names on save and rename (#3234)
- Statements open in an Editor box under the Detail box in the Explorer detail panel (#3297)
- EQ / SUB toggles are disabled until an entity is picked and where they do not apply, with a tooltip saying why (#3271)
- Edge type dropdown grouped by relation family, with forward and inverse pairs side by side and a tooltip describing each edge; edges that duplicate another (symmetric-relation inverses, SUT:D / I_SUT:D, inverse IMP / SUS / A1S / A2S, CT:G) are hidden (#2969 [8], [23], #3271)
- "Co-occurs with" filter in the floating search — matches entities sharing a Statement with any of the picked entities (#2969 [14])
- Batch actions to set label language and part of speech, with an overwrite checkbox, for Admin and Owner (#2969 [4], [22])
- Numbered rows in query results (#2954)
- With several "co-occurs with" entities picked, a row that is itself one of them stays in the results when it shares a Statement with another picked entity
- Statement classification / identification and property edges skip rows that were added but never filled in, so "has property", "has S prop", "has / is S classification" and "has / is S identification" without a target no longer match them (#3271)
- Edges reading legacy Statements that lack classifications, identifications, a prop id, a reference resource or a territory id no longer drop those Statements or fail the whole query (#3271)
- Column name field in the new column panel moved below type and params, and fills itself from the picked type (#3232)
- Corrected query grid node tooltip and disabled-picker text (#3236)

## Annotator

- Sequential anchoring can attach several Entities to one match in one go (#3249)
- Syntax highlighting in the RAW (XML) view, in both light and dark mode (#3269)
- Ctrl/Cmd+F seeds the find panel with the current text selection
- Find & replace resumes at the correct occurrence after a replace
- Next / Previous search notifies when it wraps around the document (#3094)
- Cmd+Backspace / Cmd+Delete next to a tag in the RAW (XML) view delete the whole tag (#3269)
- Large documents load much faster: a 200k-word document drops from about 52 s to 0.2 s (#3269)

## Validation rules

- Each entity list in a rule ("classified as", "having superordinate entity", "Prop type", "Allowed Concepts", "Allowed Resources") can also accept equivalents (SYN, IDE, AEE) and subordinates; the rule sentence and the warning state the widening (#2527)
- Rules can reach Territories under a given one, as a Territory's parent is read as its superordinate (#2527)
- A wrong prop type or value is warned about even when the Entity has other valid props

## Other improvements and fixes

- Right-click context menu on EntityTag — open in detail, open Statement in editor / jump to Territory, copy label, copy id, toggle bookmark folders, unlink (#3244)
- Detail box tabs that do not fit collapse behind a caret list instead of shrinking, and the tab limit is raised to 100 (#3229)
- Templates box hides discouraged templates; they stay reachable through search and the Explorer (#3274)
- Templates can be starred, with a "starred only" filter and an order dropdown (label, class, newest); a user setting lists templates of a chosen class first (#3294)
- An owner can make other users owners and change another owner's role; the last active owner cannot give up the role, be deactivated or be deleted (#3285)
- Territory tree keeps unfolded branches open on navigation, with a new "fold all" button (#3252)
- Territory tree marks the top anchored Territories of each document with a document icon listing the document titles, and gets a "with document" filter; only documents linked to a Resource count (#2494)
- Creating a template from a template leaves the origin template unchanged (#3289)
- Detail rejects duplicate labels when adding an alternative label with Enter or editing a label, and removing an alternative label removes just that entry (#3279)
- Only an owner deletes an owner, sets or resets an owner's password, or deactivates an owner; the Users list disables those buttons on owner rows for admins (#3285)
- Alternative label input takes the full width (#3253)
- Removed the new metaproperty / reference add buttons from the Detail box (#3235)
- Stacked modals handle Enter and Esc for the topmost modal only; Enter in an open modal no longer runs the Explorer search
- Emails show the InkVisitor logo as a PNG, so Gmail and Outlook display it, and fall back to a text wordmark when the logo file cannot be found

Owner only: Import entities from JSON in the Detail box: up to 10 entities, pasted or loaded from a .json file, are validated, previewed and created together, and rolled back if a write fails (#3273)

## Development (Technical)

- One expansion resolver (`getNodeExpansionIds`) serves query edges, the EQ/SUB popover and validation rules
- Relation edges share one runner and one class/status filtering path (`RelationTargetSearchEdge`)
- "Used in" resolves Statement Territories in RethinkDB in chunked index passes, so only Territory ids cross the wire
- Failed sign-ins are logged with IP and reason; a wrong password names the account by its stored id and name, an unknown login is left out
- A-C-R export: emits the missing Action reference stubs and metaprop Values/Resources, writes each Value once, batches relation queries, and validates dangling ids before writing; `dataset-stats.ts` produces a `summary.md` beside any exported dataset
- Full production dumps (`datasets/production-*`) are git-ignored

## Deployment

- Run `fixEditorEntityAclJob` again. It now also opens `GET entities/:entityId/relations` to editors; without it they get "Endpoint not allowed" when removing an entity from a relation cell in the Explorer.
- Clear `usedTemplate` on the one template that had a new template created from it before #3289 — it points at its own copy and should be empty.
