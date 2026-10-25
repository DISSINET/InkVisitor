import "ts-jest";
import { RelationEnums } from "@inkvisitor/shared/enums";
import { IClassifiedUnder } from "@inkvisitor/shared/types";
import { Db } from "@service/storage";
import { deleteRelations } from "@service/shorthands";
import { saveRelationFixture } from "../../test/relations";
import { getClassifiedUnder, getConceptsBelow } from "./classified-under";
import * as functions from "./functions";
import Relation from "./relation";

/**
 * Which entities come under a short list of Concepts, through subclasses and
 * synonyms and nothing else, and how each got there.
 *
 * The graph is small and every branch of it is there for one case: the
 * hierarchy of a real corpus is wider, and its shapes (a synonym of a subclass,
 * a subclass with two parents, a cycle) are the ones the walk can get wrong.
 */
describe("getClassifiedUnder", () => {
  const db = new Db();
  const SCL = RelationEnums.Type.Superclass;
  const SYN = RelationEnums.Type.Synonym;
  const HOL = RelationEnums.Type.Holonym;
  const CLA = RelationEnums.Type.Classification;

  const classify = (location: string, concept: string) =>
    saveRelationFixture(db.connection, CLA, [location, concept]);

  const entry = (
    concept: string,
    via: string,
    shadowed = false
  ): IClassifiedUnder => ({ concept, via, inferred: via !== concept, shadowed });

  beforeAll(async () => {
    await db.initDb();
    await deleteRelations(db);

    // settlement <- city <- (civitas is a synonym of city), settlement <- village
    await saveRelationFixture(db.connection, SCL, ["city", "settlement"]);
    await saveRelationFixture(db.connection, SCL, ["village", "settlement"]);
    await saveRelationFixture(db.connection, SYN, ["city", "civitas"]);
    // a subclass of a synonym of a subclass, which a single pass would miss
    await saveRelationFixture(db.connection, SCL, ["free civitas", "civitas"]);
    // a part of a settlement is not a settlement
    await saveRelationFixture(db.connection, HOL, ["settlement part", "settlement"]);
    // religious <- cathedral <- cathedral town -> town -> settlement
    await saveRelationFixture(db.connection, SCL, ["cathedral", "religious"]);
    await saveRelationFixture(db.connection, SCL, ["cathedral town", "cathedral"]);
    await saveRelationFixture(db.connection, SCL, ["cathedral town", "town"]);
    await saveRelationFixture(db.connection, SCL, ["town", "settlement"]);
    // a cycle
    await saveRelationFixture(db.connection, SCL, ["loop a", "loop b"]);
    await saveRelationFixture(db.connection, SCL, ["loop b", "loop a"]);

    await classify("L-direct", "settlement");
    await classify("L-city", "city");
    await classify("L-civitas", "civitas");
    await classify("L-free", "free civitas");
    await classify("L-part", "settlement part");
    await classify("L-cathedral", "cathedral town");
    await classify("L-unrelated", "something else");
    await classify("L-twice", "city");
    await classify("L-twice", "settlement");
    await classify("L-loop", "loop a");
  });

  afterAll(async () => {
    await deleteRelations(db);
    await db.close();
  });

  it("finds an entity classified under the Concept itself as a direct match", async () => {
    const result = await getClassifiedUnder(db.connection, ["settlement"]);
    expect(result.entities["L-direct"]).toEqual([entry("settlement", "settlement")]);
  });

  it("finds an entity classified under a subclass, naming the subclass it came through", async () => {
    const result = await getClassifiedUnder(db.connection, ["settlement"]);
    expect(result.entities["L-city"]).toEqual([entry("settlement", "city")]);
  });

  it("follows a synonym of a subclass, and a subclass of that synonym", async () => {
    const result = await getClassifiedUnder(db.connection, ["settlement"]);
    expect(result.entities["L-civitas"]).toEqual([entry("settlement", "civitas")]);
    expect(result.entities["L-free"]).toEqual([entry("settlement", "free civitas")]);
  });

  it("does not take a part of a settlement for a settlement", async () => {
    const result = await getClassifiedUnder(db.connection, ["settlement"]);
    expect(result.entities["L-part"]).toBeUndefined();
  });

  it("leaves out entities classified under nothing it asked about", async () => {
    const result = await getClassifiedUnder(db.connection, ["settlement"]);
    expect(result.entities["L-unrelated"]).toBeUndefined();
  });

  it("shadows a Concept for an entity under one of its own subclasses that was asked about too", async () => {
    const result = await getClassifiedUnder(db.connection, ["settlement", "city"]);
    expect(result.entities["L-city"]).toEqual([
      entry("settlement", "city", true),
      entry("city", "city"),
    ]);
  });

  it("does not shadow a Concept the entity is also classified under directly", async () => {
    const result = await getClassifiedUnder(db.connection, ["settlement", "city"]);
    const settlement = result.entities["L-twice"].find((one) => one.concept === "settlement");
    expect(settlement).toEqual(entry("settlement", "settlement"));
  });

  it("keeps both Concepts for an entity under two branches that do not meet", async () => {
    const result = await getClassifiedUnder(db.connection, ["religious", "settlement"]);
    expect(result.entities["L-cathedral"]).toEqual([
      entry("religious", "cathedral town"),
      entry("settlement", "cathedral town"),
    ]);
  });

  it("returns the Concepts in the order they were asked", async () => {
    const result = await getClassifiedUnder(db.connection, ["settlement", "religious"]);
    expect(result.entities["L-cathedral"].map((one) => one.concept)).toEqual([
      "settlement",
      "religious",
    ]);
  });

  it("does not shadow two synonyms by each other, so both are shown", async () => {
    const result = await getClassifiedUnder(db.connection, ["city", "civitas"]);
    expect(result.entities["L-city"]).toEqual([entry("city", "city"), entry("civitas", "city")]);
  });

  it("does not shadow two Concepts that are each other's subclass, and ends on a cycle", async () => {
    const result = await getClassifiedUnder(db.connection, ["loop a", "loop b"]);
    expect(result.entities["L-loop"]).toEqual([
      entry("loop a", "loop a"),
      entry("loop b", "loop a"),
    ]);
  });

  it("answers for a Concept nothing is classified under with no entities", async () => {
    expect(await getClassifiedUnder(db.connection, ["town-with-nobody"])).toEqual({
      entities: {},
      truncated: [],
    });
    expect(await getClassifiedUnder(db.connection, [])).toEqual({ entities: {}, truncated: [] });
  });

  it("lists the Concepts below one, itself included", async () => {
    const { below, truncated } = await getConceptsBelow(db.connection, "settlement");
    expect([...below].sort()).toEqual(
      [
        "settlement",
        "city",
        "civitas",
        "free civitas",
        "town",
        "village",
        "cathedral town",
      ].sort()
    );
    expect(truncated).toBe(false);
  });
});

describe("getClassifiedUnder, when the walk hits its limit", () => {
  afterEach(() => jest.restoreAllMocks());

  it("says which Concept was cut short", async () => {
    jest
      .spyOn(functions, "getSubordinateEntityIds")
      .mockResolvedValue(
        Array.from({ length: functions.SUBORDINATE_MAX_NODES }, (_, index) => `deep-${index}`)
      );
    jest.spyOn(functions, "getEquivalentEntityIds").mockResolvedValue([]);
    jest.spyOn(Relation, "findForEntities").mockResolvedValue([]);

    const result = await getClassifiedUnder({} as any, ["broad"]);

    expect(result.truncated).toEqual(["broad"]);
  });
});
