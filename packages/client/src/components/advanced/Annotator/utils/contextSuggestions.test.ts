import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, IResponseStatement, IResponseTree } from "@inkvisitor/shared/types";
import { IAnchorsNode } from "@inkvisitor/shared/types/document";
import { describe, expect, it } from "vitest";
import {
  collectContextEntities,
  getStatementAnchorContext,
  getStatementEntityIds,
  getTerritoryChain,
  sortStatementsByDistance,
} from "./contextSuggestions";

const entity = (id: string, entityClass = EntityEnums.Class.Person) =>
  ({ id, class: entityClass, labels: [id] }) as unknown as IEntity;

const prop = (typeId: string, valueId: string, children: IProp[] = []) =>
  ({ type: { entityId: typeId }, value: { entityId: valueId }, children }) as unknown as IProp;

const statement = (
  id: string,
  { actions = [] as string[], actants = [] as string[], props = [] as IProp[] } = {},
  entities: IEntity[] = []
) =>
  ({
    id,
    class: EntityEnums.Class.Statement,
    props: [],
    data: {
      actions: actions.map((actionId) => ({ actionId, props: [] })),
      actants: actants.map((entityId, i) => ({
        entityId,
        props: i === 0 ? props : [],
        classifications: [],
        identifications: [],
      })),
      tags: [],
    },
    entities: Object.fromEntries(entities.map((e) => [e.id, e])),
  }) as unknown as IResponseStatement;

const anchor = (
  id: string,
  indexStart: number,
  indexEnd: number,
  children: IAnchorsNode[] = [],
  entityClass = EntityEnums.Class.Statement
): IAnchorsNode => ({
  anchor: id,
  class: entityClass,
  content: "",
  indexStart,
  indexEnd,
  children,
});

describe("getStatementEntityIds", () => {
  it("lists the action, the actants, then their props, without duplicates", () => {
    const s = statement("s", {
      actions: ["a1"],
      actants: ["p1", "p2"],
      props: [prop("c1", "v1", [prop("c2", "p2")])],
    });
    expect(getStatementEntityIds(s)).toEqual(["a1", "p1", "p2", "c1", "v1", "c2"]);
  });
});

describe("getStatementAnchorContext", () => {
  it("lists the statements whose anchor contains the index, innermost first", () => {
    const anchors = [
      anchor(
        "T",
        0,
        100,
        [anchor("outer", 0, 50, [anchor("inner", 10, 20)])],
        EntityEnums.Class.Territory
      ),
      anchor("other", 60, 70),
    ];
    expect(getStatementAnchorContext(anchors, 15).containingIds).toEqual(["inner", "outer"]);
    expect(getStatementAnchorContext(anchors, 55).containingIds).toEqual([]);
  });
});

describe("getTerritoryChain", () => {
  const node = (
    id: string,
    path: string[],
    statementsCount: number,
    children: IResponseTree[] = []
  ) => ({ territory: { id }, path, statementsCount, children }) as unknown as IResponseTree;
  const tree = node("root", [], 0, [
    node("book", ["root"], 2, [
      node("empty", ["root", "book"], 0, [node("ch", ["root", "book", "empty"], 5)]),
    ]),
  ]);

  it("goes from the territory up to the root, skipping territories without statements", () => {
    expect(getTerritoryChain(tree, "ch")).toEqual(["ch", "book"]);
  });
});

describe("sortStatementsByDistance", () => {
  it("puts the nearest anchored statements first and unanchored ones last in order", () => {
    const anchors = [anchor("far", 0, 10), anchor("near", 40, 45), anchor("here", 50, 60)];
    const { distances } = getStatementAnchorContext(anchors, 55);
    const sorted = sortStatementsByDistance(
      [{ id: "unanchored1" }, { id: "far" }, { id: "unanchored2" }, { id: "near" }, { id: "here" }],
      distances
    );
    expect(sorted.map((s) => s.id)).toEqual(["here", "near", "far", "unanchored1", "unanchored2"]);
  });
});

describe("collectContextEntities", () => {
  it("keeps the statement order, skips territories and duplicates, and stops at the limit", () => {
    const s1 = statement("s1", { actions: ["a"], actants: ["p", "t"] }, [
      entity("a", EntityEnums.Class.Action),
      entity("p"),
      entity("t", EntityEnums.Class.Territory),
    ]);
    const s2 = statement("s2", { actants: ["p", "q", "r"] }, [
      entity("p"),
      entity("q"),
      entity("r"),
    ]);

    expect(collectContextEntities([s1, s2], 3).map((e) => e.id)).toEqual(["a", "p", "q"]);
  });
});
