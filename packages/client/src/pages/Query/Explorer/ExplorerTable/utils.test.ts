import { IEntity, IResponseQueryEntity, IResponseQuerySubProp } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { describe, expect, it } from "vitest";
import { estimateColumnWidth, estimateSubPropsWidth, getInlineSubProps } from "./utils";

const entity = (label: string): IEntity => ({ id: label, labels: [label] }) as IEntity;

const column = {
  id: "col",
  type: Explore.EExploreColumnType.EPV,
  editable: false,
} as Explore.IExploreColumn;

const row = (
  value: IEntity,
  subProps?: IResponseQuerySubProp[],
): IResponseQueryEntity => ({
  entity: entity("row"),
  columnData: { col: [value] },
  columnSubProps: subProps ? { col: { [value.id]: subProps } } : undefined,
});

// "distance" (8 chars) and "206" (3 chars) tags: 24px marker + 6px per char
const distance: IResponseQuerySubProp = {
  type: entity("distance"),
  value: entity("206"),
  children: [],
};

describe("estimateSubPropsWidth", () => {
  it("adds the bar, the level label and the type and value tags", () => {
    expect(estimateSubPropsWidth([distance])).toBe(6 + 20 + 72 + 4 + 42);
  });

  it("adds a nested group after its subproperty", () => {
    const withUnit = { ...distance, children: [{ type: entity("unit"), children: [] }] };
    expect(estimateSubPropsWidth([withUnit])).toBe(6 + 20 + 72 + 4 + 42 + 4 + (6 + 20 + 48));
  });

  it("separates sibling subproperties", () => {
    expect(estimateSubPropsWidth([distance, distance])).toBe(6 + 20 + 118 + 8 + 118);
  });
});

describe("getInlineSubProps", () => {
  const withUnit = { ...distance, children: [{ type: entity("unit"), children: [] }] };

  it("shows a lone pair whole", () => {
    expect(getInlineSubProps([distance])).toEqual({ inline: [distance], hasHidden: false });
  });

  it("shows only the first pair and hides its siblings", () => {
    expect(getInlineSubProps([distance, withUnit])).toEqual({
      inline: [distance],
      hasHidden: true,
    });
  });

  it("hides what is nested under the first pair", () => {
    expect(getInlineSubProps([withUnit])).toEqual({ inline: [distance], hasHidden: true });
  });
});

describe("estimateColumnWidth", () => {
  it("counts only the first pair plus the overflow chip when more subproperties hide", () => {
    const praha = entity("Praha");
    expect(estimateColumnWidth(column, [row(praha, [distance, distance])], 5)).toBe(
      26 + 58 + 144 + 4 + 18,
    );
  });

  it("widens a property value column by the subproperties shown after the value", () => {
    const praha = entity("Praha");
    expect(estimateColumnWidth(column, [row(praha)], 5)).toBe(160);
    expect(estimateColumnWidth(column, [row(praha, [distance])], 5)).toBe(26 + 58 + 144 + 4);
  });
});
