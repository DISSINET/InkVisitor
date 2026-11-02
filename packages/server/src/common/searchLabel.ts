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
 * The label a query builder node is narrowed by, matched like the Explorer
 * label filter: anywhere in any of the entity's labels, `*` markers ignored.
 * @returns the text to match without anchors, undefined when there is none
 */
export function nodeLabel(label: string | undefined): string | undefined {
  return prepareLabel(label?.trim() ?? "")[0] || undefined;
}
