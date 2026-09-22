# Geocoding

The Geocoding page turns a historical place name on a Location entity into
coordinates, using the HGA-Engine — a stateless HTTP service that queries 16
gazetteers and returns ranked coordinate suggestions with full provenance.

This file records what the page stores and the decisions behind it. The engine's
own API reference lives in its repository; nothing here restates it.

## How a coordinate is stored

Coordinates are metaproperties on the Location entity, not fields on
`ILocationData`. Three sibling props carry them:

| prop type | prop value | example |
|-----------|------------|---------|
| Concept `geo:x` | Value entity | `"17.033"` |
| Concept `geo:y` | Value entity | `"51.107"` |
| Concept `geo:accuracy` | Concept | `geo-accuracy:precise` |
| Concept `geo:type` | Concept | `geo-type:settlement` |

`geo:x` is longitude and `geo:y` is latitude, following the GIS axis order. The
Value entities are always newly created — never shared between two Locations,
because editing a shared Value would silently move both places.

Accuracy is one of four Concepts: `geo-accuracy:precise`,
`geo-accuracy:approximate`, `geo-accuracy:region`, `geo-accuracy:unknown`. It is
chosen by the researcher when accepting a suggestion, not derived from the
engine's numbers.

Type is drawn from a fixed dictionary matching the engine's normalised place-type
vocabulary. When the engine returns a type with no corresponding Concept
configured, the page warns and refuses rather than inventing one — a controlled
vocabulary that grows from external input is not controlled.

A Location counts as **geocoded** when all three of `geo:x`, `geo:y` and
`geo:accuracy` are present and each one's value resolves to a non-empty entity.
A prop pointing at a Value that was deleted, or at a Value with a blank label,
does not count — a coordinate that cannot be read is not a coordinate. One
Location in the converted set, `diocesis Tudensis`, is exactly that shape.

`geo:type` is not part of the test. It records what kind of place the coordinate
refers to, and its absence does not make the coordinate unusable.

None of these Concept identities is hardcoded. Which Concept plays which role is
configuration, so a deployment whose data uses different Concepts points the
settings at them instead of migrating.

## Where the source of a coordinate is recorded

The gazetteer that produced a coordinate is an entity reference: one Resource
entity per gazetteer, reused across every Location, plus a Value entity holding
that gazetteer's own identifier for the record. `IResourceData` already carries
`partValueBaseURL`, so the base URL plus the value label reconstructs the deep
link without storing a second URL.

Every source that contributed to an accepted suggestion gets a reference, with
one exception: `llm-coords` is not a gazetteer but the language model's own
coordinate guess, has no record to point at, and never gets one. All fifteen real
sources always publish an identifier.

So there are **fifteen Resource entities, not sixteen**. The engine queries 16
suggesters; only 15 of them are gazetteers.

Ten of the sixteen build their record URL as a prefix plus the identifier, so
`partValueBaseURL` reconstructs it exactly. `whg` and `chgis` put the identifier
in the middle of theirs, and `hgis-indias`, `sedac-india`, `wikipedia` and
`llm-coords` publish no record URL at all. Those six get a Resource with no base
URL: the reference still records which source claimed what, which is the point,
and only the convenience link is lost.

## Settings

Two levels. The project-wide half is one row in the `settings` table under a
single `geocoding` key, not a settings group: `GET /settings/:key` is seeded
readable by every role, while `GET /settings/group/:groupkey` has no seeded
permission at all and a deny-all row has already been persisted for it — so a
group would be unreadable by everyone but an owner. The whole object is read and
written together in any case.

The **global** modal is owner-or-admin, alongside Global validations, and holds
the Concept and Resource assignments and the place-type dictionary. The query
context — region, period, language, kind of place — is edited on the Suggestions
panel rather than in a modal, beside the answer it produced; the **page** modal
holds the working preferences around it.

The **global** modal is reached from the menu's tools section beside Global
validations. It assigns thirty-five entities: the four coordinate roles, the four
accuracy values, the twelve place types and fifteen gazetteer Resources. Each
field selects an existing entity or creates one, so a fresh deployment needs no
seeding job — and the ten gazetteers whose record URL ends with the identifier
have their base URL prefilled from the engine's own builders.

The **page** modal, on the geocoding page itself, holds the preferences that are
about how this researcher works rather than about a place: running the engine on
selection, the accuracy a map click writes, what a quick geocode may accept, and
which language model the engine may use.

The split is not about trust. Creating an entity here follows the same rules as
everywhere else in the application — `POST /entities` is open to every role, and
nothing in this feature narrows that. What is owner-only is deciding *which*
Concept means `geo:x`, because that decision is what "geocoded" means. Were a
user able to override it, the same Location would read as geocoded for one person
and not for another, the counts would disagree, and the ungeocoded filter would
show two different lists to two people looking at one corpus.

The engine's address is **not** a setting. It is a build-time environment
variable, because it is deployment infrastructure rather than project
configuration, and because a settable address would let anyone point the page at
a host of their choosing and post research data to it.

The Resource rows are driven by the engine's own `GET /suggesters` list, so the
modal shows one row per gazetteer slug rather than asking anyone to type it.

Until the roles are assigned, the page still lists and filters Locations and
still writes a coordinate from a map click; only engine-driven geocoding is
disabled, with a message naming what is missing.

## The query context, and what each field weighs

Four fields, on the Suggestions panel rather than in a modal: they decide which
gazetteers the engine asks and how harshly it judges what comes back, so they are
the question and not a preference, and the moment they need changing is while a
wrong answer is on screen.

Each of the four carries its own **weight** beside it, because the engine scores
a source's relevance as one weighted mean over exactly these four dimensions.
The engine's own defaults are `region: 2`, `period: 1`, `language: 1`,
`placeType: 1` — region counts double because it is the only dimension
*measured*, from the source's own records binned into a 1° grid at startup, where
the other three are claims a source makes about itself. A dimension weighted to
**zero** leaves the score *and* loses its veto: region and period otherwise skip
an out-of-scope source outright, and a dimension weighted to nothing that went on
deciding which sources ran would be a filter nobody asked for. Zeroing region
therefore lets every gazetteer run on every request, which is slower — that is
the trade being asked for. Language and place type never skip a source either
way; they only lift one.

