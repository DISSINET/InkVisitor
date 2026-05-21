import "ts-jest";
import { AnchorsNode } from "./anchors";

describe("AnchorsNode.diffAnchorTagsInContent", () => {
  test("detects an anchor added by wrapping plain text (e.g. new statement)", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent("foo bar", "foo <S1>bar</S1>")
    ).toEqual({ added: true, removed: false });
  });

  test("detects an anchor that wraps an existing anchor as an addition", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent(
        "<C1>foo</C1>",
        "<S1><C1>foo</C1></S1>"
      )
    ).toEqual({ added: true, removed: false });
  });

  test("detects an anchor removal", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent("<C1>foo</C1>", "foo")
    ).toEqual({ added: false, removed: true });
  });

  test("text edit inside an anchor is neither add nor remove", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent("<C1>foo</C1>", "<C1>foobar</C1>")
    ).toEqual({ added: false, removed: false });
  });

  test("no content change yields no add/remove", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent("<C1>foo</C1>", "<C1>foo</C1>")
    ).toEqual({ added: false, removed: false });
  });

  test("simultaneous add and remove are both reported", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent(
        "<C1>foo</C1> bar",
        "foo <C2>bar</C2>"
      )
    ).toEqual({ added: true, removed: true });
  });

  test("adding a second occurrence of an existing anchor counts as an addition", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent(
        "<C1>foo</C1>",
        "<C1>foo</C1> <C1>bar</C1>"
      )
    ).toEqual({ added: true, removed: false });
  });
});
