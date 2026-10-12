import { EntityEnums } from "@inkvisitor/shared/enums";
import { InternalServerError } from "@inkvisitor/shared/types/errors";
import { Query } from "@inkvisitor/shared/types/query";
import { getSubordinateEntityIds } from "@models/relation/functions";
import { getNodeExpansionIds } from "@service/query/node-expansion";
import { Conn, ExploreResolvers, Row, storage } from "@service/storage";
import { closeTestDb, openTestDb } from "../../test/db";

/**
 * Behaviour of entity search, the label lookups and the explore evaluator,
 * run with `pnpm test`. Every expectation is a literal id
 * list read off the fixture below, so a failure on RethinkDB is a wrong
 * expectation. isolate.ts empties the tables before this file.
 */
let conn: Conn;
beforeAll(async () => {
  conn = await openTestDb();
});
afterAll(async () => {
  await closeTestDb(conn);
});

const C = EntityEnums.Class;
const sorted = (list: string[]) => [...list].sort();
const ids = (rows: { id: string }[]) => sorted(rows.map((r) => r.id));

// the shapes the queries read; every other field is irrelevant to storage
const prop = (valueId: string, typeId: string, children: Row[] = []): Row => ({
  id: `p-${valueId}-${typeId}`,
  value: { entityId: valueId },
  type: { entityId: typeId },
  children,
});
const actant = (entityId: string, position: EntityEnums.Position, extra: Row = {}): Row => ({
  id: `a-${entityId}-${position}`,
  entityId,
  position,
  props: [],
  classifications: [],
  identifications: [],
  ...extra,
});
const entity = (id: string, cls: EntityEnums.Class, labels: string[] | undefined, extra: Row = {}): Row => ({
  id,
  class: cls,
  status: "0",
  ...(labels ? { labels } : {}),
  ...extra,
});

/** every entity of the fixture, so a filterless search can be pinned */
const ALL = ["a-1", "c-1", "c-2", "c-3", "c-4", "l-1", "p-1", "p-2", "r-1", "r-2", "s-1", "s-2", "s-3", "t-child", "t-root"];

beforeAll(async () => {
  await storage.entities.insert(conn, [
    // the root territory of a real database stores references as ""
    entity("t-root", C.Territory, ["Root territory"], { data: { parent: false }, references: "" }),
    entity("t-child", C.Territory, ["Child territory"], { data: { parent: { territoryId: "t-root", order: 0 } } }),
    entity("c-1", C.Concept, ["Étoile bleue"], {
      language: "eng",
      props: [prop("c-3", "c-2", [prop("x-1", "c-4")])],
      references: [
        { id: "ref-1", resource: "r-1", value: "c-3" },
        { id: "ref-2", resource: "", value: "" },
      ],
    }),
    entity("c-2", C.Concept, ["Blue star"], { usedTemplate: "tpl-1" }),
    entity("c-3", C.Concept, ["star-shaped object"], { status: "1" }),
    entity("c-4", C.Concept, ["Object"], { isTemplate: true }),
    entity("a-1", C.Action, ["shine"]),
    entity("p-1", C.Person, ["Anna Nováková"]),
    entity("p-2", C.Person, undefined),
    entity("l-1", C.Location, ["Prague (city)"]),
    entity("r-1", C.Resource, ["Book one"], { data: { documentId: "d-1" } }),
    entity("r-2", C.Resource, ["Book two"], { data: {} }),
    // statements carry props and references arrays like every real one; the
    // ReQL collectors read those two fields without a guard
    entity("s-1", C.Statement, [""], {
      props: [],
      references: [{ id: "ref-s1", resource: "r-1", value: "" }],
      data: {
        text: "",
        territory: { territoryId: "t-root", order: 1 },
        tags: ["c-1"],
        actions: [{ id: "act-1", actionId: "a-1", props: [prop("x-3", "c-4")] }],
        actants: [
          actant("p-1", EntityEnums.Position.Subject, {
            classifications: [{ id: "cl-1", entityId: "c-2" }],
            identifications: [{ id: "id-1", entityId: "c-3" }],
          }),
          actant("l-1", EntityEnums.Position.Actant1, {
            props: [prop("c-3", "c-2", [prop("c-4", "x-2", [prop("x-5", "x-4")])])],
          }),
          actant("p-2", EntityEnums.Position.Actant2),
        ],
      },
    }),
    entity("s-2", C.Statement, [""], {
      props: [],
      references: [],
      data: {
        text: "",
        territory: { territoryId: "t-child", order: 1 },
        tags: [],
        actions: [],
        actants: [actant("p-1", EntityEnums.Position.Actant2)],
      },
    }),
    // a partial legacy document: no actions, no tags, no territory
    entity("s-3", C.Statement, [""], {
      props: [],
      references: [],
      data: {
        text: "",
        territory: null,
        actants: [actant("p-2", EntityEnums.Position.Subject), actant("l-1", EntityEnums.Position.Actant1)],
      },
    }),
  ]);
  await storage.documents.insert(conn, { id: "d-1", title: "Book one", content: "" });
  await storage.relations.insert(conn, [
    { id: "rel-1", type: "SCL", entityIds: ["c-1", "c-2"] },
    { id: "rel-2", type: "SCL", entityIds: ["c-2", "c-3"] },
    { id: "rel-3", type: "SCL", entityIds: ["l-1", "c-3"] },
    { id: "rel-4", type: "SOE", entityIds: ["p-1", "l-1"] },
    { id: "rel-5", type: "HOL", entityIds: ["l-1", "c-4"] },
    { id: "rel-6", type: "CLA", entityIds: ["p-1", "c-2"] },
    { id: "rel-7", type: "CLA", entityIds: ["p-2", "c-3"] },
    { id: "rel-8", type: "SYN", entityIds: ["c-3", "c-4"] },
  ]);
});

