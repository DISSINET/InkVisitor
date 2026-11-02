/**
 * Splits the wildcard markers off a search label: a leading `*` drops the start
 * anchor, a trailing `*` the end anchor.
 * @returns [label without the markers, left anchor, right anchor]
 */
export function prepareLabel(label: string): [string, string, string] {
  let leftWildcard = "^",
    rightWildcard = "$";

  if (label[0] === "*") {
    leftWildcard = "";
    label = label.slice(1);
  }

  if (label[label.length - 1] === "*") {
    rightWildcard = "";
    label = label.slice(0, -1);
  }
  // escape problematic chars - messes with regexp search
  // label = regExpEscape(label.toLowerCase());

  return [label, leftWildcard, rightWildcard];
}

/**
 * The label a query builder node is narrowed by, matched as the main search box
 * matches what is typed into it: entity search's word-by-word match with a
 * trailing `*` always on, so "gi" finds "given name". A leading `*` lifts the
 * word-start anchor as well.
 * @returns prepareLabel's parts, undefined when no text is left to match
 */
export function nodeLabel(label: string | undefined): [string, string, string] | undefined {
  const [text, left] = prepareLabel(label?.trim() ?? "");
  return text ? [text, left, ""] : undefined;
}