**The slider is not the engine's own number.** The four dimensions do not share
a default, so a slider showing `2` on region and `1` on the other three would
have its neutral point in a different place on every row and a column of four
would say nothing when read down. The slider runs 0 to 10 with the middle at
whatever *that* dimension's default is: 5 on region means 2, 5 on period means
1, 10 means double, 0 means off. The engine's number is on the tooltip, where it
is wanted once. `weightToStep`/`stepToWeight` round-trip exactly, so a slider
dragged away and put back sends nothing.

The weights are part of the engine's cache key, so they are sent only where one
has been moved off its default: a request stating the defaults in full asks the
same question from a second cache entry. They also make an answer stale, exactly
as the fields do, which is why `queryContextChanged` compares them. The slider
reports every position it passes through, so the save waits 400 ms for the drag
to stop — a write per tick would put a dozen updates of one field in flight, and
each success refetches the user and re-seeds the context, so the reply that
landed last rather than the position released on would be the one that stuck.

Because the weights and the region veto both move the scores, **a score is not
comparable across two different contexts.** One measured `Breslau` query scored
0.705 under the defaults and 0.656 under region alone. Nothing on this page pins
anything to a score value.

**Language holds a list.** It says what language the name being searched for is
probably in — not which languages to search, since the naming step generates
forms in other languages on purpose. Several are normal; none is no constraint.
The engine accepts a bare string as a one-element list and resolves both into
`query.criteria.languageIds`. A context saved before the field took several
still carries one language on its own `language` key; `contextLanguages` reads
that underneath the list and nothing writes it again.

### What the weights actually do, measured

Ten runs against the live engine, one query asked repeatedly with only
`contextWeights` changed. Every run is cold — the weights are part of the cache
key — so the differences are the weights and nothing else.

**The vetoes lift exactly as the engine documents.** On `Breslau` /
`silesia` / `1200-1400` / `de` / `settlement`:

| weights | sources asked | what was skipped |
|---|---|---|
| `2/1/1/1` (defaults) | 10 of 16 | 5 on region, 1 on period |
| `2/0/0/0` region only | 11 | 5 on region — the period veto is gone, so Pleiades runs |
| `0/1/1/1` region off | 13 | 3, all on period — CHGIS, Syriaca and native-land now run |
| `0/0/0/0` everything off | 16 | nothing |

Zeroing region really does let every gazetteer run, and the skip *reasons*
change with it: `hgis-indias` moves from "region silesia outside coverage" to
"period 1200–1400 outside coverage" as the operative veto shifts.

**The scores move a lot and the order below the top moves more.** `Breslau`
under the defaults scores 0.7571 and its runners-up are a diocese and two
American Breslaus; under `4/1/1/1` it scores **0.5979** and the runners-up are
Oleśnica, Boguszów-Gorce, Chojnów and Opole — Silesian towns promoted over
places called Breslau in Nebraska and Texas. That is the region weight doing
what it says.

It is also why the colour ramp is measured against the best answer in the same
response rather than on a fixed scale. A score orders answers within one query
and means nothing between two — the engine asks a different set of sources per
query, so the denominator moves, and the weights move it further. On a fixed
scale that same correct Breslau paints at 94% of the ramp under the defaults and
71% with region doubled: the right answer going visibly pale because a slider
moved. The share is a ratio to the leader, which is the engine's own unit —
`margin` is `(top − second) / top`, so a runner-up's share is exactly
`1 − margin`. What that gives up is a colour saying "this whole run is poor";
that is carried instead by the off-region mark, the band that reports no clear
winner, and the printed score.

**A weight can change whether a quick geocode will write at all.** This is the
consequence worth knowing. `Frankfurt` / `1200-1400` / `de` / `settlement`:

| region | top | second | clear winner? |
|---|---|---|---|
| none | Frankfurt am Main 0.6427 | Frankfurt an der Oder 0.5040 | yes — a quick geocode writes |
| `germany` | Frankfurt am Main 0.6205 | Frankfurt an der Oder 0.5888 | **no** — both are in Germany, so the region lifts them together |
| `germany`, region ×2 | Frankfurt am Main 0.6205 | Frankfurt an der Oder 0.5001 | still no |

Naming a region that contains *both* candidates makes the answer less decidable,
not more, and a run that wrote unattended before now refuses and asks for a
person. That is the correct refusal — there genuinely are two medieval German
Frankfurts — but it is not what a researcher expects from adding context, which
is why the refusal names the places it could not separate rather than counting
them. A refusal is read away from the answers it is about, in a toast or in a
batch report a hundred rows long, so the names have to travel with it. Where the
names collide the administrative path is put back: four answers for `Breslau`
are four identical words otherwise, and the path is the entire difference
between Pierce County Nebraska and Lavaca County Texas. Measured on the live
corpus: *"Aure (Møre og Romsdal, Norway) and Aure (Grand Est, France) are too
close to call"*, where the message used to read *"2 answers are within the
engine's own margin"*.

**The wrong region collapses everything.** `Frankfurt` under `silesia` returns
every answer marked off-region with scores of 0.06 and below, and a quick
geocode refuses on the off-region rule before the margin is even consulted.

**The region can be drawn.** The engine's region list does not cover everywhere,
so the map carries a control that arms a drag and turns the rectangle it produces
into `regionBbox`, `[minLon, minLat, maxLon, maxLat]`. The box stays drawn on the
map — dashed, under every mark, because it is a claim about where to look rather
than a boundary anyone surveyed — and the region picker gains a "custom region"
entry that is selected for as long as it is set.

