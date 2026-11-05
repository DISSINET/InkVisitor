# What's changed [Oct 25, 2026]

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
- Each gazetteer in the settings and in My preferences shows, under its name, what it covers (time, geography, topic), how long it usually takes ("local", "quick", "moderate", "slow", and "often fails" where it does) and how many records it holds. The engine measures the time itself, so a source shows none until it has been asked a few times
- A new Location can be made from the Geocoding page with the `+` beside the search field. It opens the Explorer's create dialog for Locations, then the list is widened to every Location and the new one is selected

## Deployment

- The accuracy of existing Locations is moved under their coordinate by `nestGeocodingAccuracyJob`. It lists the Locations it will not touch, and a second run finds nothing to move. On a database that still holds coordinates as `geo:x` and `geo:y`, run `migrateGeocodingGeometryJob` first.
- Assign the "epistemic source" Concept in Global geocoding (owner), under "concept for the source of knowledge"; until it is assigned the gazetteers are recorded as references only. Then run `addGeocodingSourcesJob` to name the gazetteers of Locations geocoded before, from their references. It credits a gazetteer only when the Value holding its record id was created within five minutes of the Value holding the coordinate, so a reference added by hand later is not credited.
- Both jobs write a Location only if it has not changed since the job read it, and refuse a database where one Concept serves two of the coordinate roles. They are for RethinkDB; a PostgreSQL deployment takes the earlier shape across with its migration, or until each Location is saved by the page.
- Explorer queries and validation rules that expect the accuracy as a first-level property no longer find it once it is nested, and have to be rewritten.
- A location type covers its Concept and everything below it, so assign a narrow Concept ("settlement", not "area" or "place"): a broad one takes in every Location classified under anything beneath it. The settings table shows how many are inferred.
- No new environment variables. `GET /entities/classified-under` is open to every logged-in user in code (`middlewares/acl.ts`), so no ACL row or job is needed for it.
