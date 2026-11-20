import { IResponseTree } from "@inkvisitor/shared/types";
import { ITerritoryFilter } from "types";
import { markNodesWithFilters } from "./TerritoryTreeFilterUtils";

const node = (label: string): IResponseTree =>
  ({ territory: { id: label, labels: [label] }, children: [] }) as unknown as IResponseTree;

const matches = (filter: string, label: string) =>
  markNodesWithFilters(node(label), { filter } as ITerritoryFilter, [], new Set()).foundByRecursion;

describe("territory tree label filter", () => {
  it("matches a part of the label in any case", () => {
    expect(matches("PRES", "heretics presence")).toBe(true);
    expect(matches("absence", "heretics presence")).toBe(false);
  });

  it("treats quote marks and apostrophes as interchangeable", () => {
    expect(matches("heretics' presence", "heretics’ presence")).toBe(true);
    expect(matches("heretics’", "heretics' presence")).toBe(true);
    expect(matches('"Pater', "„Pater noster“")).toBe(true);
    expect(matches("heretics' presence", "heretics presence")).toBe(false);
  });
});
