import { Explore } from "@inkvisitor/shared/types/query";
import { describe, expect, it } from "vitest";
import { fillColumnWidths, getTagLabelMaxWidth } from "./utils";

const column = (
  id: string,
  type: Explore.EExploreColumnType,
  editable = false,
): Explore.IExploreColumn => ({ id, name: id, type, editable, params: {} });

const origins = column("origins", Explore.EExploreColumnType.EPO);
// a narrow type: 160px when no width was estimated for it
const status = column("status", Explore.EExploreColumnType.EST);

describe("fillColumnWidths", () => {
  it("a single column takes all the room the entity column leaves", () => {
    expect(fillColumnWidths([origins], { origins: 200 }, 1000, 280)).toEqual({ origins: 720 });
  });

  it("columns share the free room in equal parts on top of their own widths", () => {
    expect(fillColumnWidths([origins, status], { origins: 200 }, 1000, 280)).toEqual({
      origins: 380,
      status: 340,
    });
  });

  it("columns wider than the room keep their own widths", () => {
    expect(fillColumnWidths([origins, status], { origins: 700 }, 1000, 280)).toEqual({
      origins: 700,
      status: 160,
    });
  });

  it("an unmeasured room leaves the widths as they are", () => {
    expect(fillColumnWidths([origins], { origins: 200 }, 0, 280)).toEqual({ origins: 200 });
  });
});

describe("getTagLabelMaxWidth", () => {
  it("a column at its estimated width keeps the default label width", () => {
    expect(getTagLabelMaxWidth(origins, 200, 2)).toBeUndefined();
  });

  it("a wide column splits its room between the tags it shows", () => {
    expect(getTagLabelMaxWidth(origins, 720, 2)).toBe(310);
  });

  it("an editable column keeps room for the suggester and the unlink buttons", () => {
    const editable = column("value", Explore.EExploreColumnType.EPV, true);
    expect(getTagLabelMaxWidth(editable, 720, 2)).toBe(231);
  });
});