describe("entity search", () => {
  const search = async (filters: Parameters<typeof storage.entities.search>[1], seedIds?: string[]) =>
    ids(await storage.entities.search(conn, filters, seedIds ? { seedIds } : undefined));

  it("returns everything without filters and only the seed rows with seedIds", async () => {
    expect(await search({})).toEqual(ALL);
    expect(await search({}, ["c-1", "p-1", "nope"])).toEqual(["c-1", "p-1"]);
    expect(await search({ class: C.Concept }, ["c-1", "p-1"])).toEqual(["c-1"]);
    expect(await search({}, [])).toEqual([]);
  });

  it("applies each scalar filter", async () => {
    expect(await search({ class: C.Concept })).toEqual(["c-1", "c-2", "c-3", "c-4"]);
    expect(await search({ status: "1" as EntityEnums.Status })).toEqual(["c-3"]);
    expect(await search({ usedTemplate: "tpl-1" })).toEqual(["c-2"]);
    expect(await search({ language: "eng" as EntityEnums.Language })).toEqual(["c-1"]);
    expect(await search({ onlyTemplates: true })).toEqual(["c-4"]);
    expect(await search({ excluded: [C.Concept, C.Statement, C.Territory] })).toEqual(["a-1", "l-1", "p-1", "p-2", "r-1", "r-2"]);
    expect(await search({ entityIds: ["c-1", "p-1", "nope"] })).toEqual(["c-1", "p-1"]);
    expect(await search({ entityIds: ["c-1", "p-1"], class: C.Concept })).toEqual(["c-1"]);
    expect(await search({ entityIds: [] })).toEqual([]);
  });

  it("keeps resources with an existing document and entities referencing a resource", async () => {
    expect(await search({ resourceHasDocument: true })).toEqual(["r-1"]);
    // ReQL fails on the string `references` of t-root, so the territories are
    // filtered out before the reference predicate reaches it
    expect(await search({ excluded: [C.Territory], haveReferenceTo: "r-1" })).toEqual(["c-1", "s-1"]);
    expect(await search({ excluded: [C.Territory], haveReferenceTo: "r-2" })).toEqual([]);
  });

  it("matches labels word by word in every wildcard form", async () => {
    expect(await search({ label: "star" })).toEqual(["c-2", "c-3"]);
    expect(await search({ label: "sta" })).toEqual([]);
    expect(await search({ label: "sta*" })).toEqual(["c-2", "c-3"]);
    expect(await search({ label: "*tar" })).toEqual(["c-2", "c-3"]);
    expect(await search({ label: "*ta*" })).toEqual(["c-2", "c-3"]);
    expect(await search({ label: "blue star" })).toEqual(["c-2"]);
    expect(await search({ label: "star object" })).toEqual(["c-3"]);
    expect(await search({ label: "BLUE" })).toEqual(["c-2"]);
  });

  it("matches accented and plain spellings both ways", async () => {
    expect(await search({ label: "etoile" })).toEqual(["c-1"]);
    expect(await search({ label: "Étoile" })).toEqual(["c-1"]);
    expect(await search({ label: "novakova" })).toEqual(["p-1"]);
    expect(await search({ label: "Nováková" })).toEqual(["p-1"]);
  });

  it("labelOrId matches the label literally or the id as a prefix", async () => {
    expect(await search({ labelOrId: "c-" })).toEqual(["c-1", "c-2", "c-3", "c-4"]);
    expect(await search({ labelOrId: "C-" })).toEqual([]);
    expect(await search({ labelOrId: "c-1*" })).toEqual(["c-1"]);
    expect(await search({ labelOrId: "(city)" })).toEqual(["l-1"]);
    expect(await search({ labelOrId: "(city" })).toEqual(["l-1"]);
    expect(await search({ labelOrId: "star" })).toEqual(["c-2", "c-3"]);
  });

  it("idsMatchingLabel keeps the given ids whose label matches; labelsOf returns labels only when present", async () => {
    expect(sorted(await storage.entities.idsMatchingLabel(conn, ["c-2", "c-3", "p-1"], "star", "^", "$"))).toEqual(["c-2", "c-3"]);
    expect(await storage.entities.idsMatchingLabel(conn, ["c-2"], "star", "^", "$")).toEqual(["c-2"]);
    expect(await storage.entities.idsMatchingLabel(conn, ["p-1", "p-2"], "star", "^", "$")).toEqual([]);
    expect(await storage.entities.idsMatchingLabel(conn, [], "star", "^", "$")).toEqual([]);
    const rows = await storage.entities.labelsOf(conn, ["p-1", "p-2", "nope"]);
    expect(rows.sort((a, b) => a.id.localeCompare(b.id))).toEqual([{ id: "p-1", labels: ["Anna Nováková"] }, { id: "p-2" }]);
    expect(await storage.entities.labelsOf(conn, [])).toEqual([]);
  });
});

