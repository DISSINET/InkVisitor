/**
 * Splits the wildcard markers off a search label: a leading `*` drops the start
 * anchor, a trailing `*` the end anchor. A run of whitespace becomes one space,
 * since the patterns read every space as a word boundary.
 * @returns [label without the markers, left anchor, right anchor]
 */
export function prepareLabel(label: string): [string, string, string] {
  label = label.replace(/\s+/g, " ");
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
 * word-start anchor as well. The text is regex-escaped, as the search box's
 * labelOrId is, so "(" or "c++" match literally.
 * @returns prepareLabel's parts, undefined when no text is left to match
 */
export function nodeLabel(label: string | undefined): [string, string, string] | undefined {
  const [text, left] = prepareLabel(label?.trim() ?? "");
  return text ? [text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), left, ""] : undefined;
}

/**
 * Apostrophes, quotation marks and the characters typed in their place (primes,
 * accents, fullwidth forms). Label search treats all of them as one character,
 * single and double alike.
 */
const QUOTE_CHARS =
  "'‘’‚‛‹›ʼʻ`´′＇" +
  '"“”„‟«»″＂';

/**
 * Regex character class matching every quote char when `char` is one of them.
 * The class is valid in JavaScript, RethinkDB (RE2) and PostgreSQL patterns.
 */
export const quoteCharPattern = (char: string): string | undefined =>
  QUOTE_CHARS.includes(char) ? `[${QUOTE_CHARS}]` : undefined;