`region` and `regionBbox` are **mutually exclusive**: the engine answers 422 to a
request carrying both rather than reconciling them. The page makes that refusal
unreachable rather than handling it — `regionToSend` yields nothing while a box
is in force — and keeps the named region stored underneath, so clearing the box
gives back whatever was named before. The other three refusals are checked in
`regionBox.ts` before the request is built: a drag that did not move, a drag
across the antimeridian, and coordinates off a wrapped world are all ordinary
gestures, and a rectangle nobody can see any more is the worst place to explain
one. The antimeridian check has to catch two shapes, not one: `boxFromDrag`
orders the corners, so a drag across the seam never arrives as a box whose west
edge is east of its east edge — it arrives as one running the long way round the
world, which the engine would accept and answer uselessly. A box wider than 180°
is refused for that reason; the widest region the engine names is about 77°.

The box persists as a personal default, like every other field on the panel —
reload the page and the rectangle is still there.

A drawn box is **weaker than a named region by construction**, and the panel says
so. A name is checked semantically against a source's declared ancestry; a box
carries no name, so geometry is all there is, and a rectangle that models an area
badly misleads the engine along its own corners — `europe`'s own box reaches into
Anatolia. Prefer a named region wherever one fits.

Measured, though, the penalty only appears where the rectangle is a poor model.
`Breslau` asked under `region: "silesia"` and asked again under a box holding
silesia's own bbox verbatim returned **the same answer, the same five scores to
four decimal places, the same order and the same ten sources**. The resolved
criteria differ exactly as they should — the named run carries `regionId` and a
box, the drawn run carries the box alone — so the mutual exclusion is doing its
work and costing nothing here. The caveat is real but it is about regions whose
rectangle lies, not about boxes as such.

The three refusals were confirmed against the live engine, and are the messages
the client-side checks exist to pre-empt:

- both fields: `send either region or regionBbox, not both — a named region already resolves to a box`
- zero area: `regionBbox has zero width or height`
- across the seam: `regionBbox crossing the antimeridian is not supported — split it into two requests`

## Which gazetteers the engine asks

Sixteen sources, and two places to switch one off: the global settings modal
sets it for the project, and *My geocoding preferences* sets it for one
researcher's own runs. A source switched off is never asked, so it costs nothing
and returns nothing — which is what makes this different from weighting a source
down. `sourceWeights` is what says "ask, but count it for less", and nothing on
this page sets that.

**The two layers union, where every other list field replaces.** A project
switching a source off is a statement about the corpus — it is not licensed for
this work, or it holds nothing this corpus is about — and that is not a
researcher's to overrule from their own preferences. So a personal list adds
refusals and cannot remove one; rows the project has settled are held down in
the personal modal and say who sets them, rather than silently refusing to move.
The personal modal is seeded with the project's entries taken back out, so
saving never copies a project decision into a personal list where it would
outlive the project changing its mind.

Switching one off makes an answer on screen stale, exactly as a context field
does: a source that was not asked cannot have contributed, and one switched back
on has not been asked yet.

**The project's list saves itself**, on its own button beside the section rather
than on the modal's footer Save. Every other section of the global modal assigns
an entity to a role, and that is what the footer writes; this says which sources
the engine may ask, which is a different kind of decision. One button covering
both would mean opening the modal to correct a Concept and, by pressing the only
button there is, also committing whatever the gazetteer list happened to say.
The section says so while it holds anything unwritten, and Cancel discards it
like anything else in the modal.

**Each row carries what the engine measured of that source**, from `footprint`
on `GET /suggesters`. `cells` counts the one-degree squares the source holds any
record in, so the pair says whether a source is large or merely spread —
`sedac-india` is 621,528 records in 340 cells and `native-land` is 2,057 in
1,292, one about a place and the other about everywhere and thin. That is
precisely what the region half of every score those two contribute is computed
from, and it is the half of the decision nobody can make from the name. The
record count is rounded and the cell count is not: cells top out under two
thousand and are the whole of what the column says, and rounding 1,292 to "1k"
makes a source about everywhere read like one about a single country.

A source with no local records is drawn as `declared` rather than as zero. It is
a remote API, so the engine falls back to how specific its own declaration is,
which always scores below a measurement — `gov` declares `silesia` and lands at
0.97 on a Silesian query, but the tightest thing it declares containing Portugal
is `europe`, so a Portuguese query lands at 0.82, barely above the 0.80 every
generic source gets.

The list falls back to a static set of names when the engine is unreachable, and
a source the engine has grown that the static list has never heard of is
appended rather than dropped — a screen that silently omitted one would offer no
way to switch it off.

## Counting what the list holds

The Locations panel's figures are its coordinate filter: `to do`, `done`,
`unreadable` and `all`, each carrying how many rows that segment would show under
everything else in force. Choosing `precise` moves all four together — `to do 0 ·
done 687 · unreadable 0 · all 687` — because they count one population.

That matters because the panel applies its filters in two places. Name, language
and status go to the server and change what comes back; coordinate state,
accuracy and kind of place are applied to what came back. A figure taken over the
server's answer, printed beside a control that filters in the browser, moves for
three of the six controls and sits still for the other three — and nothing on
screen says which kind of control was just used. A count printed beside a filter
is read as a promise about that filter, so each one counts the rows its own
segment shows and nothing wider.

The rest of the filters sit behind one control that says how many are in force
and names them: `1 filter · accuracy precise`. Five dropdowns each reading `any`
say only that five controls exist, and a list shortened by one of them explains
itself nowhere. Each field carries its own label for the same reason.

## While a request runs

A `/suggest` call takes five to ten seconds and returns once, so on its own it
offers nothing to show but elapsed time. The engine's `GET /state/stream` closes
that gap: a Server-Sent Events endpoint pushing the audit array once per second,
where each entry carries a `lastLog` naming the pipeline stage in progress.

The stream is process-global — every client's entries arrive and are filtered
here — so nothing in it may be treated as private.

Entries are matched on `requestId`, which the stream's opening frame carries and
which is the `id` on the audit entries. That identifies the request rather than
the browser that sent it, so the stage line cannot be driven by anything else
this browser, or anyone else's, has running.

`clientId` is therefore not an identifier here at all. The page sends a constant
`inkvisitor-<env>` for every browser: the engine's response cache excludes it
from the key, so varying it buys nothing, and a per-browser value would let the
engine's audit log correlate one researcher's whole session. What follows from
that is the activity view's scope — it lists every InkVisitor request the engine
has served, not only this tab's, and says so.

