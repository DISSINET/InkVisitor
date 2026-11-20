import { describe, it, expect } from "vitest";
import { Query, Explore } from "@inkvisitor/shared/types/query";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { classesAll } from "@inkvisitor/shared/dictionaries/entity";
import {
  classesReach,
  countNodeFilters,
  LOGICAL_TYPE_CLASSES,
  PART_OF_SPEECH_CLASSES,
  isQueryRequestEmpty,
  queryDepth,
  QUERY_NAME_MAX_LENGTH,
  suggestQueryName,
  withoutIgnoredStartNodes,
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

  // an SE edge says the entity is its target node, so it narrows only as far as that node does
  const startNode = (params: Query.INodeParams, edges: Query.IEdge[] = []): Query.IEdge => ({
    ...makeEdge(),
    type: Query.EdgeType.SE,
    node: { ...makeRoot(params), edges },
  });
  const startNodesRoot = (...edges: Query.IEdge[]): Query.INode => ({
    ...makeRoot(),
    operator: Query.NodeOperator.Or,
    edges,
  });

  it("is empty when no start node has anything to narrow it", () => {
    expect(isQueryRequestEmpty(startNodesRoot(startNode({})), makeExplore())).toBe(true);
    expect(
      isQueryRequestEmpty(startNodesRoot(startNode({ entityClasses: classesAll })), makeExplore()),
    ).toBe(true);
    expect(
      isQueryRequestEmpty(startNodesRoot(startNode({}), startNode({})), makeExplore()),
    ).toBe(true);
  });

  it("sends only the start nodes the search does not ignore", () => {
    const concepts = startNode({ entityClasses: [EntityEnums.Class.Concept] });
    const open = startNode({});
    const notOpen = { ...startNode({}), logic: Query.EdgeLogic.Negative };
    const sent = withoutIgnoredStartNodes(startNodesRoot(concepts, open, notOpen));
    expect(sent.edges).toEqual([concepts, notOpen]);
    // the server refuses a root of start nodes beside other edges whole
    const mixed = startNodesRoot(open, makeEdge());
    expect(withoutIgnoredStartNodes(mixed)).toBe(mixed);
  });

  it("is not empty when one start node is narrowed beside ones the search ignores", () => {
    const concepts = startNode({ entityClasses: [EntityEnums.Class.Concept] });
    expect(isQueryRequestEmpty(startNodesRoot(concepts, startNode({})), makeExplore())).toBe(false);
  });

  it("is not empty when every start node is narrowed", () => {
    const concepts = startNode({ entityClasses: [EntityEnums.Class.Concept] });
    expect(isQueryRequestEmpty(startNodesRoot(concepts), makeExplore())).toBe(false);
    expect(
      isQueryRequestEmpty(startNodesRoot(concepts, startNode({}, [makeEdge()])), makeExplore()),
    ).toBe(false);
    expect(
      isQueryRequestEmpty(
        startNodesRoot(startNode({ entityId: "abc" }), startNode({ entityStatuses: ["1" as EntityEnums.Status] })),
        makeExplore(),
      ),
    ).toBe(false);
  });

  it("reads the edges of an And node together and those of any other operator apart", () => {
    const and = (...edges: Query.IEdge[]): Query.INode => ({ ...makeRoot(), edges });
    expect(isQueryRequestEmpty(and(startNode({}), makeEdge()), makeExplore())).toBe(false);
    expect(isQueryRequestEmpty(and(startNode({}), startNode({})), makeExplore())).toBe(true);
    expect(isQueryRequestEmpty(startNodesRoot(), makeExplore())).toBe(true);
    // the server evaluates every operator but And as Or
    const odd = { ...startNodesRoot(startNode({}), makeEdge()), operator: "xor" as Query.NodeOperator };
    expect(isQueryRequestEmpty(odd, makeExplore())).toBe(true);
  });

  it("is not empty when a negative SE edge takes entities away", () => {
    const concepts = startNode({ entityClasses: [EntityEnums.Class.Concept] });
    const notAnything = { ...startNode({}), logic: Query.EdgeLogic.Negative };
    expect(isQueryRequestEmpty(startNodesRoot(concepts, notAnything), makeExplore())).toBe(false);
  });

  it("is not empty when a node filter narrows the root", () => {
    expect(
      isQueryRequestEmpty(makeRoot({ entityStatuses: ["1" as EntityEnums.Status] }), makeExplore()),
    ).toBe(false);
  });

  it("reads a null class list as any class", () => {
    const root = makeRoot({ entityClasses: null as unknown as EntityEnums.Class[] });
    expect(isQueryRequestEmpty(root, makeExplore())).toBe(true);
  });

  it("is not empty when an explore filter narrows start nodes that are not", () => {
    expect(
      isQueryRequestEmpty(
        startNodesRoot(startNode({})),
        makeExplore([{ type: Explore.SearchOption.Label, label: "x" }]),
      ),
    ).toBe(false);
  });
});

