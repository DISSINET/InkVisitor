/**
 * The asymmetrical-anchor check (#3306) pairs tags in document order: a closing
 * tag only closes a same-name opening tag that comes before it. Equal counts of
 * opening and closing tags are not enough.
 */
import Text from "./lib/Text";

const validate = (raw: string) =>
  new Text(raw, 1000)
    .validateAnchors()
    .map(({ type, segmentIndex, position }) => ({ type, segmentIndex, position }));

describe("validateAnchors pairs tags in document order", () => {
  test("a closing tag before its opening tag makes both orphans", () => {
    expect(validate("</x> text <x>")).toEqual([
      { type: "orphaned-closing", segmentIndex: 0, position: 0 },
      { type: "orphaned-opening", segmentIndex: 0, position: 10 },
    ]);
  });

  test("the reversed pair is reported across paragraphs too", () => {
    expect(validate("</x> one\ntwo <x>")).toEqual([
      { type: "orphaned-closing", segmentIndex: 0, position: 0 },
      { type: "orphaned-opening", segmentIndex: 1, position: 4 },
    ]);
  });

  test("a valid pair followed by a reversed pair reports only the reversed tags", () => {
    expect(validate("<x>a</x></x><x>")).toEqual([
      { type: "orphaned-closing", segmentIndex: 0, position: 8 },
      { type: "orphaned-opening", segmentIndex: 0, position: 12 },
    ]);
  });

  test("a pair spanning paragraphs is valid", () => {
    expect(validate("<x>one\ntwo</x>")).toEqual([]);
  });

  test("tags of different names pair independently", () => {
    expect(validate("<x><y></x></y>")).toEqual([]);
  });

  test("issues are listed in document order", () => {
    expect(validate("<y> </x> <x>")).toEqual([
      { type: "orphaned-opening", segmentIndex: 0, position: 0 },
      { type: "orphaned-closing", segmentIndex: 0, position: 4 },
      { type: "orphaned-opening", segmentIndex: 0, position: 9 },
    ]);
  });
});
