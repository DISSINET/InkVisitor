/**
 * Upper bound on documents in one /documents/export-batch request. The server
 * rejects a longer list; the client splits a larger selection into requests of
 * this size, so both sides have to read the same number.
 */
export const MAX_DOCUMENTS_EXPORT_BATCH = 50;

/**
 * Bounds on a saved query's stored tree, checked in SavedQuery.isValid. The
 * tree is client-supplied JSON that any logged-in user may POST and that a
 * shared query then serves to everyone, and the request body limit is 150mb -
 * so the walk over it needs a bound of its own rather than inheriting the
 * body's.
 *
 * The depth is not a policy choice: each query level costs several levels of
 * document nesting, and RethinkDB refuses to store a saved query nested deeper
 * than this ("Nesting depth limit exceeded"). Checking it up front turns that
 * write failure into a validation error.
 */
export const MAX_SAVED_QUERY_DEPTH = 6;
export const MAX_SAVED_QUERY_NODES = 1000;

/**
 * Apostrophes, quotation marks and the characters typed in their place (primes,
 * accents, fullwidth forms). Label search treats all of them as one character,
 * single and double alike.
 */
const QUOTE_CHARS =
  "'‘’‚‛‹›ʼʻ`´′＇" +
  '"“”„‟«»″＂';

const QUOTE_MARKS = new RegExp(`[${QUOTE_CHARS}]`, "g");

/**
 * Replaces each quote char in a regex source with a class matching every quote
 * char. The class is valid in JavaScript, RethinkDB (RE2) and PostgreSQL patterns.
 */
export const quotesToPattern = (source: string): string =>
  source.replace(QUOTE_MARKS, `[${QUOTE_CHARS}]`);

/** Replaces every quote char with `'`, for matching that compares text without a regex. */
export const foldQuotes = (text: string): string => text.replace(QUOTE_MARKS, "'");
