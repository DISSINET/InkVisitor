import "ts-jest";
import { Db } from "@service/rethink";
import { newMockRequest } from "@modules/common.test";
import Entity from "@models/entity/entity";
import { IRequest } from "src/custom_typings/request";
import { ModelNotValidError } from "@shared/types/errors";
import Identification from "./identification";
import { EntityEnums } from "@shared/enums";

describe("test Identification.beforeSave", function () {
  const db = new Db();
  let request: IRequest;

  beforeAll(async () => {
    await db.initDb();
    request = newMockRequest(db);
  });

  afterAll(async () => {
    await db.close();
  });

  test("ok relations", async () => {
    const entities = EntityEnums.PLOGESTRB.map(
      (eClass, i) => new Entity({ id: i.toString(), class: eClass })
    );
    for (let i = 0; i < entities.length - 1; i++) {
      const okRelation = new Identification({
        entityIds: [entities[i].id, entities[i + 1].id],
      });
      okRelation.entities = entities;
      await expect(okRelation.beforeSave(request)).resolves.not.toThrowError();
    }
  });

  test("bad relation", async () => {
    const entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Location }),
      new Entity({ id: "2", class: EntityEnums.Class.Value }),
    ];
    const badRelation = new Identification({
      entityIds: [entities[0].id, entities[1].id],
    });
    badRelation.entities = entities;
    await expect(badRelation.beforeSave(request)).rejects.toBeInstanceOf(
      ModelNotValidError
    );
  });
});

describe("test Identification.validateEntities", function () {
  test("deny A/C entities by default", () => {
    const relation = new Identification({ entityIds: ["1", "2"] });
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
      new Entity({ id: "1", class: EntityEnums.Class.Action }),
      new Entity({ id: "2", class: EntityEnums.Class.Action }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Concept }),
      new Entity({ id: "2", class: EntityEnums.Class.Concept }),
    ];

    result = relation.validateEntities();
    expect(result).not.toBeNull();
  });

  test("allow other entities in pairs [X,X]", () => {
    const relation = new Identification({ entityIds: ["1", "2"] });
    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Person }),
      new Entity({ id: "2", class: EntityEnums.Class.Person }),
    ];

    let result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Location }),
      new Entity({ id: "2", class: EntityEnums.Class.Location }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Object }),
      new Entity({ id: "2", class: EntityEnums.Class.Object }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Group }),
      new Entity({ id: "2", class: EntityEnums.Class.Group }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Event }),
      new Entity({ id: "2", class: EntityEnums.Class.Event }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Statement }),
      new Entity({ id: "2", class: EntityEnums.Class.Statement }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Territory }),
      new Entity({ id: "2", class: EntityEnums.Class.Territory }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Resource }),
      new Entity({ id: "2", class: EntityEnums.Class.Resource }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();

    relation.entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Being }),
      new Entity({ id: "2", class: EntityEnums.Class.Being }),
    ];

    result = relation.validateEntities();
    expect(result).toBeNull();
  });
});
