import { describe, it, expect } from "vitest";
import { Query, Explore } from "@inkvisitor/shared/types/query";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import { isQueryRequestEmpty } from "./utils";

const makeRoot = (params: Query.INodeParams = {}): Query.INode => ({
  id: "root",
  type: Query.NodeType.E,
  params,
  operator: Query.NodeOperator.And,
  edges: [],
});

const makeExplore = (
  filters: Explore.IExploreSearchFilter[] = [],
): Explore.IExplore => ({
  view: { mode: Explore.EViewMode.Table, columns: [] },
  filters,
  sort: undefined,
  limit: 1,
  offset: 0,
});

const makeEdge = (): Query.IEdge => ({
  id: "e1",
  type: Query.EdgeType["R:"],
  params: {},
  logic: Query.EdgeLogic.Positive,
  node: makeRoot(),
});

describe("isQueryRequestEmpty", () => {
  it("is empty for the default root (all classes, no edges, no filters)", () => {
    expect(
      isQueryRequestEmpty(makeRoot({ entityClasses: classesAll }), makeExplore()),
    ).toBe(true);
  });

  it("is empty when entity classes are absent or empty (any class)", () => {
    expect(isQueryRequestEmpty(makeRoot({}), makeExplore())).toBe(true);
    expect(
      isQueryRequestEmpty(makeRoot({ entityClasses: [] }), makeExplore()),
    ).toBe(true);
  });

  it("is not empty when classes are narrowed to a subset", () => {
    expect(
      isQueryRequestEmpty(
        makeRoot({ entityClasses: [EntityEnums.Class.Person] }),
        makeExplore(),
      ),
    ).toBe(false);
  });

  it("is not empty when the root targets an entity or label", () => {
    expect(
      isQueryRequestEmpty(makeRoot({ entityId: "abc" }), makeExplore()),
    ).toBe(false);
    expect(
      isQueryRequestEmpty(makeRoot({ label: "caesar" }), makeExplore()),
    ).toBe(false);
  });

  it("treats a whitespace-only label as empty", () => {
    expect(
      isQueryRequestEmpty(makeRoot({ label: "   " }), makeExplore()),
    ).toBe(true);
  });

  it("is not empty when there are query edges", () => {
    const root = makeRoot({ entityClasses: classesAll });
    root.edges = [makeEdge()];
    expect(isQueryRequestEmpty(root, makeExplore())).toBe(false);
  });

  it("is not empty when there are explore filters", () => {
    expect(
      isQueryRequestEmpty(
        makeRoot({ entityClasses: classesAll }),
        makeExplore([{ type: Explore.SearchOption.Label, label: "x" }]),
      ),
    ).toBe(false);
  });
});
