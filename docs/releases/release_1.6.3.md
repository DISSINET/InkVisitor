# What's changed [Oct 17, 2026]

## Geocoding

- New Geocoding page: lists Locations, asks the HGA-Engine for coordinates, and saves the chosen one as a GeoJSON geometry prop on the Location (#3267)
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

- `HGA_ENGINE_URL` and `HGA_ENGINE_API_KEY` are now server environment variables (compose `.env`, kube ConfigMap); the client build no longer reads them, so they can be dropped from the `CLIENT_ENV_*` secrets. The browser reaches the engine through `/api/geocoding/*`.
- The reverse proxy in front of the server must not buffer `/api/geocoding/suggest/stream` and `/api/geocoding/state/stream` and must allow a read timeout of at least 5 minutes on them (nginx honours the `X-Accel-Buffering: no` header the server sends; other proxies need it in their config).
- The engine key shipped inside every earlier client bundle, so after this deploy rotate the InkVisitor entry in the engine's API keys and take the engine's public ingress down (or firewall it to the InkVisitor server); until both are done the engine is still reachable with the old key.
- If a database holds geocoding data in the earlier shape, run `migrateGeocodingGeometryJob` (`geo:x`/`geo:y` props to one `geo:geometry` prop) and `migrateGeocodingPlaceTypesJob` (`geo:type` metaprop to a Classification relation).