## The three frames of `/suggest/stream`, and the one that is the answer

The page runs `POST /suggest/stream` rather than `POST /suggest`. It answers in
up to three frames: `accepted`, before any work begins, carrying a `requestId`
and nothing else; `provisional`, once the gazetteers have answered and the
matches are grouped; and `final`, once the language model has rated the top ten.

Only `final` is an answer. `accepted` has no `suggestions` array at all, so
anything that renders it crashes rather than misleads, and an `error` frame is
not an answer either — the parser matches the phase by name and treats a stream
that ends without a `final` as a failure.

**Only `final` is promised to arrive.** The engine caches whole responses for six hours,
keyed on the query, and a cached answer has nothing provisional about it — it
arrives as a single `final` frame and the stream closes. Measured against the
live engine on the same query: cold, `provisional` at 7.6 s and `final` 3 ms
later; warm, `final` alone at 13 ms. So the rule is render on `final`, preview on
`provisional` if it comes, and never the other way round; code that waits for the
preview hangs on exactly the requests that were meant to be instant.

`final` replaces the list rather than patching it. The rating feeds the context
gate, which rescores and re-sorts, so a suggestion's position is not settled in
the preview — and `margin`, `contextEvaluated` and `log` are absent from the
preview altogether. A stream that closes after the preview is treated as a
failure here, because rendering an unsettled order as the answer is worse than
reporting that nothing arrived.

## What `cached` and the source timings mean

The `final` frame and `POST /suggest` both carry `cached`. Its consequences for
anything displayed:

- `elapsed_ms` is recomputed per request, so a cache hit honestly reports one or
  two milliseconds. That is a measurement of the cache, not of the work behind
  the answer, so the panel prints "from the engine's cache" in place of a
  duration rather than claiming a place was geocoded in 0.0 seconds.
- `sources[].ms` inside a cached response are the **original** request's
  timings, replayed verbatim. Nothing here renders them; anything that starts to
  must hide or label them when `cached` is true.
- A degraded answer is never cached, so every source a cached response names did
  in fact run.

Two optional flags travel on `sources[]` and are shown in the source report,
because neither is visible in `status`: `partial` means the source answered for
some name variants and not others, so its count is a floor; `benched` means the
source is out because its circuit breaker is open and will return within about a
minute, as against a source whose data failed to load and will not return
without an engine restart.

Nothing this page sends is user-specific — the query, the context vocabularies
and a `clientId` that only labels the engine's audit log — and the engine's cache
key excludes `clientId` deliberately. So two researchers asking the same question
share an answer, which is correct for a public gazetteer lookup. Anything
user-specific added to the request later has to be raised with the engine so it
enters the key.

## When the engine answers 200 and has not done the work

A rate-limited language model does not fail a request. `augment` falls back to
searching the bare name, `evaluate-context` leaves every `contextFit` null, and
what comes back is a plausible-looking result computed without either stage —
with HTTP 200 on it. Worse, that request returns **sooner**, because one name
variant skips most of the gazetteer queue, so any progress meter reading places
per minute speeds up at the moment quality collapses.

Three fields say it happened, and the panel prints a band above the list naming
whichever applies:

- `query.candidates[].llmProvider === "none"` — no name variants were generated,
  so only the name as written was searched.
- `contextEvaluated === false`, when the request carried any criterion at all —
  a region named or drawn, a period, a language, a kind of place. Those criteria
  were never weighed. Absent is not false: the preview frame omits the field
  because the stage has not run yet, which is why the band is computed on the
  final frame only. Each field is asked whether it *says* anything rather than
  whether it is there, because `language` holds a list and an empty list is as
  truthy as a full one.
- any source with `status: "failed"`, `partial` or `benched`.

Nothing here blocks accepting a suggestion — the researcher may recognise the
place regardless. What they cannot do is notice this by looking at the list.

## Recording what kind of place it is

A coordinate answers where; the twelve place types answer what. They are asked
for rather than inferred, in a second step after the accuracy: a suggestion
frequently carries no type of its own, and where it does, the type is what the
sources called the record rather than what the researcher knows the place to be.
The engine's own `placeType` is marked as a starting point and never preselected.

Three things follow from the vocabulary being the project's own:

- A type with no Concept assigned in the global settings is shown disabled, with
  the reason on it. Hiding it would misrepresent the vocabulary; offering it and
  refusing the write afterwards wastes the decision.
- "record place type" in the personal context turns the second step off. A
  project that has not mapped the twelve has nothing to write, and the coordinate
  is worth recording without them.
- The accuracy and place type props point at Concepts, not at Values this page
  owns. A write never offers a previous accuracy or a previous type for deletion:
  that Concept belongs to the vocabulary and to every other Location using it.

Setting a coordinate from the map asks the same two questions in the same order,
in the menu that opens where the click landed. Leaving the kind undecided there
keeps whatever the Location carries: a map click corrects where a place is and
says nothing about what it is.

The kind of place is corrected far more often than a coordinate is, so it can be
changed from the panel head without re-running the engine. That write keeps the
coordinate exactly as it stands — including the Value entities behind it, which
are reused rather than minted afresh, since orphaning a pair on every correction
accumulates on the most frequent operation.

The list filters by kind of place, and its options come from the Locations the
other filters leave rather than from the vocabulary. That matters because the
corpus does not state what a place is: a type appears only once a Location has
been geocoded through this page, so on the ungeocoded view — the page's default —
the control reads "no kinds recorded yet" and offers nothing, rather than
offering twelve kinds that each empty the list. Options taken from its own result
would instead vanish the moment one was chosen.

Each kind carries a mark from one uniform-stroke set drawn for interface sizes.
A detailed mark loses its detail at sixteen pixels and becomes a smudge — a
village of nine small roofs is a village at 48px and a grey blur in a list. The
mark is the control: in the
list, in the panel head, on a suggestion card and in the map's menu, clicking it
opens the same picker. Every option there carries its mark, its name and a line
saying what it covers, because the twelve are the engine's vocabulary rather than
ordinary English — "religious" covers a chapel and a monastery, and nobody
guesses that from the word.

