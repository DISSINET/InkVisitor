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
