import "ts-jest";
import { Db } from "@service/rethink";
import { deleteRelations } from "@service/shorthands";
import { getRelationClass } from "@models/factory";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";
import { Relation as RelationTypes } from "@inkvisitor/shared/types";
import {
  collectIdsFromIdentificationConnections,
  getEquivalentEntityIds,
  getSubordinateEntityIds,
} from "./functions";

describe("collectIdsFromIdentificationConnections", () => {
  const conn = (
    entityIds: [string, string],
    subtrees: RelationTypes.IConnection<RelationTypes.IIdentification>[] = []
  ): RelationTypes.IConnection<RelationTypes.IIdentification> =>
    ({
      id: `${entityIds[0]}-${entityIds[1]}`,
      type: RelationEnums.Type.Identification,
      entityIds,
      certainty: EntityEnums.Certainty.Certain,
      subtrees,
    } as RelationTypes.IConnection<RelationTypes.IIdentification>);

  test("empty input -> empty set", () => {
    expect([...collectIdsFromIdentificationConnections([])]).toEqual([]);
  });

  test("collects ids from a flat list", () => {
    const result = collectIdsFromIdentificationConnections([conn(["a", "b"])]);
    expect([...result].sort()).toEqual(["a", "b"]);
  });

  test("walks nested subtrees transitively", () => {
    const tree = [conn(["a", "b"], [conn(["b", "c"], [conn(["c", "d"])])])];
    const result = collectIdsFromIdentificationConnections(tree);
    expect([...result].sort()).toEqual(["a", "b", "c", "d"]);
  });

  test("accumulates into a provided set", () => {
    const acc = new Set<string>(["x"]);
    collectIdsFromIdentificationConnections([conn(["a", "b"])], acc);
    expect([...acc].sort()).toEqual(["a", "b", "x"]);
  });
});

describe("getEquivalentEntityIds", () => {
  const db = new Db();

  const saveRelation = async (
    data: Partial<RelationTypes.IRelation> & { type: RelationEnums.Type }
  ): Promise<void> => {
    const relation = getRelationClass(data as RelationTypes.IRelation);
    await relation.save(db.connection);
  };

  beforeAll(async () => {
    await db.initDb();
    await deleteRelations(db);

    // SYN: a single merged cloud of three concepts
    await saveRelation({
      id: "syn-cloud",
      type: RelationEnums.Type.Synonym,
      entityIds: ["c1", "c2", "c3"],
    });

    // IDE: certain chain p1 -> p2 -> p3, then a dubious leaf p3 -> p4
    await saveRelation({
      id: "ide-1",
      type: RelationEnums.Type.Identification,
      entityIds: ["p1", "p2"],
      certainty: EntityEnums.Certainty.Certain,
    } as Partial<RelationTypes.IIdentification> & { type: RelationEnums.Type });
    await saveRelation({
      id: "ide-2",
      type: RelationEnums.Type.Identification,
      entityIds: ["p2", "p3"],
      certainty: EntityEnums.Certainty.Certain,
    } as Partial<RelationTypes.IIdentification> & { type: RelationEnums.Type });
    await saveRelation({
      id: "ide-3",
      type: RelationEnums.Type.Identification,
      entityIds: ["p3", "p4"],
      certainty: EntityEnums.Certainty.Dubious,
    } as Partial<RelationTypes.IIdentification> & { type: RelationEnums.Type });

    // IDE: a dubious-only edge p5 -> p6 (direct, not followed further)
    await saveRelation({
      id: "ide-4",
      type: RelationEnums.Type.Identification,
      entityIds: ["p5", "p6"],
      certainty: EntityEnums.Certainty.Dubious,
    } as Partial<RelationTypes.IIdentification> & { type: RelationEnums.Type });

    // AEE: action a1 <-> concept con1
    await saveRelation({
      id: "aee-1",
      type: RelationEnums.Type.ActionEventEquivalent,
      entityIds: ["a1", "con1"],
    });
  });

  afterAll(async () => {
    await deleteRelations(db);
    await db.close();
  });

  test("empty input returns empty", async () => {
    expect(await getEquivalentEntityIds(db.connection, [])).toEqual([]);
  });

  test("SYN: returns the whole synonym cloud, minus the input", async () => {
    const result = await getEquivalentEntityIds(db.connection, ["c1"]);
    expect(result.sort()).toEqual(["c2", "c3"]);
  });

  test("IDE: follows Certain transitively, includes a direct dubious leaf", async () => {
    const result = await getEquivalentEntityIds(db.connection, ["p1"]);
    // p2, p3 reached through Certain edges; p4 is a direct dubious edge of p3
    expect(result.sort()).toEqual(["p2", "p3", "p4"]);
    expect(result).not.toContain("p1");
  });

  test("IDE: a direct dubious edge is included (path length 1)", async () => {
    const result = await getEquivalentEntityIds(db.connection, ["p5"]);
    expect(result).toEqual(["p6"]);
  });

  test("AEE: bidirectional single hop", async () => {
    expect(await getEquivalentEntityIds(db.connection, ["a1"])).toEqual([
      "con1",
    ]);
    expect(await getEquivalentEntityIds(db.connection, ["con1"])).toEqual([
      "a1",
    ]);
  });

  test("never returns the input ids themselves", async () => {
    const result = await getEquivalentEntityIds(db.connection, ["c1", "c2"]);
    expect(result).toEqual(["c3"]);
  });
});

