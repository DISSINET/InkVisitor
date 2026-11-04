/**
 * Splitting a suggestion's label into the place and where it is.
 *
 * The engine returns one string with the administrative path in brackets —
 * `Breslau (Pierce, Nebraska, ... World)`. Four suggestions for one query read
 * as four identical names until the brackets are separated out, and the
 * brackets are the whole of what tells them apart: Pierce County Nebraska from
 * Lavaca County Texas from Ontario.
 *
 * Not every source writes them. `Roman Catholic Diocese of Görlitz` has no
 * bracket and no region, which is a fact about that record rather than a case to
 * paper over.
 */

export interface SuggestionLabel {
  name: string;
  /** The administrative path, or empty where the source gave none. */
  region: string;
}

export const splitLabel = (label: string): SuggestionLabel => {
  const raw = (label || "").trim();
  const open = raw.indexOf(" (");
  if (open < 0 || !raw.endsWith(")")) {
    return { name: raw, region: "" };
  }
  const name = raw.slice(0, open).trim();
  const region = raw.slice(open + 2, -1).trim();
  // a bracket that empties the name is not an administrative path, it is the
  // whole label wearing brackets
  return name ? { name, region } : { name: raw, region: "" };
};