A Location stating no kind draws a mark of its own rather than nothing. That is
the state most of the corpus is in, and a blank space reads as a rendering fault
rather than as a fact. Choosing it removes the kind: a value sets, `null` clears,
and only leaving the question alone — which is what a map click does — keeps what
is there.

## Reading the order on the map

A run ends with a list on the right and a map wherever the researcher last was,
which for an ungeocoded place is the whole of Europe. So the map flies to the
strongest suggestion when a run finishes, and a rating that changes which
suggestion leads moves it again.

What stops it moving for any other reason is a comparison rather than a
dependency array. A leader is a pair of numbers rebuilt on every render, so an
effect keyed on it would fly again on every keystroke elsewhere on the page and
take the map back from someone who had panned away; the flattened coordinate is
compared against the last one flown, and only a different one flies.

Every suggestion is drawn as the same mark. The number in it is the
identification and it is exact where a size ramp is approximate — a reader
comparing two discs is guessing at an order the label already states.

A click on the map draws a ring where it landed, dotted and unfilled, for as long
as the coordinate is being decided. The menu names the coordinate in figures,
which is a poor answer to "is that the spot I meant"; the point is a place on the
map and the map is where it can be checked. Unfilled because nothing has been
recorded there yet.

The order is drawn rather than the score. `score` orders one query and means
nothing between them, so a marker sized by it would claim a precision the number
does not carry; the position in the list is the only thing the engine asserts,
and it is ordinal. Two channels carry it, both readable without a legend: size,
because a bigger mark is a more important mark on every map anyone has seen, and
strength, because a faded mark is one the eye passes over. The ramp takes the same step
per place however long the list is, reaching its faintest by the sixth: beyond a
handful the differences stop meaning anything, and a ramp spread over thirty
draws the twentieth as a contender. Measured against the list's own length
instead, a two-suggestion response drew its runner-up at the faintest the scale
goes — the opposite of what the ramp is for. That faintest is a floor rather than
a vanishing point, because every mark on it is a place some gazetteer returned
and one the researcher may be about to choose.

Every marker carries its rank, permanently, because a card that says "3" beside a
map that numbers only its leader leaves the reader counting. The name arrives
with the names layer, which is where a crowded map is made readable again.

A number is dropped where it would land on one already drawn, recomputed at every
zoom — two places a kilometre apart share a pixel at one scale and are a screen
apart at another. Better-ranked numbers win, because rank is the only thing the
number says: dropping "1" so "17" could be read would invert it. The marker
itself is always drawn; only its number gives way.

Each card carries a control beside its coordinate that moves the map to it. Four
decimal places do not answer "where is that", and a map beside the list exists so
that nobody has to read them. Where the Location already has a coordinate the map
fits both in one view rather than centring on the suggestion: arriving on top of
a place 800 km away, at whatever zoom was already set, answers nothing.

What the control carries is which asking it is, counted rather than timestamped.
Two clicks inside one millisecond give the same timestamp twice and the second
would move nothing.

Colour is left out of it. A suggestion is black on the map and black on its card
— the same disc with the same number in it, so a marker and a row are
recognisably one thing rather than two things about the same place. Whether a
suggestion fell outside the query's region is a claim about the query rather than
about the rank, so it takes the one channel rank does not use: a dashed outline.

The same number appears on the card and on the marker, so the two panels can be
read against each other without counting rows.

## The panel's own shape

One accept control per card rather than four. Four buttons of near-identical text
six cards deep read as a wall instead of a choice, so the accuracy the card leads
with — precise, or approximate where the matches are scattered — is the button,
and the other three sit behind a caret beside it.

Each card lists the matches behind its suggestion as tags, and one tag is a whole
match: the gazetteer, and the name that gazetteer has for the place. That replaces
three lists which said overlapping things — the record names, the sources that
found them, and a table pairing the two.

Each gazetteer has its own colour, from the theme, so a row of tags says which
sources agree without anything being read. How the source matched the name is
drawn on the tag's border rather than written on it, at one weight throughout: a
continuous line where the returned name is the one searched for, dashed where the
source matched one of its own recorded name forms and calls the place something
else, dotted where it found the record by relevance with no exact form confirmed,
and dotted and faded for the model's own coordinate guess, which matched no
record at all. One weight because a thicker border reads as a heavier tag rather
than a better match, and pulls the eye for a reason nobody can name. Those four
distinctions are the engine's own vocabulary — `alias` and `fuzzy` are honest
reports about a search rather than judgements of a place — and spelled out on
twenty tags in a column they read as a verdict. The words are on each tag's
tooltip, with the coordinate that source gave.

The tags show the strongest few, with one control at the end of the row saying
what the rest are: `show all 74 matches`.

A suggestion is a row in a list of things to choose between. One is open at a
time, and a closed row carries what dismisses it without opening: its name, the
administrative path under it, how many sources stand behind it and how far apart
they are. Four suggestions called `Breslau` are one name and four regions —
Pierce Nebraska, Lavaca Texas, Ontario, Luzerne Pennsylvania — and the path is
the whole of what tells them apart, so it is never truncated.

Opening a row is the gesture that says it is being considered, which is why the
matches, the picture, the provenance and the control that writes are all on the
open card and none of them on a row being scanned. A response the engine did not
separate opens nothing at all: opening its first row would name a leader the
engine declined to name.

The line that names a place carries everything about the place itself: its rank,
the symbol for what kind of place it is, its name, its coordinate at the end
where it is read last — nobody scans a list of places by latitude — and a framed
control that moves the map to it. The kind symbol is an indicator and nothing
more: the same glyph opens the kind-of-place picker on a row of the locations
list, so a symbol that also travelled taught one mark two jobs on one screen. A
glyph alone reads as decoration, and the frame is what says a thing can be
pressed.

