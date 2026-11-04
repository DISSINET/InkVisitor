# Custom map layers (design, not built)

The Geocoding map's layers panel offers the page's own marks and two basemap
switches. This document describes two more sections: **web maps** (a layer read
from a URL) and **local geo data** (a file the researcher opens), each with hide
and restyle. Project owners can also define default layers, shown to every user
and not removable by them, managed in the global geocoding settings.

Nothing here is implemented. It records the design and the findings behind it so
the next phase starts from them.

## What already does this job

Nothing on the page. Two existing pieces are reused:

- the `settings` row under key `geocoding` (`IGeocodingSettings`), which every
  logged-in role can read and an owner can write;
- `GeocodingSettingsModal`, the owner's editor for that row.

## Mechanism

- **XYZ and WMS** are added to MapLibre as `raster` sources. A WMS URL uses the
  `{bbox-epsg-3857}` token. A WMTS REST template is an XYZ template and is
  supported as one; WMTS key-value requests are not.
- **GeoJSON by URL** is added as a native `geojson` source.
- **KML, GPX and shapefile** are added later, each as an importer loaded with a
  dynamic `import()`. Neither parser is a dependency today.
- **User layers** live in the browser (`localStorage`), like the map's switches.
- **Owner layers** live in a new `layers` array on `IGeocodingSettings`, so every
  user receives them with the settings they already load.
- Each layer carries: id, title, kind, URL, opacity, visibility, and a style
  where the kind has one (colour, line width, fill opacity).

## Invariants

1. Owner layers are URLs only. No file content is stored in the settings row.
2. A WMS layer's tile size must equal the raster source's `tileSize`; MapLibre
   defaults to 512, so a 256 px request on a 512 source is drawn at the wrong
   scale.
3. User layers are rebuilt from React state on every style load. A theme switch
   replaces the style and drops every layer and source added to it.
4. Layer ids carry the `geocoding-` prefix; the dark recolour inverts every layer
   without it.
5. Layers sit under the page's own marks and above the basemap's labels, placed
   with a `beforeId` that exists in the current style.
6. `readSettings` must carry every key it receives. Today it rebuilds only
   `{roles, context}` (`geocodingSettings.ts`), so any roles or context save
   would delete the owner's layers.
7. Layer settings are validated on read, because the server stores any JSON.
8. Each layer has an error state, and a user can hide an owner layer without
   being able to remove it.
9. An `http:` URL is refused on the https site, with a message. A source in a
   CRS the renderer cannot draw shows as an error rather than drawing in the
   wrong place.

## Findings from the audit

- The settings write is allowed for admins and, by an exception in `acl.ts`, the
  owner; reading is open to every role. No new route is needed for URL-only
  layers.
- Raster layers placed on top hide place names, which is why invariant 5 sets a
  position rather than appending.
- The server accepts any JSON in the settings row and has no size limit worth
  relying on for file content, which is why invariant 1 refuses stored files.

## Open questions (decide before building)

1. **Where do owner file layers live?** Recommended: URL-only defaults, so an
   owner points at hosted GeoJSON and nothing new is stored. The alternative is
   storing file data on the server, which needs a new store, a new route (with
   an agreed role list, see the project guidance on endpoints), and a size limit.
2. **Phase 1 scope.** Recommended: XYZ, WMS and GeoJSON URL, with KML, GPX and
   shapefile imports as a second step.
3. **WMS layer entry.** Type the layer name by hand, or read the server's
   capabilities document to offer a list. The second needs the server to send
   CORS headers.
4. **Servers without CORS headers.** Whether to add a server-side proxy for tile
   and GeoJSON requests. It is a new endpoint and an access decision: it lets a
   logged-in user make the server fetch an arbitrary URL, so it would need a
   host allow-list.
5. **Size of local files.** The largest file the page will accept before
   refusing, since it is parsed in the browser.

## Order of work

1. Settings: carry the `layers` key through `readSettings`, with validation and a
   test that a roles save keeps layers.
2. Layer model and the pure functions that turn a layer into a MapLibre source
   and layer, with tests for the WMS tile-size and ordering invariants.
3. Panel sections for web maps and local data, with hide and restyle.
4. Owner editor in the global geocoding settings.
5. KML, GPX and shapefile importers.
