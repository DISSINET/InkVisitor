# What's changed [Aug 14, 2026]

## Annotator

- Mark paragraph breaks with a first-line indent and an optional pilcrow paragraph mark, toggled from the context menu (#2076)
- Move find & replace into a dedicated panel (#2775)
- Separate two touching same-colour highlights with an edge gap so they read as two spans (#2325)
- Elvl must be chosen in the highlight menu suggester before creating an Entity, marked with a warning ring, and can also be picked from the Entity create modal (#2873)
- User-adjustable line spacing (Compact / Normal / Wide), with proportional text as the default on hosted instances
- Reclaimed the Annotator box height for the text — document identity in the box header, edit modes and actions in a floating toolbar, and search as a compact top-right bar with the second step in a panel
- Optimized typing in large documents
- Prompt to save or discard text edits when switching to highlight mode (preparation for virtual lock)
- Statement tooltips show the anchored text while the document links are still loading, instead of an empty "no label" row

## Explorer

- Include subordinates / include equivalents is now a checkbox on each query node (#3192)
- Implement proper global equivalents / subordinates (result-expanded Entities are badged sub / eq) (#3194)
- SUT: and EUT: covers the whole Territory subtree through the target node's SUB toggle, replacing the separate SUT:C and EUT:C edge (#3193)
- Saved queries — store, rename, organise into folders and reload, together with the Explorer filters applied when saved, with shared queries restricted to elevated roles (#783)
- Add Entity reference values as an Explorer column (#3060)
- Estimate column widths from content (#3070)
- Batch copy of UUIDs from the synonym cloud and from "Used in" (#3073)
- Enter in the query panel runs the search instead of toggling the SUB/SUT checkboxes
- Parent Territory column — resolves a Territory's parent, or the Territory a Statement belongs to (#3190)
- Batch add of a reference takes a droppable label input instead of a value picker, so each selected Entity gets its own V (same label different UUID as with single Value copy) (#3224)
- Higher stats limit (500), and the left-panel toggle is hidden when no detail is open

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
- Stats — Relations tab merged into Entities, with grouped event-type filters and date-range presets
- Reorder multi-note rows by drag and drop (#1334)
- Users page rebuilt as a boxed table with role badges, a name/email search, role and hide-inactive filters, a click-to-edit identity cell and bulk Resource annotate rights
- Login, activation and password reset screens redesigned around a shared logo band and form layout, with show/hide password and a loading state on submit
- Reworked Button system, unified modal Cancel buttons, and unified Territory tree filters so unmatched rows dim instead of matches being painted
- Panel and box resizing follows the pointer in real time, pushes neighbouring panels past their limits, eases into place on release, and works on touch screens
- Reworked EntityTag label shortening so tags ellipsis correctly without wrapper elements (#2932)
- Redesigned error screen with reload, retry and copy-report actions
- Fixed a deep link losing its route and territory/detail params on auto-logout — the app now returns to the originally requested URL after login instead of always landing on "/" (#3190)
- The default Territory set in user customization opens on a clean page load
  — multi-UUID search now works in the basic search too (#3222)
- new Values can be created silently using drag & drop, dropzones that link to an existing Entity (bookmarks, search filters, rule definitions, relations) keep the dropped Entity itself (#3224)
- A new deploy is detected in an open tab, which offers a reload

## Development (Technical)

- Migrated to official TypeScript 7
- Query export loads only the requested rows, Explorer pagination refetches once per 25-row chunk instead of on every scrolled row, and batch relation creation shares one relation-type context per request
- Centralized Entity query keys, fixing a cache collision between two endpoints sharing one key with different response shapes, and added a `LOG_SLOW_QUERIES` flag for the slow query profiler
- Subtree expansion filters Territory-class roots before looking up children, avoiding unindexed table scans for non-Territory roots
- Saved query validation bounds tree depth and node count before any database access
- Hashed client bundles are cached permanently while index.html revalidates, so a reloaded tab always references the current deploy's chunks

## Deployment

Run these database jobs against an already-running database:

- `fixEditorEntityAclJob` — seeds and repairs the `acl_permissions` rows the editor rights depend on. Without it, editors get "Endpoint not allowed" on entity delete/restore/clone, statement batch-move/copy/reorder, statement references and single-relation edit/delete.
- `createSavedQueriesTableJob` — creates the table backing saved queries.
- `ensureIndexesJob` — creates the new `EntityReferences` index used by the reference backlinks and the delete guard.