Four kinds of mark, told apart by shape rather than by weight. A measurement —
`10 sources`, `15.8 km apart` — has no edges, and its figure carries the weight
while its label sits quiet beside it. A record is a rectangle with a hairline,
the only outline in a card that carries information, since its line style says
how the source matched the name. A control is filled. And the card's own rule is
the strongest horizontal ink in the panel: drawn more faintly than its own
contents, a card stops being the thing the eye finds, and twenty-five of them
read as one field of pills rather than as a list.

How a score was arrived at is the tooltip on the score.How a score was arrived at is the tooltip on the score. It is one figure's
arithmetic and the least of what a card is read for, so it reads on the number it
explains rather than as two lines under the card.

The thumbnail grows on hover, because at 4.4 rem it says something is there
rather than showing anything anyone can judge from.

## When the engine did not separate them

Each card's score is drawn as a bar filled against the best score in the same
response — the only comparison a score supports, since its denominator moves
between queries. Where the leader is genuinely ahead this reads at a glance: on
the recorded Breslau response the leader's bar is full and the four suggestions
scoring 0.13 are a seventh of it.

Where it is not ahead, neither the bar nor the number is drawn. Every card within
`margin`'s own threshold of the top — 0.2, the same figure used for "clear
leader" — says "tied" in place of a score, under one line saying how many the
engine left tied. Drawing a flattened bar beside an unflattened decimal put two
marks saying "not ranked" next to one saying "0.52 beats 0.44", and the decimal
won: a number is read without being looked at. The figures stay on the tooltip,
where reading them is a decision rather than a glance. Measured against the live engine over
eighteen queries: seven fall under that threshold, and three suggestions for
`Newton` came back on identical scores and identical on every other published
field too — same source count, same context rating, same spread, none
off-region. Three English villages of that name, each attested twice. Drawing
those as 100, 94 and 93 would invite the eye to order three places the engine did
not order.

The band is measured from the top rather than chained from card to card. Chained,
a long tail of near-equal small scores links end to end: 188 of one query's
suggestions against 4 measured this way.

Two readings of the band are wrong and both were observed. A card outside it is
not thereby wrong — on `Kanth` the correct place, with six sources behind it,
sits third at 17% behind a two-source leader. And a band of one does not mean the
leader is right: `Zobten` returns a margin of 0.67 with a mountain in front, and
the settlement the name refers to appears nowhere in the sixteen suggestions. A
wide margin says the list is ordered, not that it contains the answer.

## What the map draws

The map draws the geocoded Locations the list is showing, and nothing else. The
filters on the left are the page's one statement about what is being worked on,
so a map holding places the list excludes answers the same question twice. Under
the default ungeocoded view that leaves the map empty of markers, which is
correct: none of those places has a coordinate yet.

Its own controls fold away behind one button and cover what is drawn rather than
what is recorded — the other locations, the suggestions being judged, and whether
names show without hovering. They are remembered per browser, because a
researcher who wants only the place in front of them is not making a decision
anybody else has to live with.

Hovering a mark says what it is. A Location the page holds shows its own tag,
its kind of place, how precisely it is known and its coordinate — enough to tell
several marks in one valley apart before choosing between them. A suggestion
under the pointer shows the whole card the panel would show, and takes
precedence where the two coincide, because a run's marks land on the places they
are candidates for. Clicking a Location's mark selects it, and the list scrolls
to put that row in the middle of its viewport: a map click that left the list
showing a different thousand rows would say nothing about which place it chose.
Selecting from the list itself moves nothing, since the row is already in sight.

Asking to see a point — from a suggestion card, or from the control on a
geocoded row — moves the map and rings what was asked for. The map arriving
somewhere is not on its own an answer to "which of these did I ask about": a
fitted pair puts two marks on screen and a settled view can hold a dozen, and
the one in the middle is only the one asked for when nothing was fitted. The
ring is drawn under every mark, wide enough to leave daylight around one even at
its narrowest, in ink and its ground rather than in any of the colours that
carry a claim about a suggestion. It is not a target for a click or a hover, and
asking for another point moves it rather than adding a second.

It breathes, and then it goes. A ring that is merely present is read once and
stops being seen, so it widens and narrows about its own radius while it is up —
which is also what tells a reader who looked away that this ring is the answer to
their last question and not one left over. It is drawn from a clock rather than
counted in frames, so a tab nobody is looking at drops the movement instead of
slowing it down. It fades over its last three-quarters of a second and is gone
six seconds after it was asked for, so a ring is never left standing over a
Location that is no longer the one being read.

The basemap is a vector style, so what it draws is switchable too. Three groups
are: transport (roads, railways, paths, airports and their names), built-up
detail (buildings, parks, points of interest), and land cover and use. Four
things are not, and carry no switch at all — administrative borders, place
names, water and waterways, and the shaded relief. Those are what a place is
judged against, so a control that could remove them would only ever be a way to
break the page quietly. Extruded buildings are never drawn: they are a 3D
reading of a map being used flat, and they cover the marks this page puts on it.

The groups are read from the style the server sends, by the source layer each of
its layers draws from, rather than from the style's own layer names — `place`
and `boundary` belong to the OpenMapTiles schema and are shared by every style
built on it, while a name like `label_country_2` belongs to one style and is
exactly what a restyle changes. A layer whose source the page does not recognise
is left visible: a style carrying something new shows it, rather than hiding part
of a map for a reason no switch explains.

## Reading a suggestion's spread

`spreadKm` is the **median** distance from a suggestion's highest-scoring match
to each of the others behind it — so half of them sit further out than the number
says, and it is not the width of the group. The engine publishes no field that
is. It can also exceed the merge radius: grouping anchors on the first match and
never recentres, so a chain of matches each within the radius of its neighbour
spans more than the radius.

What it is measured against is `mergeRadiusKm`, on the response. That is derived
from the place type rather than fixed — 7.5 km for a church, 12.5 km for a
fortress, 25 km for a settlement, 150 km for a region — so any threshold written
as a constant is wrong for every type but one.

Two readings of `spreadKm` are wrong and are foreclosed here. A suggestion with
one match has no pair to measure and the engine reports zero; two thirds of all
suggestions are in that state, and rendering them as `0.0 km apart` reads as
unanimity. Those say "spread not measured".

