# What's changed [Oct 19, 2026]

## Geocoding (#313)

- New Geocoding page: lists Locations, asks the HGA-Engine for coordinates, and saves the chosen one as a GeoJSON geometry prop on the Location
- Suggestions are ranked and shown on a MapLibre map, with links to their gazetteer records (GeoNames, Wikidata, Pleiades, WHG)
- Each answer has an editable query context beside it (kind of place, region drawn as a rectangle on the map), kept per user
- Draw a point, line or polygon for a Location by hand when no suggestion fits
- Batch geocoding for many Locations at once; unambiguous ones are taken automatically, the rest are left for review
- Filter the list by Territory, author, accuracy, kind of place, language and status; recently geocoded Locations stay at hand
- The kind of place is stored as a Classification relation; place types, accuracy values and gazetteers are set in the global geocoding settings
- Map layers panel, place search on the map, dark basemap, and engine health shown as a dot

## Other improvements and fixes

- The login logo band is coloured by instance, like the app header

## Deployment

- The client build requires `HGA_ENGINE_URL`; add it to the env file and to the `CLIENT_ENV_*` secret for each mode in CI, or the build fails.
- If a database holds geocoding data in the earlier shape, run `migrateGeocodingGeometryJob` (`geo:x`/`geo:y` props to one `geo:geometry` prop) and `migrateGeocodingPlaceTypesJob` (`geo:type` metaprop to a Classification relation).
