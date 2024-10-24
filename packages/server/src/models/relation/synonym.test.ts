import "ts-jest";
import { Db } from "@service/rethink";
import { newMockRequest } from "@modules/common.test";
import { prepareEntity } from "@models/entity/entity.test";
import Entity from "@models/entity/entity";
import { IRequest } from "src/custom_typings/request";
import { ModelNotValidError } from "@shared/types/errors";
import Synonym from "./synonym";
import { EntityEnums } from "@shared/enums";

describe("test Synonym.beforeSave", function () {
  const db = new Db();
  const entities: Entity[] = [];
  let request: IRequest;

  beforeAll(async () => {
    await db.initDb();
    request = newMockRequest(db);
  });

  afterAll(async () => {
    await db.close();
  });

  test("ok relations", async () => {
    let entities = [new Entity({ id: "1", class: EntityEnums.Class.Action })];
    const okRelation1 = new Synonym({ entityIds: entities.map((e) => e.id) });
    okRelation1.entities = entities;
    await expect(okRelation1.beforeSave(request)).resolves.not.toThrowError();

    entities = [new Entity({ id: "2", class: EntityEnums.Class.Concept })];
    const okRelation2 = new Synonym({ entityIds: entities.map((e) => e.id) });
    okRelation2.entities = entities;
    await expect(okRelation1.beforeSave(request)).resolves.not.toThrowError();
  });

  test("bad relation", async () => {
    const entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Location }),
    ];
    const badRelation = new Synonym({ entityIds: entities.map((e) => e.id) });
    badRelation.entities = entities;
    await expect(badRelation.beforeSave(request)).rejects.toBeInstanceOf(
      ModelNotValidError
    );
  });

  test("ok classes, but no equal", async () => {
    const entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Action }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];
    const badRelation = new Synonym({ entityIds: entities.map((e) => e.id) });
    badRelation.entities = entities;

    await expect(badRelation.beforeSave(request)).rejects.toBeInstanceOf(
      ModelNotValidError
    );
  });
});

describe("test Synonym.validateEntities", function () {
  test("deny [A] only [A] or [C]", () => {
    const relation = new Synonym({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Action }),
      new Entity({ id: "2", class: EntityEnums.Class.Action }),
    ];

    let result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Concept }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();
  });

  test("deny [L] or [G]", () => {
    const relation = new Synonym({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Location }),
      new Entity({ id: "2", class: EntityEnums.Class.Location }),
    ];

    let result = relation.validateEntities();
    expect(result).not.toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Group }),
      new Entity({ id: "2", class: EntityEnums.Class.Group }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();
  });

  test("deny AC / CA or LA/AL or GC/CG", () => {
    const relation = new Synonym({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Action }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    let result = relation.validateEntities();
    expect(result).not.toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Concept }),
      new Entity({ id: "2", class: EntityEnums.Class.Action }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Location }),
      new Entity({ id: "2", class: EntityEnums.Class.Action }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Action }),
      new Entity({ id: "2", class: EntityEnums.Class.Location }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Group }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Concept }),
      new Entity({ id: "2", class: EntityEnums.Class.Group }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();
  });
});