describe("getSubordinateEntityIds", () => {
  const db = new Db();

  const saveRelation = async (
    id: string,
    type: RelationEnums.Type,
    entityIds: [string, string]
  ): Promise<void> => {
    const relation = getRelationClass({ id, type, entityIds } as RelationTypes.IRelation);
    await relation.save(db.connection);
  };

  beforeAll(async () => {
    await db.initDb();
    await deleteRelations(db);

    // SCL chain: gala -SCL-> apple -SCL-> fruit (entityIds[0]=subclass, [1]=superclass)
    await saveRelation("scl-1", RelationEnums.Type.Superclass, ["apple", "fruit"]);
    await saveRelation("scl-2", RelationEnums.Type.Superclass, ["gala", "apple"]);
    // SOE: child -SOE-> parent (entityIds[0]=subordinate, [1]=superordinate)
    await saveRelation("soe-1", RelationEnums.Type.SuperordinateEntity, ["soe-child", "soe-parent"]);
    // HOL: part -HOL-> whole (entityIds[0]=meronym, [1]=holonym)
    await saveRelation("hol-1", RelationEnums.Type.Holonym, ["hol-part", "hol-whole"]);
  }, 60000);

  afterAll(async () => {
    await deleteRelations(db);
    await db.close();
  }, 60000);

  test("empty input returns empty", async () => {
    expect(await getSubordinateEntityIds(db.connection, [])).toEqual([]);
  });

  test("SCL: collects subclasses transitively (all levels)", async () => {
    const result = await getSubordinateEntityIds(db.connection, ["fruit"]);
    expect(result.sort()).toEqual(["apple", "gala"]);
  });

  test("SOE: collects subordinate entities", async () => {
    expect(await getSubordinateEntityIds(db.connection, ["soe-parent"])).toEqual([
      "soe-child",
    ]);
  });

  test("HOL: collects meronyms (parts of the whole)", async () => {
    expect(await getSubordinateEntityIds(db.connection, ["hol-whole"])).toEqual([
      "hol-part",
    ]);
  });

  test("does not collect upward (a subclass has no subordinates here)", async () => {
    expect(await getSubordinateEntityIds(db.connection, ["gala"])).toEqual([]);
  });

  test("batched across types, inputs excluded", async () => {
    const result = await getSubordinateEntityIds(db.connection, [
      "fruit",
      "soe-parent",
      "hol-whole",
    ]);
    expect(result.sort()).toEqual([
      "apple",
      "gala",
      "hol-part",
      "soe-child",
    ]);
  });
});
