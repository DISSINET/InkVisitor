import { describe, it, expect } from "vitest";
import { Query, Explore } from "@inkvisitor/shared/types/query";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import {
  countNodeFilters,
  isQueryRequestEmpty,
  QUERY_NAME_MAX_LENGTH,
  suggestQueryName,
} from "./utils";

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

describe("countNodeFilters", () => {
  it("counts each node filter that is set once, whatever its list length", () => {
    expect(countNodeFilters({})).toBe(0);
    expect(countNodeFilters({ label: "  " })).toBe(0);
    expect(
      countNodeFilters({
        entityStatuses: ["0" as EntityEnums.Status, "1" as EntityEnums.Status],
        entityLanguages: ["eng" as EntityEnums.Language],
        label: "gi",
      }),
    ).toBe(3);
  });
});

describe("suggestQueryName", () => {
  const C = EntityEnums.Class;
  const labels: Record<string, string> = { sex: "sex", female: "female", heretic: "heretic" };
  const labelOf = (id: string) => labels[id];
  const node = (
    params: Query.INodeParams,
    edges: Query.IEdge[] = [],
    operator = Query.NodeOperator.And,
  ): Query.INode => ({ id: "", type: Query.NodeType.E, params, operator, edges });
  const edge = (
    type: Query.EdgeType,
    target: Query.INode,
    logic = Query.EdgeLogic.Positive,
  ): Query.IEdge => ({ id: "", type, params: {}, logic, node: target });

  it("names the root by its classes, its pinned entity, or any entity", () => {
    expect(suggestQueryName(node({ entityClasses: [C.Person] }), labelOf)).toBe("Person");
    expect(suggestQueryName(node({ entityClasses: [C.Person, C.Group] }), labelOf)).toBe(
      "Person or Group",
    );
    expect(suggestQueryName(node({ entityId: "sex" }), labelOf)).toBe("sex");
    expect(suggestQueryName(node({}), labelOf)).toBe("Any entity");
    expect(suggestQueryName(node({ entityClasses: classesAll }), labelOf)).toBe("Any entity");
  });

  it("adds each edge with its target, nested conditions in brackets", () => {
    const query = node({ entityClasses: [C.Person] }, [
      edge(
        Query.EdgeType["EP:T"],
        node({ entityId: "sex" }, [edge(Query.EdgeType["HP:V"], node({ entityId: "female" }))]),
      ),
    ]);
    expect(suggestQueryName(query, labelOf)).toBe(
      "Person, has property: type sex (has property: value female)",
    );
  });

  it("writes NOT for a negative edge, or between the edges of an OR node, and leaves out an empty target", () => {
    const query = node(
      { entityClasses: [C.Person] },
      [
        edge(Query.EdgeType["R:CLA"], node({ entityId: "heretic" }), Query.EdgeLogic.Negative),
        edge(Query.EdgeType["R:"], node({})),
      ],
      Query.NodeOperator.Or,
    );
    expect(suggestQueryName(query, labelOf)).toBe(
      "Person, NOT has relation: Classification heretic or has relation: any",
    );
  });

  it("falls back for a label not loaded and cuts a long name with an ellipsis", () => {
    expect(suggestQueryName(node({ entityId: "unknown" }), labelOf)).toBe("entity");
    const long = node(
      { entityClasses: [C.Statement] },
      Array.from({ length: 4 }, () =>
        edge(Query.EdgeType["I_IS:S"], node({ entityClasses: [C.Person] })),
      ),
    );
    const name = suggestQueryName(long, labelOf);
    expect(name.length).toBeLessThanOrEqual(QUERY_NAME_MAX_LENGTH);
    expect(name.endsWith("…")).toBe(true);
  });
});
