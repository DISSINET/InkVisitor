/**
 * Minimal XML syntax highlighting for the RAW (XML) view (#3269).
 *
 * Not a parser: a small character state machine good enough to colour the
 * markup people actually see in documents — entity anchors (`<id>`, `</id>`)
 * and imported editions / pre-annotated text (`<w lemma="x" elvl="1">`).
 * Malformed markup just colours oddly; it never throws.
 */

export type XmlTokenKind = "text" | "tag" | "attr" | "quote" | "value";

/** Colours per token kind; `text` falls back to the annotator's font colour. */
export interface XmlSyntaxColors {
  /** Brackets, tag name, `/`, `=` */
  tag: string;
  /** Attribute names (anything else inside a tag) */
  attr: string;
  /** The quote characters around an attribute value */
  quote: string;
  /** Text between the quotes */
  value: string;
}

/** A run of same-kind characters on one line: columns `[start, end)`. */
export interface XmlTokenRun {
  kind: XmlTokenKind;
  start: number;
  end: number;
}

/**
 * Where the tokenizer stands between characters. Carried across line ends,
 * since a long tag wraps onto the next visual line.
 */
export interface XmlTokenizerState {
  inTag: boolean;
  /** Still in the tag name (before the first whitespace). */
  inName: boolean;
  /** Open quote character while inside an attribute value, else null. */
  quote: string | null;
}

export const initialXmlTokenizerState = (): XmlTokenizerState => ({
  inTag: false,
  inName: false,
  quote: null,
});

// A `<` opens a tag only when followed by something a tag can start with, so
// a stray "a < b" in the text stays text.
const TAG_START = /[A-Za-z0-9_:/!?]/;

/**
 * Run the state machine over one line, mutating `state`. `nextLine` is the
 * following line, peeked at when the line ends in `<`. `push`, when given,
 * receives the kind of every column.
 */
function scanXmlLine(
  line: string,
  nextLine: string | undefined,
  state: XmlTokenizerState,
  push?: (kind: XmlTokenKind, col: number) => void
): void {
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (!state.inTag) {
      const next = i + 1 < line.length ? line[i + 1] : nextLine?.[0];
      if (ch === "<" && next !== undefined && TAG_START.test(next)) {
        state.inTag = true;
        state.inName = true;
        push?.("tag", i);
      } else {
        push?.("text", i);
      }
      continue;
    }

    if (state.quote !== null) {
      if (ch === state.quote) {
        state.quote = null;
        push?.("quote", i);
      } else {
        push?.("value", i);
      }
      continue;
    }

    if (ch === ">") {
      state.inTag = false;
      state.inName = false;
      push?.("tag", i);
    } else if (ch === '"' || ch === "'") {
      state.quote = ch;
      state.inName = false;
      push?.("quote", i);
    } else if (/\s/.test(ch)) {
      state.inName = false;
      push?.("text", i);
    } else if (state.inName || ch === "/" || ch === "=" || ch === "?") {
      push?.("tag", i);
    } else {
      push?.("attr", i);
    }
  }
}

/**
 * Advance `state` past one line without building its runs, for lines that are
 * only walked to seed the tokenizer. Mutates and returns `state`.
 */
export function advanceXmlState(
  state: XmlTokenizerState,
  line: string,
  nextLine?: string
): XmlTokenizerState {
  scanXmlLine(line, nextLine, state);
  return state;
}

/**
 * Tokenize consecutive lines, carrying state from one to the next (a `<` at a
 * line end peeks at the next line's first character). Returns the runs per
 * line and the state after the last line.
 */
export function tokenizeXmlLines(
  lines: string[],
  startState: XmlTokenizerState = initialXmlTokenizerState()
): { runs: XmlTokenRun[][]; state: XmlTokenizerState } {
  const state = { ...startState };
  const runs: XmlTokenRun[][] = [];

  for (let li = 0; li < lines.length; li++) {
    const lineRuns: XmlTokenRun[] = [];
    scanXmlLine(lines[li], lines[li + 1], state, (kind, col) => {
      const last = lineRuns[lineRuns.length - 1];
      if (last && last.kind === kind && last.end === col) {
        last.end = col + 1;
      } else {
        lineRuns.push({ kind, start: col, end: col + 1 });
      }
    });
    runs.push(lineRuns);
  }

  return { runs, state };
}