describe("classesReach", () => {
  it("is true for any class, or when one class carries the field", () => {
    const C = EntityEnums.Class;
    expect(classesReach([], LOGICAL_TYPE_CLASSES)).toBe(true);
    expect(classesReach([C.Concept, C.Person], LOGICAL_TYPE_CLASSES)).toBe(true);
    expect(classesReach([C.Concept], LOGICAL_TYPE_CLASSES)).toBe(false);
    expect(classesReach([C.Action], PART_OF_SPEECH_CLASSES)).toBe(true);
    expect(classesReach([C.Person, C.Territory], PART_OF_SPEECH_CLASSES)).toBe(false);
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

  it("counts a date range once, whichever ends are set, and each user and co-occurrence filter", () => {
    expect(countNodeFilters({ createdAfter: "2024-01-01T00:00:00.000Z" })).toBe(1);
    expect(
      countNodeFilters({
        createdAfter: "2024-01-01T00:00:00.000Z",
        createdBefore: "2025-01-01T00:00:00.000Z",
        updatedBefore: "2025-01-01T00:00:00.000Z",
      }),
    ).toBe(2);
    expect(
      countNodeFilters({ createdBy: "u-1", updatedBy: "u-2", editedBy: ["u-1"], coOccurrence: ["c-1"] }),
    ).toBe(4);
    expect(countNodeFilters({ editedBy: [], coOccurrence: [] })).toBe(0);
    expect(
      countNodeFilters({
        entityLogicalTypes: ["1" as EntityEnums.LogicalType, "2" as EntityEnums.LogicalType],
        entityPartsOfSpeech: ["noun" as EntityEnums.ConceptPartOfSpeech],
      }),
    ).toBe(2);
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

  it("names each start node as a root, those with conditions in brackets, joined by or", () => {
    const query = node(
      {},
      [
        edge(
          Query.EdgeType.SE,
          node({ entityClasses: [C.Person] }, [
            edge(Query.EdgeType["R:CLA"], node({ entityId: "heretic" })),
          ]),
        ),
        edge(Query.EdgeType.SE, node({ entityId: "sex" })),
        edge(Query.EdgeType.SE, node({}), Query.EdgeLogic.Negative),
      ],
      Query.NodeOperator.Or,
    );
    expect(suggestQueryName(query, labelOf)).toBe(
      "(Person, has relation: Classification heretic) or sex or NOT Any entity",
    );
  });

  it("tells start nodes apart from a root with the same classes and condition", () => {
    const condition = () => [edge(Query.EdgeType["EP:T"], node({}))];
    const startNodes = (logic = Query.EdgeLogic.Positive) =>
      node(
        {},
        [
          edge(Query.EdgeType.SE, node({ entityClasses: [C.Person] })),
          edge(Query.EdgeType.SE, node({ entityClasses: [C.Group] }, condition()), logic),
        ],
        Query.NodeOperator.Or,
      );
    expect(suggestQueryName(node({ entityClasses: [C.Person, C.Group] }, condition()), labelOf)).toBe(
      "Person or Group, has property: type",
    );
    expect(suggestQueryName(startNodes(), labelOf)).toBe("Person or (Group, has property: type)");
    expect(suggestQueryName(startNodes(Query.EdgeLogic.Negative), labelOf)).toBe(
      "Person or NOT (Group, has property: type)",
    );
  });

  it("leaves a single start node and start nodes without conditions unbracketed", () => {
    const single = node(
      {},
      [
        edge(
          Query.EdgeType.SE,
          node({ entityClasses: [C.Group] }, [edge(Query.EdgeType["EP:T"], node({}))]),
          Query.EdgeLogic.Negative,
        ),
      ],
      Query.NodeOperator.Or,
    );
    expect(suggestQueryName(single, labelOf)).toBe("NOT Group, has property: type");
    const plain = node(
      {},
      [
        edge(Query.EdgeType.SE, node({ entityClasses: [C.Person] })),
        edge(Query.EdgeType.SE, node({ entityClasses: [C.Group] }), Query.EdgeLogic.Negative),
      ],
      Query.NodeOperator.Or,
    );
    expect(suggestQueryName(plain, labelOf)).toBe("Person or NOT Group");
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

describe("queryDepth", () => {
  const node = (edges: Query.IEdge[] = []): Query.INode => ({
    id: "",
    type: Query.NodeType.E,
    params: {},
    operator: Query.NodeOperator.And,
    edges,
  });
  const edge = (target: Query.INode): Query.IEdge => ({
    id: "",
    type: Query.EdgeType["EP:T"],
    params: {},
    logic: Query.EdgeLogic.Positive,
    node: target,
  });

  it("counts the root as the first level and follows the deepest branch", () => {
    expect(queryDepth(node())).toBe(1);
    expect(queryDepth(node([edge(node()), edge(node([edge(node([edge(node())]))]))]))).toBe(4);
  });
});