The other is a scattered group taken as a precise coordinate. The threshold is
**0.6 × `mergeRadiusKm`**. Its calibration is empirical and was done on
settlements: across four live queries — 623 suggestions — 15 km is the 90th
percentile, and 15 km is 0.6 of a settlement's 25 km radius. Above it the group
is held together by the merge rather than by agreement: Wrocław at 15.8 km across
eleven sources includes the city, its airport and its football stadium. Expressed
as a fraction the same calibration gives 4.5 km for a church, which is where a
scatter most plainly means two different buildings, and 90 km for a region.

Such a card marks the spread and leads with `approximate`. It still offers
`precise`, because a scattered group can be the right place and the researcher
may know it is.

Where the response carries no `mergeRadiusKm` — the preview frame does not, and
neither does an older engine — the threshold falls back to **10 km**, giving
6 km. That is the tighter reading: 10 is below every radius the engine uses
except a church's and a fortress's, so a card judged against the fallback is
flagged sooner rather than passed over in silence, and the final frame corrects
it a moment later.

## Geocoding without reading the run

Most Locations in a corpus are unambiguous, and reading every one of them to
press the same button is work that need not be done. Two controls skip the
reading: a quick action on a row, and a geocode over the marked set. Both ask
the engine, decide from the answer and write it; neither shows the run.

What they will accept is a setting rather than a rule, because it is a judgement
about the corpus. **Clear winner only** — the default — writes nothing unless the
engine separated one answer from the rest by more than its own margin, and
reports the others as skipped for a person to work through. **Highest score**
writes the engine's first answer every time. The default is the strict one: a
batch that guessed would be discovered a thousand rows later, so the setting
that runs without being chosen has to be the one that fails safely.

One refusal outranks the strategy. An answer the engine placed outside the
query's region is not taken however far ahead it scores, because a score says
how well the sources agree about a name and not whether the place they agree on
belongs in this corpus. These are demoted rather than hidden — material does
cross its own borders, and a person weighing one has the region on screen — so a
second setting turns the refusal off for a corpus that is genuinely spread.

Three things they never decide. The accuracy comes from the spread of the
suggestion's own matches, the same reading the card leads with — how precisely a
coordinate locates a place is a fact about the sources, not a preference. The
kind of place is written only where the corpus named one to stand for all of
them, and is otherwise left alone. And neither ever replaces a coordinate that is
already recorded: the batch runs over the marked Locations that have none, and
the bar says how many that is before the button is pressed.

A run is sequential and can be stopped. What it wrote is unmarked and everything
else stays marked, so the set left behind is exactly the Locations still wanting
a person — including the ones a stopped run never reached.

A window reports on the run. It opens when the run starts and again when it ends,
and can be closed in between without stopping anything: the point of a batch is
not having to watch it, and the verdict is what was being waited for. It lists
every Location the run will visit, in the order it will visit them, from the
first frame — a list that grew a row at a time would move under the eye exactly
while it was being read. Each row carries its state and, where nothing was
written, the reason. The marked bar keeps the summary and opens the window again,
and outlives the marks themselves, since a run unmarks what it writes.

The refusals are the work a run leaves behind, so the window is where they are
settled, one press at a time: a control walks to the next Location still wanting
a decision, opens its answers alone and closes the last one behind it, and
choosing an answer moves on by itself. It wraps, so twelve refusals are twelve
presses rather than eleven and a scroll. A Location's name opens it in the panel
and leaves the window, for a refusal that six answers cannot settle — the panel
holds the whole run with its evidence, which is a different question from "which
of these". Each carries the answers the run already paid for — the strongest few,
with their pictures, their scores and where the sources place them — and clicking
one writes it. Off-region answers are not among them: a run that refused to write
one unasked would be making that refusal decorative by then offering it as the
thing to click. A Location that was written shows the answer it was given instead,
which is the one cheap check worth having on a decision nobody read.

The bolt on a row is the same act for one Location, and it keeps none of the
bookkeeping. A record of steps and a window over it exist so that ninety answers
can be read after the fact; one answer wants telling, not filing. So the bolt
becomes a spinner while the engine is being asked — and the row's controls are
held open while it spins, since pressing the bolt disables it and a pointer that
has moved on would leave the wait with nothing to show it — and a message says
how it went: where it landed, or that it was left for the researcher and why.
Clicking that second message opens the Location, which is the whole of what a
refusal leaves to do. It is offered on a Location that already has a coordinate
too, and so is the batch: the engine's answer moves on, and re-checking is the
same act as checking. Neither stops to ask before replacing, because the question
was answered by pressing the control; what was there before is kept in this
browser's write history.

## Finding a place without the full pipeline

`/suggest` is for judging where a historical name belongs. Moving the map, and
naming the point a click landed on, are different questions and use the engine's
`GET /search` and `GET /reverse` instead: one external gazetteer plus the
engine's local indexes, no candidate generation, no scoring, answering in about
a tenth of a second.

That is fast enough to run while someone types, given a debounce. The external
source bills against a daily allowance rather than a per-second limit, so the
constraint is total volume rather than typing speed.

## Feedback to the engine

Every constant in the engine's scoring model is a hand-picked guess, and they
cannot be checked by reasoning — the model it replaced returned 22 suggestions
tied at one value on a real query, which no desk analysis predicted. Researcher
choices are the only thing that produces the missing input, so the page reports
them from the first day rather than as a later addition.

Accepting a suggestion posts it to `POST /feedback` with the query and the
verbatim `suggestions` array. Nothing recorded there influences scoring at
runtime.

Rejecting every suggestion posts `chosen: null` with a **reason** — `not-found`,
`ambiguous` or `other` — and an optional note. That control exists because
without it the stream is positive-only, and a positive-only stream can show the
ranking was sometimes right but never that it was wrong. The category is not
dressing on the note: hundreds of free-text remarks written mid-task are not
countable, and the two failures it separates argue for opposite fixes —
`not-found` is missing coverage, `ambiguous` is the engine behaving correctly on
thin evidence.