/** the fixture's territory lineage, root first (t-grand is added by the last describe block) */
const TERRITORY_PATHS: Record<string, string[]> = { "t-child": ["t-root"], "t-grand": ["t-root", "t-child"] };
const resolvers: ExploreResolvers = {
  expand: getNodeExpansionIds,
  subordinates: getSubordinateEntityIds,
  territoryPath: (id) => TERRITORY_PATHS[id] ?? [],
};
const node = (params: Query.INodeParams, edges: Partial<Query.IEdge>[] = [], operator = Query.NodeOperator.And): Query.INode =>
  ({ id: "", type: Query.NodeType.E, params, operator, edges: edges as Query.IEdge[] });
/** an edge to a target node given as node params (pinned entity, classes, toggles) or as a full node with edges of its own */
const edge = (type: string, target: Query.INodeParams | Query.INode = {}, logic = Query.EdgeLogic.Positive): Partial<Query.IEdge> =>
  ({ id: "", type: type as Query.EdgeType, params: {}, logic, node: "type" in target ? (target as Query.INode) : node(target) });
const explore = async (params: Query.INodeParams, edges: Partial<Query.IEdge>[] = [], operator = Query.NodeOperator.And) =>
  sorted(await storage.explore.plan(node(params, edges, operator), resolvers).run(conn));

describe("explore: relation, prop and reference edges", () => {
  it("R:SCL and I_R:SCL by a pinned target, by target classes, or any", async () => {
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:SCL", { entityId: "c-3" })])).toEqual(["c-2"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("I_R:SCL", { entityId: "c-2" })])).toEqual(["c-3"]);
    expect(await explore({ entityClasses: [C.Location] }, [edge("R:SCL", { entityClasses: [C.Concept] })])).toEqual(["l-1"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:SCL", { entityClasses: [C.Person] })])).toEqual([]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:SCL")])).toEqual(["c-1", "c-2"]);
  });

  it("R:SOE, I_R:SOE, I_R:HOL and I_R:CLA read the relation from the other side", async () => {
    expect(await explore({ entityClasses: [C.Person] }, [edge("R:SOE", { entityId: "l-1" })])).toEqual(["p-1"]);
    expect(await explore({ entityClasses: [C.Location] }, [edge("I_R:SOE", { entityId: "p-1" })])).toEqual(["l-1"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("I_R:HOL", { entityId: "l-1" })])).toEqual(["c-4"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("I_R:CLA", { entityId: "p-1" })])).toEqual(["c-2"]);
  });

  it("R:CLA walks forward only, R: any shared relation", async () => {
    expect(await explore({ entityClasses: [C.Person] }, [edge("R:CLA", { entityId: "c-2" })])).toEqual(["p-1"]);
    // the classified entity sits at entityIds[0]; a target is matched at entityIds[1] only
    expect(await explore({ entityClasses: [C.Person] }, [edge("R:CLA", { entityId: "p-2" })])).toEqual([]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("R:CLA")])).toEqual(["p-1", "p-2"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:", { entityId: "c-3" })])).toEqual(["c-2", "c-3", "c-4"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("R:")])).toEqual(["p-1", "p-2"]);
  });

  it("EP:T and HP:V read top-level props only", async () => {
    expect(await explore({ entityClasses: [C.Concept] }, [edge("EP:T", { entityId: "c-2" })])).toEqual(["c-1"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("EP:T", { entityId: "c-4" })])).toEqual([]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("EP:T")])).toEqual(["c-1"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("HP:V", { entityId: "c-3" })])).toEqual(["c-1"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("HP:V", { entityId: "x-1" })])).toEqual([]);
  });

  it("HR:R and HR:V need a non-empty side without a target and ignore non-array references", async () => {
    expect(await explore({ entityClasses: [C.Concept] }, [edge("HR:R", { entityId: "r-1" })])).toEqual(["c-1"]);
    expect(await explore({ entityClasses: [C.Concept, C.Statement] }, [edge("HR:R")])).toEqual(["c-1", "s-1"]);
    expect(await explore({ entityClasses: [C.Territory] }, [edge("HR:R")])).toEqual([]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("HR:V", { entityId: "c-3" })])).toEqual(["c-1"]);
    expect(await explore({ entityClasses: [C.Statement] }, [edge("HR:V")])).toEqual([]);
  });
});

