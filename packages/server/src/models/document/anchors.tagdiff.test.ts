import "ts-jest";
import { AnchorsNode } from "./anchors";

describe("AnchorsNode.diffAnchorTagsInContent", () => {
  test("detects an anchor added by wrapping plain text (e.g. new statement)", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent("foo bar", "foo <S1>bar</S1>")
    ).toEqual({ added: true, removed: false, attributesChanged: false });
  });

  test("detects an anchor that wraps an existing anchor as an addition", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent(
        "<C1>foo</C1>",
        "<S1><C1>foo</C1></S1>"
      )
    ).toEqual({ added: true, removed: false, attributesChanged: false });
  });

  test("detects an anchor removal", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent("<C1>foo</C1>", "foo")
    ).toEqual({ added: false, removed: true, attributesChanged: false });
  });

  test("text edit inside an anchor is neither add nor remove", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent("<C1>foo</C1>", "<C1>foobar</C1>")
    ).toEqual({ added: false, removed: false, attributesChanged: false });
  });

  test("no content change yields no add/remove", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent("<C1>foo</C1>", "<C1>foo</C1>")
    ).toEqual({ added: false, removed: false, attributesChanged: false });
  });

  test("simultaneous add and remove are both reported", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent(
        "<C1>foo</C1> bar",
        "foo <C2>bar</C2>"
      )
    ).toEqual({ added: true, removed: true, attributesChanged: false });
  });

  test("adding a second occurrence of an existing anchor counts as an addition", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent(
        "<C1>foo</C1>",
        "<C1>foo</C1> <C1>bar</C1>"
      )
    ).toEqual({ added: true, removed: false, attributesChanged: false });
  });

  test("changing an anchor attribute is reported as attributesChanged", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent(
        '<C1 elvl="1">foo</C1>',
        '<C1 elvl="2">foo</C1>'
      )
    ).toEqual({ added: false, removed: false, attributesChanged: true });
  });

  test("adding an attribute to an existing anchor is an attribute change", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent(
        "<C1>foo</C1>",
        '<C1 elvl="1">foo</C1>'
      )
    ).toEqual({ added: false, removed: false, attributesChanged: true });
  });

  test("attribute change is reported even when the inner text also changed", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent(
        '<C1 elvl="1">foo</C1>',
        '<C1 elvl="2">bar</C1>'
      )
    ).toEqual({ added: false, removed: false, attributesChanged: true });
  });

  test("text edit with unchanged attributes is not an attribute change", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent(
        '<C1 elvl="1">foo</C1>',
        '<C1 elvl="1">bar</C1>'
      )
    ).toEqual({ added: false, removed: false, attributesChanged: false });
  });

  test("an added anchor takes precedence over attribute reporting", () => {
    expect(
      AnchorsNode.diffAnchorTagsInContent(
        '<C1 elvl="1">foo</C1>',
        '<C1 elvl="2">foo</C1> <C2>bar</C2>'
      )
    ).toEqual({ added: true, removed: false, attributesChanged: false });
  });
});