There is no "ranked too low" reason. The whole array is stored verbatim, so an
accepted suggestion's position is computable afterwards.

`chosen`, `query` and `suggestions` are required even on a rejection, so the
response is held in state until the researcher decides rather than discarded once
it has rendered.

## How the page is put together

One collection feeds everything. `useGeocodingBrowse` runs the Location search
and the batched lookup of the Value entities its props point at, and both the
list and the map read the result — a map showing different places from the list
beside it is the failure that arrangement forecloses.

`useGeocodingConfig` resolves the three settings layers into one object, per
field, so a partial personal override never blanks a project assignment.

The write is split in two on purpose. `planGeocodingWrite` is pure: it decides
what will be created, what will be replaced and what will be deleted, and refuses
with a reason when the project has no Concept for something. `executeGeocodingWrite`
performs it, and its ordering is the only safety available — see below.

`useGeocodingSuggest` allows one engine request at a time. That is not a
simplification: the engine generates each audit entry's id internally and never
returns it, so two concurrent requests from one browser cannot be told apart on
the progress stream.

## Why the write is ordered the way it is

`PUT /entities/:entityId` persists the raw request body, and the store replaces
arrays rather than merging them. So a `props` array built from a snapshot read
before someone else's write silently erases that write — and between this page's
read and its write sit an engine call of several seconds and however long a
researcher spends deciding. There is no version field on entities and no conditional update.

Therefore: create every child entity first, re-read the Location, refuse if its
coordinate changed, write it exactly once, and only then delete the Values the
write displaced — through the route that refuses an entity something else still
refers to, never a raw delete.

That is not atomic. It narrows the window from minutes to milliseconds and turns
a silent loss into a refusal the researcher sees.

An EDIT audit records the new state and not the old one, and the restore route
recreates deleted entities rather than undoing edits, so what a coordinate used
to be exists nowhere the platform keeps. The page therefore records the previous
props and references itself before writing.

## The legacy coordinates

1100 Locations carry coordinates in an older shape: a single Concept
`coordinates (lat; long)` whose Value label holds both numbers as one
`"44.49715; 11.34687"` string, with a child prop `localisation precision` valued
`precise` or `approximate`.

That shape cannot be adopted by pointing settings at it, because one Value entity
cannot serve two sibling props. 1099 of them have been converted into the four-prop
form — accuracy taken from the precision child where it existed (681 `precise`,
361 `approximate`) and `unknown` for the 57 without one. The remaining Location,
`diocesis Tudensis`, has a coordinate prop whose value points at nothing.

The legacy props were left in place rather than deleted, so the conversion is
reversible and the original strings stay readable. They are inert: nothing reads
them, because geocoded state is read from the three configured Concepts above.

## Future versions

Each item is here because it was considered and deliberately deferred, not
because it was overlooked. Numbers persist: an item that moves into the release
leaves its number behind rather than freeing it, so gaps are expected. F7 and F17
became the feedback section above.

**F1 · More than one coordinate per Location.** A disputed identification, or a
place that moved, has no representation — the props are zero-or-one, and
re-geocoding overwrites in place.

**F2 · Coordinates on classes other than Location.** An Event or a Person's
birthplace would use the same prop convention.

**F3 · Batch auto-geocode.** The engine now ships a runner (`batch/run.ts` in its
repo) that takes the corpus as JSONL and resumes on re-run, so the open work on
this side is exporting the corpus with its criteria rather than writing a driver.
Criteria are not decoration: they are the difference between `Kanth` resolving to
Kąty Wrocławskie and to an unrelated village.

Measured by the engine on 40 Silesian placenames: 11.4 locations per minute, or
about two hours for 1391. The ceiling is Nominatim's one request per second,
enforced by a process-global queue, so **concurrency does not help** — two
workers ran at the same rate and degraded 5% of results doing it. Any run must
send `providers: ["mistral"]`: that provider's allowance is per minute, where the
default's is per day and works out at roughly 87 places. Leave `providers` unset
for a researcher at a keyboard, where the default answers a single request faster
and no daily budget is in reach.

Whatever drives such a run must record the degradation checks above per row and
re-run those rows. A corpus that silently contains bare-name geocodes is worse
than one with visible holes.

**F4 · Server-side pagination of the locations list.** The list is filtered and
paged in the browser; 2491 Locations fit comfortably, a much larger corpus would
not.

**F6 · `add note` on a Location.** The wireframe's other non-obvious row action
has nowhere to go under the current entity model. Its sibling, `flag as
ambiguous`, is built — it is the `ambiguous` reason on a rejection.

**F9 · Custom map overlays.** User-added GeoJSON and WMS layers, and the storage
that lets a layer definition outlive the browser session. The basemap panel is
the surface these would join: it already switches groups of layers and remembers
the choice per browser.

**F10 · Per-territory context overrides.** A default region, period, language and
place type per territory, so a register from Languedoc does not inherit the
project-wide region.

**F11 · Choosing which sources become references.** Every contributing source is
written today. Preselecting the informative ones, or letting the researcher pick,
would keep the reference list readable.

**F12 · Recording which engine run produced a coordinate.** Engine version, run
timestamp, and the margin and agreement at the time. The audit trail records that
a coordinate changed, not what the evidence was.

**F13 · A finer owner/user split.** Roles are owner-only and context is personal,
which is the coarse version. Some context — a project-wide period, say — arguably
belongs to the project rather than to whoever set it last.

**F14 · Removing the legacy coordinate props.** They are inert once the
conversion is trusted, and 1099 Locations showing two coordinate representations
in the detail panel is clutter.

**F15 · Unattended acceptance.** The button that would accept the leading
suggestion without review is not built, and neither is the condition under which
that is safe. The condition under which that is safe should be configurable, and
must not be a threshold on `score`, which is not comparable between places. The
engine states that every constant it would be built from is a hand-picked guess,
so whatever condition ships must say so where the researcher can read it.

**F16 · Typing a coordinate.** Clicking the map sets one, and the detail box
takes one by hand, but there is no field on this page for pasting a pair of
numbers from a source that is not a gazetteer.
