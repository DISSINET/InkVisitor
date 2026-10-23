import { IEntity, IResponseQueryEntity, IResponseQuerySubProp } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { describe, expect, it } from "vitest";
import { estimateColumnWidth, hasSubProps } from "./utils";

const entity = (label: string): IEntity => ({ id: label, labels: [label] }) as IEntity;

const column = {
  id: "col",
  type: Explore.EExploreColumnType.EPV,
  editable: false,
} as Explore.IExploreColumn;

const distance: IResponseQuerySubProp = {
  type: entity("distance"),
  value: entity("206"),
  children: [],
};

// labels long enough to hit the tag cap: 24px marker + 75px label each
const praha = entity("Praha hlavni mesto");
const brno = entity("Brno statutarni mesto");

const row = (subPropsByValue?: Record<string, IResponseQuerySubProp[]>): IResponseQueryEntity => ({
  entity: entity("row"),
  columnData: { col: [praha, brno] },
  columnSubProps: subPropsByValue ? { col: subPropsByValue } : undefined,
});

describe("hasSubProps", () => {
  it("is true only when some value has subproperties", () => {
    expect(hasSubProps(undefined)).toBe(false);
    expect(hasSubProps({ [praha.id]: [] })).toBe(false);
    expect(hasSubProps({ [praha.id]: [], [brno.id]: [distance] })).toBe(true);
  });
});

describe("estimateColumnWidth", () => {
  it("counts the values only", () => {
    expect(estimateColumnWidth(column, [row()], 5)).toBe(26 + 2 * (99 + 4));
  });

  it("adds the overflow chip when a value has subproperties", () => {
    expect(estimateColumnWidth(column, [row({ [brno.id]: [distance] })], 5)).toBe(
      26 + 2 * (99 + 4) + 18,
    );
  });
});