describe("explore: operators, nesting and target expansion", () => {
  it("AND narrows and a negative edge subtracts", async () => {
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:", { entityId: "c-3" }), edge("I_R:HOL", { entityId: "l-1" })])).toEqual(["c-4"]);
    expect(
      await explore({ entityClasses: [C.Concept] }, [edge("R:", { entityId: "c-3" }), edge("I_R:HOL", { entityId: "l-1" }, Query.EdgeLogic.Negative)])
    ).toEqual(["c-2", "c-3"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:SCL", { entityId: "c-3" }, Query.EdgeLogic.Negative)])).toEqual(["c-1", "c-3", "c-4"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("HR:R", { entityId: "r-2" }), edge("R:", { entityId: "c-3" })])).toEqual([]);
  });

  it("OR unions; a negative edge contributes the base minus its match", async () => {
    expect(
      await explore({ entityClasses: [C.Concept] }, [edge("R:SCL", { entityId: "c-3" }), edge("I_R:HOL", { entityId: "l-1" })], Query.NodeOperator.Or)
    ).toEqual(["c-2", "c-4"]);
    expect(
      await explore(
        { entityClasses: [C.Concept] },
        [edge("R:SCL", { entityId: "c-3" }), edge("EP:T", { entityId: "c-2" }, Query.EdgeLogic.Negative)],
        Query.NodeOperator.Or
      )
    ).toEqual(["c-2", "c-3", "c-4"]);
  });

  it("a child node's edges run over the entities the edge matched", async () => {
    const hit = node({ entityId: "c-3" }, [edge("I_R:SCL", { entityId: "c-1" })]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:SCL", hit)])).toEqual(["c-2"]);
    const miss = node({ entityId: "c-3" }, [edge("HR:R", { entityId: "r-1" })]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:SCL", miss)])).toEqual([]);
  });

  it("a root without edges returns its base; the label param matches nothing", async () => {
    expect(await explore({ entityClasses: [C.Person] })).toEqual(["p-1", "p-2"]);
    expect(await explore({ entityId: "c-1" })).toEqual(["c-1"]);
    expect(await explore({ entityClasses: [C.Concept], label: "Blue star" })).toEqual([]);
    expect(await explore({})).toEqual(ALL);
  });

  // the stats view returns this list unsorted and caps it by position
  it("returns ids in code point order, as ReQL distinct() does", async () => {
    const run = (params: Query.INodeParams, edges: Partial<Query.IEdge>[] = []) =>
      storage.explore.plan(node(params, edges), resolvers).run(conn);
    expect(await run({})).toEqual(ALL);
    expect(await run({}, [edge("R:")])).toEqual(["c-1", "c-2", "c-3", "c-4", "l-1", "p-1", "p-2"]);
  });

  it("expands a pinned target through equivalents and subordinates", async () => {
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:SCL", { entityId: "c-4" })])).toEqual([]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:SCL", { entityId: "c-4", includeEquivalents: true })])).toEqual(["c-2"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("R:CLA", { entityId: "c-3" })])).toEqual(["p-2"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("R:CLA", { entityId: "c-3", includeSubordinates: true })])).toEqual(["p-1", "p-2"]);
  });

  it("rejects an unknown edge type when the plan is built", () => {
    expect(() => storage.explore.plan(node({}, [edge("NOPE")]), resolvers)).toThrow(InternalServerError);
    expect(() => storage.explore.plan(node({}, [edge("NOPE")]), resolvers)).toThrow("unknown edge type: NOPE");
  });
});

