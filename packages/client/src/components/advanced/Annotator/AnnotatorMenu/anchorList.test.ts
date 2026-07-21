import { Tag } from "@inkvisitor/annotator/src/lib";
import { IEntity } from "@inkvisitor/shared/types";
import { describe, expect, it } from "vitest";
import { hasAnchorsWithoutElvl, resolveAnchors } from "./anchorList";

const anchor = (tagContent: string) => new Tag(0, tagContent);

// resolveAnchors only checks that the entry is truthy, so the shape is irrelevant
const loaded = {} as IEntity;

describe("hasAnchorsWithoutElvl", () => {
  it("is false when every anchor carries an elvl", () => {
    expect(hasAnchorsWithoutElvl([anchor('personA elvl="1"'), anchor('personB elvl="2"')])).toBe(
      false,
    );
  });

  it("is true when an anchor has no elvl attribute at all", () => {
    expect(hasAnchorsWithoutElvl([anchor('personA elvl="1"'), anchor("personB")])).toBe(true);
  });

  it("treats an empty elvl as missing", () => {
    expect(hasAnchorsWithoutElvl([anchor('personA elvl=""')])).toBe(true);
  });

  it("is false for no anchors", () => {
    expect(hasAnchorsWithoutElvl([])).toBe(false);
  });
});

describe("resolveAnchors", () => {
  it("pairs each anchor with its tag name", () => {
    const anchors = [anchor('personA elvl="1"'), anchor("personB")];
    expect(resolveAnchors(anchors, { personA: loaded, personB: loaded })).toEqual([
      { anchor: anchors[0], anchorTagName: "personA" },
      { anchor: anchors[1], anchorTagName: "personB" },
    ]);
  });

  it("drops anchors whose entity is still pending", () => {
    const anchors = [anchor("personA"), anchor("personB")];
    expect(resolveAnchors(anchors, { personA: loaded, personB: false })).toEqual([
      { anchor: anchors[0], anchorTagName: "personA" },
    ]);
  });

  it("drops anchors whose entity is absent from the map", () => {
    expect(resolveAnchors([anchor("personA")], {})).toEqual([]);
  });

  it("keeps every occurrence when the same entity is anchored twice", () => {
    const anchors = [anchor("personA"), anchor("personA")];
    expect(resolveAnchors(anchors, { personA: loaded })).toHaveLength(2);
  });

  it("returns nothing for no anchors", () => {
    expect(resolveAnchors([], { personA: loaded })).toEqual([]);
  });
});
