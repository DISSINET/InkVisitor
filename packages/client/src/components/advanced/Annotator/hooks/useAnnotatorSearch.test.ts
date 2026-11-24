import { Annotator, EditMode, Occurrence } from "@inkvisitor/annotator/src/lib";
import { render, Rendered } from "pages/Geocoding/utils/test/renderForTest";
import { createElement, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isSearchTermInRange,
  MAX_SEARCH_TERM_LENGTH,
  MIN_SEARCH_TERM_LENGTH,
  SEARCH_REFRESH_AFTER_EDIT_MS,
  useAnnotatorSearch,
} from "./useAnnotatorSearch";

describe("isSearchTermInRange", () => {
  it("runs terms from the minimum to the maximum length", () => {
    expect(isSearchTermInRange("a".repeat(MIN_SEARCH_TERM_LENGTH))).toBe(true);
    expect(isSearchTermInRange("a".repeat(MAX_SEARCH_TERM_LENGTH))).toBe(true);
  });

  it("skips a term shorter than the minimum", () => {
    expect(isSearchTermInRange("a".repeat(MIN_SEARCH_TERM_LENGTH - 1))).toBe(false);
  });

  it("skips a term longer than the maximum, such as a whole selected document", () => {
    expect(isSearchTermInRange("a".repeat(MAX_SEARCH_TERM_LENGTH + 1))).toBe(false);
  });

  it("keeps the maximum well inside what a regular expression can compile", () => {
    // every search escapes the term into one RegExp, the whole-word modes wrap
    // it in lookarounds; the worst case at the cap must still compile
    const escaped = "(".repeat(MAX_SEARCH_TERM_LENGTH).replace(/[(]/g, "\\(");
    expect(() => new RegExp(`(?<![\\p{L}])${escaped}(?![\\p{L}])`, "giu")).not.toThrow();
  });
});

const hit = (start: number): Occurrence => ({
  segmentIndex: 0,
  lineIndex: 0,
  endLineIndex: 0,
  start,
  end: start + 3,
});

// the annotator as the hook uses it: a mode, and a search whose hits the test
// swaps to stand for an edited text
const fakeAnnotator = (mode: EditMode) => {
  const annotator = {
    text: { mode },
    hits: [hit(0), hit(10)],
    search: vi.fn(() => annotator.hits),
    clearSelection: vi.fn(),
    draw: vi.fn(),
  };
  return annotator;
};

interface Probe {
  annotator: ReturnType<typeof fakeAnnotator>;
  term: string;
}
// Holds the search state the Annotator component holds around the hook. The
// button shows that state as its text, and a click on it is a text edit.
const Probe = ({ annotator, term }: Probe) => {
  const [occurences, setOccurences] = useState<Occurrence[] | null>(null);
  const [, setActiveOccurence] = useState(0);
  const [, setSelectedText] = useState("");
  const [isSelectionDeferred, setIsSelectionDeferred] = useState(false);
  const { dropHitsOnEdit } = useAnnotatorSearch({
    annotator: annotator as unknown as Annotator,
    debouncedSearchTerm: term,
    isRegexMode: false,
    width: 100,
    isExtendToWholeWordMode: false,
    isWholeWordOnlyMode: false,
    isCaseSensitiveMode: false,
    annotatorMode: annotator.text.mode,
    setSearchOccurences: setOccurences,
    setSearchActiveOccurence: setActiveOccurence,
    setSelectedText,
    setIsOccurenceSelectionDeferred: setIsSelectionDeferred,
  });
  return createElement(
    "button",
    { onClick: dropHitsOnEdit },
    JSON.stringify({ occurences, isSelectionDeferred }),
  );
};

describe("useAnnotatorSearch after a text edit", () => {
  let view: Rendered | null = null;

  const mount = (mode: EditMode) => {
    vi.useFakeTimers();
    const annotator = fakeAnnotator(mode);
    view = render(createElement(Probe, { annotator, term: "abc" }));
    return annotator;
  };

  const probed = (): { occurences: Occurrence[] | null; isSelectionDeferred: boolean } =>
    JSON.parse(view?.one("button")?.textContent ?? "");
  const editText = () => view?.run(() => view?.one("button")?.click());
  const wait = (ms: number) => view?.run(() => vi.advanceTimersByTime(ms));
  const editingPauses = () => wait(SEARCH_REFRESH_AFTER_EDIT_MS);

  afterEach(() => {
    view?.unmount();
    view = null;
    vi.useRealTimers();
  });

  it("drops the hits at once, before any new search", () => {
    const annotator = mount(EditMode.RAW);
    expect(probed().occurences).toEqual([hit(0), hit(10)]);

    editText();

    expect(probed().occurences).toBeNull();
    expect(annotator.search).toHaveBeenCalledTimes(1);
  });

  it("searches the edited text once the editing pauses", () => {
    const annotator = mount(EditMode.RAW);

    annotator.hits = [hit(4)];
    editText();
    editingPauses();

    expect(probed().occurences).toEqual([hit(4)]);
  });

  it("waits for the pause after the last of several edits", () => {
    const annotator = mount(EditMode.RAW);

    editText();
    wait(SEARCH_REFRESH_AFTER_EDIT_MS - 1);
    editText();
    wait(SEARCH_REFRESH_AFTER_EDIT_MS - 1);

    expect(probed().occurences).toBeNull();
    expect(annotator.search).toHaveBeenCalledTimes(1);
  });

  it("defers the selection of the active hit, which would take the caret", () => {
    mount(EditMode.RAW);

    editText();
    editingPauses();

    expect(probed().isSelectionDeferred).toBe(true);
  });

  it("ends the deferral when the searched term changes", () => {
    const annotator = mount(EditMode.RAW);
    editText();
    editingPauses();

    view?.update(createElement(Probe, { annotator, term: "abcd" }));

    expect(probed().isSelectionDeferred).toBe(false);
  });

  it("keeps the hits in highlight mode, where the text hides the tags", () => {
    const annotator = mount(EditMode.HIGHLIGHT);

    editText();
    editingPauses();

    expect(probed().occurences).toEqual([hit(0), hit(10)]);
    expect(probed().isSelectionDeferred).toBe(false);
    expect(annotator.search).toHaveBeenCalledTimes(1);
  });
});