describe("explore: statement edges", () => {
  const S = { entityClasses: [C.Statement] };

  it("SP:T and SP:V read action and actant props three levels deep", async () => {
    expect(await explore(S, [edge("SP:T", { entityId: "c-2" })])).toEqual(["s-1"]);
    expect(await explore(S, [edge("SP:T", { entityId: "c-4" })])).toEqual(["s-1"]);
    expect(await explore(S, [edge("SP:T", { entityId: "x-2" })])).toEqual(["s-1"]);
    expect(await explore(S, [edge("SP:T", { entityId: "c-3" })])).toEqual([]);
    expect(await explore(S, [edge("SP:T")])).toEqual(["s-1"]);
    expect(await explore(S, [edge("SP:V", { entityId: "c-3" })])).toEqual(["s-1"]);
    expect(await explore(S, [edge("SP:V", { entityId: "c-4" })])).toEqual(["s-1"]);
    expect(await explore(S, [edge("SP:T", { entityId: "x-4" })])).toEqual(["s-1"]);
    expect(await explore(S, [edge("SP:V", { entityId: "x-5" })])).toEqual(["s-1"]);
  });

  it("I_SP:T, I_SP:V and I_SC emit the actant carrying the prop or classification", async () => {
    expect(await explore({ entityClasses: [C.Location] }, [edge("I_SP:T", { entityId: "c-2" })])).toEqual(["l-1"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("I_SP:T", { entityId: "c-2" })])).toEqual([]);
    // an action prop belongs to no actant
    expect(await explore({ entityClasses: [C.Location] }, [edge("I_SP:T", { entityId: "c-4" })])).toEqual([]);
    expect(await explore({ entityClasses: [C.Location] }, [edge("I_SP:T")])).toEqual(["l-1"]);
    expect(await explore({ entityClasses: [C.Location] }, [edge("I_SP:V", { entityId: "c-3" })])).toEqual(["l-1"]);
    expect(await explore({ entityClasses: [C.Location] }, [edge("I_SP:V", { entityId: "c-4" })])).toEqual(["l-1"]);
    expect(await explore({ entityClasses: [C.Location] }, [edge("I_SP:T", { entityId: "x-4" })])).toEqual(["l-1"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("I_SC", { entityId: "c-2" })])).toEqual(["p-1"]);
    // an identification is not a classification
    expect(await explore({ entityClasses: [C.Person] }, [edge("I_SC", { entityId: "c-3" })])).toEqual([]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("I_SC")])).toEqual(["p-1"]);
  });

  it("I_IS:S, I_IS:A1 and I_IS:A2 match by target, by class or by presence", async () => {
    expect(await explore(S, [edge("I_IS:S", { entityId: "p-1" })])).toEqual(["s-1"]);
    expect(await explore(S, [edge("I_IS:S", { entityId: "p-2" })])).toEqual(["s-3"]);
    expect(await explore(S, [edge("I_IS:S", { entityClasses: [C.Person] })])).toEqual(["s-1", "s-3"]);
    expect(await explore(S, [edge("I_IS:S", { entityClasses: [C.Location] })])).toEqual([]);
    expect(await explore(S, [edge("I_IS:S")])).toEqual(["s-1", "s-3"]);
    expect(await explore(S, [edge("I_IS:A1", { entityId: "l-1" })])).toEqual(["s-1", "s-3"]);
    expect(await explore(S, [edge("I_IS:A2", { entityId: "p-1" })])).toEqual(["s-2"]);
    expect(await explore(S, [edge("I_IS:A2", { entityId: "p-2" })])).toEqual(["s-1"]);
  });

  it("I_IS: and SUT: are index-backed; without a target they match every statement, resp. every statement with a territory", async () => {
    expect(await explore(S, [edge("I_IS:", { entityId: "c-1" })])).toEqual(["s-1"]);
    expect(await explore(S, [edge("I_IS:", { entityId: "c-2" })])).toEqual(["s-1"]);
    expect(await explore(S, [edge("I_IS:", { entityId: "a-1" })])).toEqual(["s-1"]);
    expect(await explore(S, [edge("I_IS:", { entityId: "t-child" })])).toEqual(["s-2"]);
    // references are in neither statement index
    expect(await explore(S, [edge("I_IS:", { entityId: "r-1" })])).toEqual([]);
    expect(await explore(S, [edge("I_IS:")])).toEqual(["s-1", "s-2", "s-3"]);
    expect(await explore(S, [edge("SUT:", { entityId: "t-root" })])).toEqual(["s-1"]);
    expect(await explore(S, [edge("SUT:", { entityId: "t-child" })])).toEqual(["s-2"]);
    expect(await explore(S, [edge("SUT:")])).toEqual(["s-1", "s-2"]);
  });

  it("EUT: and IS: emit every entity used in the selected statements", async () => {
    expect(await explore({ entityClasses: [C.Person] }, [edge("EUT:", { entityId: "t-root" })])).toEqual(["p-1", "p-2"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("EUT:", { entityId: "t-root" })])).toEqual(["c-1", "c-2", "c-3", "c-4"]);
    expect(await explore({ entityClasses: [C.Resource, C.Action] }, [edge("EUT:", { entityId: "t-root" })])).toEqual(["a-1", "r-1"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("EUT:", { entityId: "t-child" })])).toEqual(["p-1"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("EUT:")])).toEqual(["p-1", "p-2"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("IS:", { entityId: "s-1" })])).toEqual(["p-1", "p-2"]);
    expect(await explore({ entityClasses: [C.Location] }, [edge("IS:", { entityId: "s-3" })])).toEqual(["l-1"]);
    // a target that is not a statement selects nothing
    expect(await explore({ entityClasses: [C.Person] }, [edge("IS:", { entityId: "c-1" })])).toEqual([]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("IS:")])).toEqual(["p-1", "p-2"]);
  });
});

