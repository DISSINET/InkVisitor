import { quotesToPattern } from "@inkvisitor/shared/constants";

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
 * word-start anchor as well.
 * @returns prepareLabel's parts, undefined when no text is left to match
 */
export function nodeLabel(label: string | undefined): [string, string, string] | undefined {
  const [text, left] = prepareLabel(label?.trim() ?? "");
  return text ? [text, left, ""] : undefined;
}

/** the spellings a plain lowercase letter in a search label also finds */
const ACCENT_CLASSES: Record<string, string> = {
  a: "[aàáâãäå]",
  c: "[cçč]",
  d: "[dď]",
  e: "[eèéêëě]",
  i: "[iìíîï]",
  n: "[nñň]",
  o: "[oòóôõö]",
  r: "[rř]",
  s: "[sš]",
  t: "[tť]",
  u: "[uùúûüů]",
  y: "[yýÿ]",
  z: "[zž]",
};

const accentsToPattern = (label: string): string =>
  label
    .split("")
    .map((char) => ACCENT_CLASSES[char] || char)
    .join("");

/**
 * The letters of a word: ASCII and the accented Latin blocks, without the × and ÷
 * that sit among them. Spelled out because `\w` means something else in each
 * engine, ASCII in RE2 and locale-dependent in PostgreSQL.
 */
const WORD_CHARS = "a-zA-Z0-9\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u024F";
const WORD_BREAK = `[^${WORD_CHARS}]`;
const REGEX_CHARS = /[.*+?^${}()|[\]\\]/g;

/**
 * The label regex of the entity search, valid in RethinkDB (RE2) and PostgreSQL:
 * word boundaries on a side without a wildcard, a class per letter with accented
 * spellings so a plain letter finds them, a class for any quote mark, and glue
 * between words. `(?i)` is an embedded option in both engines.
 * @param label typed text without its wildcard markers, matched literally
 * @param left "^" for a word boundary on the left, "" for none
 * @param right "$" for a word boundary on the right, "" for none
 */
export function labelPattern(label: string, left: string, right: string): string {
  const start = left === "^" ? `(^|${WORD_BREAK})` : left;
  const end = right === "$" ? `($|${WORD_BREAK})` : right;
  const literal = label.toLowerCase().replace(REGEX_CHARS, "\\$&");
  const body = quotesToPattern(accentsToPattern(literal))
    .split(" ")
    .join(`(${WORD_BREAK}+[${WORD_CHARS}_]+)*${WORD_BREAK}+`);
  return `(?i)${start}${body}${end}`;
}
