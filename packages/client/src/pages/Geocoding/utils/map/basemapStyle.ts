/**
 * The basemap. One style, in both themes.
 *
 * Free and keyless, and built on the OpenMapTiles schema, which is what
 * `basemapLayers` classifies against — a style on another schema would load and
 * draw but leave the layer switches with nothing to switch.
 *
 * The dark theme recolours this rather than loading a dark style of its own:
 * see `darkBasemap`. The two themes then draw the same map, with the same layers
 * under the same switches.
 */
export const BASEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
