# What's changed [Aug 11, 2026]

## Annotator

- Mark paragraph breaks with a first-line indent and an optional pilcrow paragraph mark, toggled from the context menu (#2076)
- Separate two touching same-colour highlights with an edge gap so they read as two spans (#2325)
- User-adjustable line spacing (Compact / Normal / Wide), with proportional text as the default on hosted instances (#2487)
- Shortcuts for paragraph marks and options, with shortcuts shown in context-menu rows (#3092)
- Find & replace moved into a dedicated panel (#2775)
- Reclaimed the box height for the text — document identity in the box header, edit modes and actions in a floating toolbar, and search as a compact top-right bar with the second step in a panel (#3210)
- Much faster typing in large documents: only the edited paragraph is re-parsed and re-wrapped, roughly 140× faster per keystroke on a 4,000-paragraph document (#3217)
- Elvl must be chosen in the highlight menu suggester before creating an Entity, marked with a warning ring, and can also be picked from the Entity create modal (#2873)
- Prompt to save or discard text edits when switching to highlight mode

## Explorer

- Saved queries — store, rename, organise into folders and reload, together with the Explorer filters applied when saved, with shared queries restricted to elevated roles (#783)
- Include subordinates / include equivalents is now a checkbox on each query node, not a single global setting (#3192)
- Fixed subordinates not being applied to Explorer results (#3194)
- Result-expanded Entities are badged sub / eq, and expansion is also toggleable globally from the results header (#2969)
- SUT: now covers the whole Territory subtree through the target node's SUB toggle; SUT:C is no longer offered for new queries but still runs in saved ones (#3193)
- Add Entity reference values as an Explorer column (#3060)
- Column widths estimated from content, and the table uses the whole page width when it overflows (#3070)
- Batch copy of UUIDs from the synonym cloud and from "Used in" (#3073)
- Enter in the query panel runs the search instead of toggling the SUB/SUT checkboxes

## Other improvements and fixes

- Editors can edit and delete Entities, Territory templates, template Statements and documentless Resources, with write rights inherited down the Territory tree; Statement batch actions and Relation writes are gated on Territory access, Viewers can no longer create or delete Entities and Documents, and Explorer cells are editable row by row by each row's own rights (#3191)
- Extended "Used in" in Detail with Reference and Reference-part backlinks, and blocked deleting a Resource used as a Reference or with a document attached (#3003)
- Statement text shown in Detail, resolved from the document anchors (#3047)
- Statement label and text field deprecated in favour of the anchored span (#3033)
- Fixed spanned text not showing as the Statement pseudo-label in Detail when done only by anchor (#3196)
- Anchor text used as the Statement EntityTag label in statement lists, search results and bookmarks (#2594)
- Open-in-editor button for Statement anchors in tables (#2975)
- Batch export of several full-text documents as a .zip, with the Documents and Backups pages rebuilt on the shared Panel/Box layout (#2702)
- Stats — percentages with two decimals, a total column, and users below the contribution threshold excluded from totals instead of bucketed as "others" (#3159)
- Stats — Relations tab merged into Entities, with grouped event-type filters and date-range presets (#3197)
- Reorder multi-note rows by drag and drop (#1334)
- Users page rebuilt as a boxed table with role badges, a name/email search, role and hide-inactive filters, a click-to-edit identity cell and bulk Resource annotate rights (#3208)
- Login, activation and password reset screens redesigned around a shared logo band and form layout, with show/hide password and a loading state on submit (#3219)
- Reworked Button system, unified modal Cancel buttons, and unified Territory tree filters so unmatched rows dim instead of matches being painted (#3207)
- Panel and box resizing follows the pointer in real time, pushes neighbouring panels past their limits, eases into place on release, and works on touch screens (#3209)
- Annotator search across soft-wrapped lines, block caret for monospace fonts, query-grid warning on empty required selectors, and Suggester width fixes (#3189)
- Reworked EntityTag label shortening so tags ellipsis correctly without wrapper elements (#2932)
- Fixed session cookie not being set when the server sits behind a TLS-terminating reverse proxy (#3185)
- Redesigned error screen with reload, retry and copy-report actions
- Opening a Statement from Search results locates its Territory

## Development (Technical)

- Migrated to official TypeScript 7 (#3202)
- Query export loads only the requested rows, Explorer pagination refetches once per 25-row chunk instead of on every scrolled row, and batch relation creation shares one relation-type context per request (#3206)
- Centralized Entity query keys, fixing a cache collision between two endpoints sharing one key with different response shapes, and added a `LOG_SLOW_QUERIES` flag for the slow query profiler (#3205)
- Subtree expansion filters Territory-class roots before looking up children, avoiding unindexed table scans for non-Territory roots
- Saved query validation bounds tree depth and node count before any database access

## Deployment

Run these database jobs against an already-running database:

- `fixEditorEntityAclJob` — seeds and repairs the `acl_permissions` rows the editor rights depend on. Without it, editors get "Endpoint not allowed" on entity delete/restore/clone, statement batch-move/copy/reorder, statement references and single-relation edit/delete.
- `createSavedQueriesTableJob` — creates the table backing saved queries.
- `ensureIndexesJob` — creates the new `EntityReferences` index used by the reference backlinks and the delete guard.
