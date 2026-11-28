# What's changed [Nov 27, 2026]

InkVisitor now runs on PostgreSQL, which makes loading data faster: Explorer searches, columns and stats return quicker, and Explorer stats count every matching Entity instead of the first 500.

## Explorer

- Several start nodes in one query: each start node has its own conditions and the result is their union (#3270)
- New edge **anchored under T** (`EAT:`): every Entity anchored inside the span of a T's anchor, at any depth, including Entities used in no Statement (#3265)
- Property edges match the type and the value of the same prop; has property and has S prop take a type node and an optional value node, with NOT on the value node (#3383)
- The label filter, UUIDs and Filters moved into a Narrow results row at the bottom of the Query Builder, above an Expand results row with the EQ / SUB toggles and the search button (#3360)
- Node filters: label, language and status (#3360), date created / updated, created / updated / edited by and co-occurrence (#3374)
- Status and language take several values, and logical type and part of speech filters are added, both on nodes and in the Filters panel (#3430)
- Conditions nested under a node narrow that node's own Entities, and a condition nested under a selected Entity without EQ or SUB shows a warning (#3374)
- New nodes start with EQ and SUB on (#3429)
- Invert selection button next to the select-all checkbox (#3444)
- Suggest a name when saving a query (#3384); the Queries button sits in the Query Builder header
- Query results are no longer cached for 5 minutes, so edits show in the next search (#3374)
- Fixed nested relation pickers taking their allowed classes from the root instead of their own source node (#3270)
- Fixed query export shifting cells left when a Created by or Parent Territory value was missing (#3450)
- The Entity open in Detail refreshes after an Explorer batch action

## Annotator

- Suggester lists up to 10 Entities used in the Statements anchored around the selection first, then those of the subT and parent Ts (#3413)
- An anchor of an Entity in another language than the user's default source language is created as inferential, with a toast, and sequential anchoring asks first (#3255)
- Text and XML can be edited in the Documents page annotator by users who may manage the document; Esc closes one layer at a time instead of the whole document (#3321, #3322)
- The Annotator mode is kept when the Territory changes within the same document (#3326)
- Hovering the closing tag of an asymmetrical anchor shows the Entity tag (#3435), and the full Entity tag shows on hover in XML mode
- Highlighting and select-all are fast on large documents (select-all on a 6,400-paragraph document went from ~8.6 s to ~21 ms per frame)
- Search terms are capped at 200 characters, so searching a whole selected document no longer crashes the page

## Statement Editor

- New Detail section with the detail field, status, label language, Relations and metaprops of the Statement (#3315)
- Suggesters list the Entities anchored around the Statement first, up to 10 per class (#2033)
- Fixed the language check reading an empty field, so every linked Entity got the language toast and the inferential elvl (#2033)
- Re-linking an Entity in an existing actant row keeps its position (#3380)
- New mood: accusation (#3388)
- The reference and delete batch actions in the Statement list confirm with a toast

## Geocoding (#3323)

- The accuracy of a coordinate is saved as a subproperty of the coordinate, not as a second property beside it
- The gazetteers behind a coordinate are named as subproperties of it too (the "source of knowledge" Concept, one per gazetteer, valued with the gazetteer's Resource), so that a licence asking for credit has it on the coordinate itself
- A Location's location type follows the subclass and synonym tree of the Concept assigned to the type: what is classified "city" shows as a settlement, and so does "civitas", unless a subclass has a location type of its own. Inferred types are drawn paler, say where they come from on hover and cannot be removed from the page
- A Location can have several location types. Choosing one adds it, the list row and the panel head tick and untick them, and a Location without a coordinate can be given one
- The settings table counts the Locations that read as each location type, shows how many of them are only inferred, and warns where a Concept has more subclasses than can be followed
- A church with a tower is added to the location type marks
- "kind of place" is called "location type" and "engine type" is called "gazetteer location type" throughout; the gazetteers' type of a suggestion is said in words on its card
- The gazetteer hover card is shown in the settings only, not beside the suggestions; its "cannot do" line is "limitations"
- The notes in the global geocoding settings are shorter and in plain words, the role rows say what they hold, and the gazetteer location type column explains what each type covers
- The query context's labels and sliders line up with the top of their row
- A search no longer slows the page down while it runs: the seconds counter re-rendered the whole page, and any window open over it, four times a second
- A gazetteer's card, on hover over its name in the settings and in My preferences, opens with what it covers (time, geography, topic), how long it usually takes ("local", "quick", "moderate", "slow", and "often fails" where it does), how many records it holds, what it is good for and its limitations, then its terms of use, then its description and the rest. The engine measures the time itself, so a source shows none until it has been asked a few times
- A new Location can be made from the Geocoding page with the `+` beside the search field. It opens the Explorer's create dialog for Locations, then the list is widened to every Location and the new one is selected
- The Geocoding page can have nothing selected: a bar above the Locations always says which Location is selected, or that nothing is, and has a clear button; the strip under the map has a "deselect" button too
- With no Location selected, a click on the map, a drawn point, line or polygon, or a typed coordinate starts a new Location: the same two questions (accuracy, location type) with the coordinate shown, then the create dialog for the label, then the coordinate is written on the new Location. A `+` under the drawing tool on the map opens the same dialog without a coordinate
- Every subclass of a location type's Concept, at every depth, is a location type of its own: the Global geocoding table shows the tree under each location type, indented and foldable, and the map menu, the Suggestions caret and the list ticks open it as lists beside one another on hover or with the arrow keys; any Concept of the tree can be chosen. The mark and the gazetteer location type are set on the top row and shared by the tree
- Any Concept of a tree can be unticked so it is no longer offered; Locations classified under it keep it. A switch above the table hides the unticked ones
- The description of a location type is its Concept's detail, edited in the table and saved to the Concept; the descriptions stored in the settings are dropped
- The pickers show each location type as its Concept's tag
- A location type is called by its Concept's label everywhere; the name column of the Global geocoding table is gone
- The location type menus show each location type on one line, without its description, and are headed by the Classification relation (CLA) a location type is recorded as
- A Location geocoded from a suggestion cites only the gazetteers whose records lie close to the written coordinate: the distance is set per gazetteer location type in Global geocoding, under "Suggestions: coordinate and citing" (1.5 km for a religious house, 5 km for a settlement, 30 km for a region by default). A record further out in the suggestion's group is not cited, and the suggestion card dims it
- Geocoding a Location again from a suggestion replaces the gazetteer references an earlier geocode left, instead of adding to them; a coordinate set on the map changes no reference
- Global geocoding can choose the engine's rule for which record a suggestion's coordinate comes from (place first, agreement, best score, medoid, densest); by default it leaves the engine's own. "How the rules work" beside the choice draws four cases on which the rules differ — a church in a town, an exact match against loose ones, a region named after its capital, a village and its municipality — showing where each rule finds the place and where it is misled, with a table of what each is good for and misled by
- The owner lists the project's accuracies in Global geocoding: any Concepts, in order, each with its detail as the description, edited in the table and saved to the Concept. One is marked for suggestions whose sources agree and one for scattered sources; the card's main button, quick geocoding and the batch use those two. The pickers show each accuracy as its Concept's tag, one line each, headed by the tag of the Concept assigned for localisation accuracy
- An accuracy is called by its Concept's label everywhere; the built-in texts for precise, approximate, region and unknown are gone. A Location whose accuracy the list does not hold stays geocoded and is flagged
- Diocese and ecclesiastical province are gazetteer location types, so a project's own diocese and province types can be mapped to them: the search asks the gazetteers for that kind of area, at its own distance scale and citing distance (5 and 15 km), and a diocese the Stanford atlas returns finds the project's diocese type

## Other improvements and fixes

- Admins can import Entities from JSON too, and one import holds up to 200 Entities for owners and 25 for admins (was 10 for owners) (#3273)
- Label search treats quote marks and apostrophes as interchangeable, finds Czech accented letters from plain ones (`temer` finds `Teměř`) and reads typed regex characters literally (#3302)
- The Templates filter matches like the Entity suggester (#3328)
- Validation rules can apply only to Entities whose label or alternative label contains a given text (#3290)
- Right click in an empty Entity suggester shows bookmarks and a paste row (#3386)
- New dropdown component replacing react-select (#3183), and native thin scrollbars (#3372)
- Copy all UUIDs of a multi-value Relation and of basic search results (#3331); Audits renamed to Entity audits (#3329)
- Full Entity labels in Detail's inverse relations, protocol, relation audits and used-in Statements (#3440)
- Entity tooltip lists each anchored text once with its count, at most 5 texts
- Relation graph: every direct identification in a cycle is listed, Entities sit at their shortest distance, dark mode, wheel scrolls and Ctrl+wheel zooms, resizable (#3377)
- Error toasts say what failed (no response, timeout, server unavailable, or the server's error) and offer Copy details with a request id (#3381)
- A change of role, password or active state logs the user out, and a forced logout can no longer be undone by a request in flight (#3316)
- Only owners and admins change user rights
- Fixed removing one of several anchors of an Entity in Detail duplicating document text (#3443)
- Fixed removing an anchor in Detail leaving the stored anchor tree stale (#3451) and the Editor, Statement list and Detail tab showing the removed anchor (#3454)
- Fixed a closing tag ending whatever anchor was open last, which cut anchors around markup such as `<hi>` short (#2033)
- Fixed Statements anchored many times failing to load (500)
- Fixed server start re-saving documents without anchors (#3431)

## Development (Technical)

- Storage boundary with RethinkDB and PostgreSQL adapters, an API replay harness and a Playwright smoke suite, run on both adapters (#3256)
- oxlint replaces ESLint and TSLint (#3300); pull requests are linted, typechecked and tested in CI (#3350), with the server integration tests run on PostgreSQL (#3482)
- Explorer columns are read once per page instead of once per row (100 rows, 6 columns: 362 database statements to 6) (#3412)
- Tooltip anchors are grouped on the server (a Territory tooltip went from 379 KB to 10 KB); created / updated at filters, Territory validation ties and tooltip relations load in fewer queries (#3361, #3354, #3348)
- New `GET /entities/:entityId/used-relations`, open to every logged-in user
- New `GET /entities/classified-under`, the entities classified under given Concepts or under a subclass or synonym of one, open to every logged-in user (#3323)
- CONTEXT.md glossary of the research team's vocabulary (#3287)

## PostgreSQL (Technical)

- InkVisitor runs on PostgreSQL as well as RethinkDB, chosen with `DB_ADAPTER`; RethinkDB stays the default (#3256)
- `pnpm migrate` moves a RethinkDB database into PostgreSQL in one command: it checks the export against the PostgreSQL constraints before touching PostgreSQL, compares row counts and diffs both databases, and replaces nothing until the run is verified (#3358, #3402)
- `fixDuplicateRowsJob` removes duplicate relations and acl_permissions rows and blanks dangling document and template references, so the migration adds the constraints on the first try; `migrate --skip-duplicates` migrates a dump that still has them (#3357, #3396)
- Foreign keys on the territory, parent and user references, and unique constraints on relations, users and acl_permissions (#3345, #3356)
- The schema is brought up to date at every server start (#3334)
- Nightly backup script `backup-pg.sh`, writing into the same archives with the same retention as the RethinkDB backup (#3397)
- The Explorer stats limit of 500 Entities applies on RethinkDB only (#3428)
- Faster Explorer queries: selected targets read through the indexes (#3282), and SYN and the other unordered relation edges run 8-30x faster (#3343)
- A write blocked by a held row lock gives up after 10 s instead of waiting forever and starving the connection pool (#3405)

## Deployment

- Node 22.23.4 or newer is required (CVE-2026-111497); the Docker image builds on the official `node:22-alpine` (#3332)
- docker-compose: the `database` service is renamed `rethinkdb` (container `inkvisitor-rethinkdb`), and a `postgres` service is added
- After the deploy, run `cancelPasswordResetLinksJob` once on every environment (`J` in the database app), with `--target=both` on an instance already on PostgreSQL so the RethinkDB copy kept for a rollback is covered too
- After the deploy, on every environment, rebuild the stored anchor trees: `ENV_FILE=<env> pnpm -C packages/server rebuild-anchors --dry-run`, then the same without `--dry-run` (#2033, #3451)
- Once an instance runs a server with #3399, run `removeDeadUserOptionsJob` on it (`J` in the database app), with `--target=both` on an instance already on PostgreSQL so the RethinkDB copy kept for a rollback is cleaned too. An older server writes `hideStatementElementsOrderTable` again on every user it creates (#3399)
- Switching an instance to PostgreSQL: run `fixDuplicateRowsJob` ahead of time, stop the API, run `pnpm -C packages/database migrate --db=<name> <env>` and check for `databases match`, then set `DB_ADAPTER=postgres` and the `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASS` block in the server env and start the API. RethinkDB is left untouched for a rollback.
- `migrate --drop` is renamed `--replace`; the replaced database is kept as `<pg>_replaced_<timestamp>` until dropped by hand (#3402)
- PostgreSQL backups run only once the `backup-pg.sh` cron line from the database README is added on each host (#3397)
- A server start whose schema sync waits more than 10 s for a lock (e.g. behind a running `pg_dump`) fails with the lock error; a restart retries it (#3405)
- A blank `APIURL` at client build falls back to the app origin; behind a proxy serving the container under a sub-path, set `APIURL` with the sub-path
- Geocoding (#3323): `nestGeocodingAccuracyJob` moves the accuracy of existing Locations under their coordinate. It lists the Locations it will not touch, and a second run finds nothing to move. On a database that still holds coordinates as `geo:x` and `geo:y`, run `migrateGeocodingGeometryJob` first, on RethinkDB before `migrate`.
- Geocoding (#3323): assign the "epistemic source" Concept in Global geocoding (owner), under "concept for the source of knowledge"; until it is assigned the gazetteers are recorded as references only. Then run `addGeocodingSourcesJob` to name the gazetteers of Locations geocoded before, from their references. It credits a gazetteer only when the Value holding its record id was created within five minutes of the Value holding the coordinate, so a reference added by hand later is not credited.
- Geocoding (#3323): both jobs write a Location only if it has not changed since the job read it, and refuse a database where one Concept serves two of the coordinate roles. Both run on RethinkDB and PostgreSQL, so they can run after the switch.
- Geocoding (#3323): Explorer queries and validation rules that expect the accuracy as a first-level property no longer find it once it is nested, and have to be rewritten.
- Geocoding (#3323): a location type covers its Concept and everything below it, so assign a narrow Concept ("settlement", not "area" or "place"): a broad one takes in every Location classified under anything beneath it, and every Concept beneath it becomes a row of the table and a choice in the pickers.
- Geocoding (#3323): the descriptions stored with the location types are no longer read; a location type's description is now its Concept's detail, empty until someone fills it in the Global geocoding table or in Detail
- Geocoding (#3323): deploy HGA engine 0.8.0 before or with this release. It gives each suggestion the record its coordinate comes from, chosen where the gazetteers agree; an older engine takes the best-scoring record, which can be an outlier, and citing by distance then leaves out gazetteers that agree with each other but not with it. InkVisitor still runs against an older engine, finding that record by its coordinate. Locations geocoded before keep the references they have until they are geocoded again from a suggestion.
- Geocoding (#3323): no job is needed for the accuracies. Until an owner saves the Global geocoding settings, the four accuracy Concepts assigned before are read as the list, precise marked for agreeing sources and approximate for scattered ones. Their labels are now what the page shows, so check the label and detail of each accuracy Concept; the "accuracy a map click writes" preference only marks an entry of the map menu and starts empty
