/**
 * Where each gazetteer's records live, so a stored identifier can be turned back
 * into a link.
 *
 * Read from the engine's own URL builders rather than guessed. Ten of the
 * sixteen suggesters put the identifier at the end of their URL, which is what
 * `IResourceData.partValueBaseURL` plus the reference value reconstructs.
 *
 * Two build a URL the identifier sits inside — `whg` as
 * `/places/{id}/portal` and `chgis` as `?n={id}&fmt=json` — and four publish no
 * record URL at all. Those six get a Resource with no base URL: the reference
 * still records which source claimed what, and only the link is lost.
 *
 * `llm-coords` is absent deliberately. It is the model's own coordinate guess
 * rather than a gazetteer, has no record to cite, and never receives a
 * reference.
 */
export const GAZETTEER_BASE_URLS: Record<string, string> = {
  geonames: "https://www.geonames.org/",
  gov: "https://gov.genealogy.net/item/show/",
  idai: "https://gazetteer.dainst.org/place/",
  nominatim: "https://nominatim.openstreetmap.org/ui/details.html?osmtype=N&osmid=",
  pleiades: "https://pleiades.stoa.org/places/",
  syriaca: "https://syriaca.org/place/",
  tgn: "https://vocab.getty.edu/page/tgn/",
  viabundus: "https://www.viabundus.eu/edit/place/",
  wikidata: "https://www.wikidata.org/wiki/",
  "native-land": "https://native-land.ca/maps/territories/",
};

/** Every gazetteer the engine can cite, in the order the settings modal lists them. */
export const GAZETTEERS = [
  "wikidata",
  "geonames",
  "nominatim",
  "tgn",
  "whg",
  "gov",
  "viabundus",
  "idai",
  "syriaca",
  "pleiades",
  "chgis",
  "wikipedia",
  "hgis-indias",
  "sedac-india",
  "native-land",
];