/**
 * Edges and node params that arrived with 1.6.1. The rows below exist only
 * from here on; every earlier block has run by the time they are inserted.
 */
describe("explore: edges and node params of 1.6.1", () => {
  const S = { entityClasses: [C.Statement] };
  const T = { entityClasses: [C.Territory] };
  const st = (status: string) => status as EntityEnums.Status;

  beforeAll(async () => {
    await storage.entities.insert(conn, [
      entity("c-5", C.Concept, ["Whole"]),
      entity("c-6", C.Concept, ["Part"]),
      entity("c-7", C.Concept, ["Third"]),
      entity("c-8", C.Concept, ["Fourth"]),
      entity("a-2", C.Action, ["walk"]),
      entity("a-3", C.Action, ["run"]),
      entity("p-3", C.Person, ["Karel"]),
      entity("p-4", C.Person, ["Karel Novák"]),
      entity("t-grand", C.Territory, ["Grandchild territory"], { data: { parent: { territoryId: "t-child", order: 0 } } }),
      entity("s-4", C.Statement, [""], {
        props: [],
        references: [],
        data: {
          text: "",
          territory: { territoryId: "t-child", order: 2 },
          tags: [],
          actions: [{ id: "act-4", actionId: "a-2", props: [] }],
          actants: [
            actant("p-3", EntityEnums.Position.Subject),
            actant("c-5", EntityEnums.Position.Actant1, { classifications: [{ id: "cl-4", entityId: "c-6" }] }),
            actant("l-1", EntityEnums.Position.Actant2),
            actant("p-4", EntityEnums.Position.PseudoActant, { identifications: [{ id: "id-4", entityId: "c-7" }] }),
          ],
        },
      }),
      // the editor's unlink button leaves an action with actionId ""
      entity("s-5", C.Statement, [""], {
        props: [],
        references: [],
        data: {
          text: "",
          territory: { territoryId: "t-child", order: 3 },
          tags: [],
          actions: [{ id: "act-5", actionId: "", props: [] }],
          actants: [actant("l-1", EntityEnums.Position.Actant1)],
        },
      }),
    ]);
    await storage.relations.insert(conn, [
      { id: "rel-9", type: "HOL", entityIds: ["c-5", "c-6"] },
      { id: "rel-10", type: "AEE", entityIds: ["a-2", "c-5"] },
      { id: "rel-11", type: "IMP", entityIds: ["a-2", "a-3"] },
      { id: "rel-12", type: "SUS", entityIds: ["a-3", "c-6"] },
      { id: "rel-13", type: "A1S", entityIds: ["a-3", "c-7"] },
      { id: "rel-14", type: "A2S", entityIds: ["a-2", "c-7"] },
      { id: "rel-15", type: "SYN", entityIds: ["c-6", "c-7", "c-8"] },
      { id: "rel-16", type: "ANT", entityIds: ["c-5", "c-7"] },
      { id: "rel-17", type: "PRR", entityIds: ["c-6", "c-7"] },
      { id: "rel-18", type: "SAR", entityIds: ["a-2", "a-3"] },
      { id: "rel-19", type: "REL", entityIds: ["a-3", "c-5"] },
      { id: "rel-20", type: "IDE", entityIds: ["p-3", "p-4"] },
      { id: "rel-21", type: "PRR", entityIds: ["c-8", "c-8"] },
    ]);
  });

  it("ordered relation edges walk from entityIds[0] to [1], the inverse ones back", async () => {
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:HOL", { entityId: "c-6" })])).toEqual(["c-5"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("I_R:HOL", { entityId: "c-5" })])).toEqual(["c-6"]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("R:AEE", { entityId: "c-5" })])).toEqual(["a-2"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("I_R:AEE", { entityId: "a-2" })])).toEqual(["c-5"]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("R:IMP", { entityId: "a-3" })])).toEqual(["a-2"]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("R:SUS", { entityId: "c-6" })])).toEqual(["a-3"]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("R:A1S", { entityId: "c-7" })])).toEqual(["a-3"]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("R:A2S", { entityId: "c-7" })])).toEqual(["a-2"]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("R:AEE", { entityClasses: [C.Concept] })])).toEqual(["a-2"]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("R:IMP")])).toEqual(["a-2"]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("R:IMP", { entityId: "a-2" })])).toEqual([]);
  });

  it("unordered relation edges match through any partner", async () => {
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:SYN", { entityId: "c-7" })])).toEqual(["c-6", "c-8"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:SYN", { entityClasses: [C.Concept] })])).toEqual(["c-3", "c-4", "c-6", "c-7", "c-8"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:ANT", { entityId: "c-5" })])).toEqual(["c-7"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:ANT", { entityId: "c-7" })])).toEqual(["c-5"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:PRR", { entityId: "c-6" })])).toEqual(["c-7"]);
    // a self loop: the row holds c-8 twice, so c-8 is its own partner
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:PRR", { entityId: "c-8" })])).toEqual(["c-8"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:PRR", { entityClasses: [C.Concept] })])).toEqual(["c-6", "c-7", "c-8"]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("R:SAR", { entityId: "a-3" })])).toEqual(["a-2"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("R:IDE", { entityId: "p-4" })])).toEqual(["p-3"]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("R:REL", { entityId: "c-5" })])).toEqual(["a-3"]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("R:REL")])).toEqual(["a-3"]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("R:REL", { entityClasses: [C.Person] })])).toEqual([]);
  });

  it("relation edges check an unpinned target's status on the far-side entity, R: on any partner", async () => {
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:SCL", { entityClasses: [C.Concept], entityStatuses: [st("1")] })])).toEqual(["c-2"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:SCL", { entityClasses: [C.Concept], entityStatuses: [st("0")] })])).toEqual(["c-1"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("R:SCL", { entityStatuses: [st("2")] })])).toEqual([]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("R:", { entityClasses: [C.Concept], entityStatuses: [st("1")] })])).toEqual(["p-2"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("R:", { entityClasses: [C.Concept] })])).toEqual(["p-1", "p-2"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("R:", { entityClasses: [C.Location] })])).toEqual(["p-1"]);
  });

  it("a node's entityStatuses narrow its base; a status-constrained target is an id set every edge matches against", async () => {
    expect(await explore({ entityClasses: [C.Concept], entityStatuses: [st("1")] })).toEqual(["c-3"]);
    expect(await explore({ entityClasses: [C.Concept], entityStatuses: [st("2")] })).toEqual([]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("HP:V", { entityStatuses: [st("1")] })])).toEqual(["c-1"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("EP:T", { entityStatuses: [st("1")] })])).toEqual([]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("EP:T", { entityStatuses: [st("0")] })])).toEqual(["c-1"]);
    // no entity has status 2: the target set is empty and the edge matches nothing
    expect(await explore({ entityClasses: [C.Concept] }, [edge("HP:V", { entityStatuses: [st("2")] })])).toEqual([]);
    expect(await explore(S, [edge("I_IS:S", { entityClasses: [C.Person], entityStatuses: [st("0")] })])).toEqual(["s-1", "s-3", "s-4"]);
  });

  it("the inverse prop edges emit the types and values of the target entities' own props", async () => {
    expect(await explore({ entityClasses: [C.Concept] }, [edge("I_EP:T", { entityId: "c-1" })])).toEqual(["c-2"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("I_HP:V", { entityId: "c-1" })])).toEqual(["c-3"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("I_EP:T")])).toEqual(["c-2"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("I_HP:V", { entityClasses: [C.Concept] })])).toEqual(["c-3"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("I_HP:V", { entityClasses: [C.Person] })])).toEqual([]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("HP:V", { entityClasses: [C.Concept] })])).toEqual(["c-1"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("HP:V", { entityClasses: [C.Person] })])).toEqual([]);
    // EP:T has no class narrowing: an empty target with a class matches any filled type
    expect(await explore({ entityClasses: [C.Concept] }, [edge("EP:T", { entityClasses: [C.Person] })])).toEqual(["c-1"]);
  });

  it("SC, SI and their inverses read actant classifications and identifications", async () => {
    expect(await explore(S, [edge("SC", { entityId: "c-2" })])).toEqual(["s-1"]);
    expect(await explore(S, [edge("SC", { entityId: "c-6" })])).toEqual(["s-4"]);
    expect(await explore(S, [edge("SC")])).toEqual(["s-1", "s-4"]);
    expect(await explore(S, [edge("SI", { entityId: "c-3" })])).toEqual(["s-1"]);
    expect(await explore(S, [edge("SI")])).toEqual(["s-1", "s-4"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("I_SI", { entityId: "c-3" })])).toEqual(["p-1"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("I_SI", { entityId: "c-7" })])).toEqual(["p-4"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("I_SI")])).toEqual(["p-1", "p-4"]);
    expect(await explore({ entityClasses: [C.Concept] }, [edge("I_SC", { entityId: "c-6" })])).toEqual(["c-5"]);
  });

  it("I_IS:PS, I_IS:A and an unconstrained I_IS: match by target, by class or by presence", async () => {
    expect(await explore(S, [edge("I_IS:PS", { entityId: "p-4" })])).toEqual(["s-4"]);
    expect(await explore(S, [edge("I_IS:PS")])).toEqual(["s-4"]);
    expect(await explore(S, [edge("I_IS:A", { entityId: "a-1" })])).toEqual(["s-1"]);
    // s-5's only action is unlinked: it has an action, but none of class Action
    expect(await explore(S, [edge("I_IS:A", { entityClasses: [C.Action] })])).toEqual(["s-1", "s-4"]);
    expect(await explore(S, [edge("I_IS:A")])).toEqual(["s-1", "s-4", "s-5"]);
    expect(await explore(S, [edge("I_IS:")])).toEqual(["s-1", "s-2", "s-3", "s-4", "s-5"]);
    expect(await explore(S, [edge("I_IS:", { entityClasses: [C.Territory] })])).toEqual(["s-1", "s-2", "s-4", "s-5"]);
    expect(await explore(S, [edge("I_IS:", { entityClasses: [C.Action] })])).toEqual(["s-1", "s-4"]);
  });

  it("IS:S, IS:A1, IS:A2, IS:PS and IS:A emit the entity in that position of the target statements", async () => {
    expect(await explore({ entityClasses: [C.Person] }, [edge("IS:S", { entityId: "s-1" })])).toEqual(["p-1"]);
    expect(await explore({ entityClasses: [C.Location] }, [edge("IS:A1", { entityId: "s-1" })])).toEqual(["l-1"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("IS:A2", { entityId: "s-1" })])).toEqual(["p-2"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("IS:PS", { entityId: "s-4" })])).toEqual(["p-4"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("IS:PS", { entityId: "s-1" })])).toEqual([]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("IS:A", { entityId: "s-1" })])).toEqual(["a-1"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("IS:S")])).toEqual(["p-1", "p-2", "p-3"]);
    expect(await explore({ entityClasses: [C.Person] }, [edge("IS:", { entityId: "s-4" })])).toEqual(["p-3", "p-4"]);
    expect(await explore({ entityClasses: [C.Action] }, [edge("IS:")])).toEqual(["a-1", "a-2"]);
  });

  it("the territory edges read the lineage, the subtree and the direct territory", async () => {
    expect(await explore(T, [edge("I_SUT:", { entityId: "s-1" })])).toEqual(["t-root"]);
    expect(await explore(T, [edge("I_SUT:", { entityId: "s-3" })])).toEqual([]);
    expect(await explore(T, [edge("I_SUT:")])).toEqual(["t-child", "t-root"]);
    expect(await explore(S, [edge("SUT:")])).toEqual(["s-1", "s-2", "s-4", "s-5"]);
    expect(await explore(T, [edge("CT:", { entityId: "t-grand" })])).toEqual(["t-child", "t-root"]);
    expect(await explore(T, [edge("CT:D", { entityId: "t-grand" })])).toEqual(["t-child"]);
    expect(await explore(T, [edge("CT:", { entityId: "t-root" })])).toEqual([]);
    expect(await explore(T, [edge("CT:")])).toEqual(["t-child", "t-root"]);
    expect(await explore(T, [edge("CT:D")])).toEqual(["t-child", "t-root"]);
    // the SUB toggle picks the walk depth on the tree edges and never widens the target; EQ finds nothing here
    expect(await explore(T, [edge("CT:", { entityId: "t-grand", includeSubordinates: true })])).toEqual(["t-child", "t-root"]);
    expect(await explore(T, [edge("CT:", { entityId: "t-grand", includeEquivalents: true })])).toEqual(["t-child", "t-root"]);
    expect(await explore(T, [edge("I_CT:", { entityId: "t-root" })])).toEqual(["t-child"]);
    expect(await explore(T, [edge("I_CT:", { entityId: "t-root", includeSubordinates: true })])).toEqual(["t-child", "t-grand"]);
    expect(await explore(T, [edge("I_CT:", { entityId: "t-child" })])).toEqual(["t-grand"]);
    expect(await explore(T, [edge("I_CT:", { entityId: "t-grand" })])).toEqual([]);
    expect(await explore(T, [edge("I_CT:")])).toEqual(["t-child", "t-grand"]);
  });

  it("I_HR:R emits the resources the pinned target entities reference", async () => {
    expect(await explore({ entityClasses: [C.Resource] }, [edge("I_HR:R", { entityId: "c-1" })])).toEqual(["r-1"]);
    expect(await explore({ entityClasses: [C.Resource] }, [edge("I_HR:R", { entityId: "s-1" })])).toEqual(["r-1"]);
  });
});
