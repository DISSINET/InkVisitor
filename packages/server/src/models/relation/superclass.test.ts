import "ts-jest";
import { Db } from "@service/RethinkDB";
import { newMockRequest } from "@modules/common.test";
import Entity from "@models/entity/entity";
import { IRequest } from "src/custom_typings/request";
import { ModelNotValidError } from "@shared/types/errors";
import Superclass from "./superclass";
import { EntityEnums } from "@shared/enums";

describe("test Superclass.beforeSave", function () {
  const db = new Db();
  const entities: Entity[] = [];
  let request: IRequest;

  beforeAll(async () => {
    await db.initDb();
    request = newMockRequest(db);
  })

  afterAll(async () => {
    await db.close();
  })

  test("ok relations", async () => {
    let entities = [new Entity({ id: "1", class: EntityEnums.Class.Action }), new Entity({ id: "2", class: EntityEnums.Class.Action })];
    const okRelation1 = new Superclass({ entityIds: [entities[0].id, entities[1].id] });
    okRelation1.entities = entities;
    await expect(okRelation1.beforeSave(request)).resolves.not.toThrowError();

    entities = [new Entity({ id: "1", class: EntityEnums.Class.Concept }), new Entity({ id: "2", class: EntityEnums.Class.Concept })];
    const okRelation2 = new Superclass({ entityIds: [entities[0].id, entities[1].id] });
    okRelation2.entities = entities;
    await expect(okRelation1.beforeSave(request)).resolves.not.toThrowError();
  });

  test("bad relation", async () => {
    let entities = [new Entity({ id: "1", class: EntityEnums.Class.Location }), new Entity({ id: "2", class: EntityEnums.Class.Action })];
    const badRelation = new Superclass({ entityIds: [entities[0].id, entities[1].id] });
    badRelation.entities = entities;
    await expect(badRelation.beforeSave(request)).rejects.toBeInstanceOf(ModelNotValidError);
  })

  test("ok classes, but no equal", async () => {
    const entities = [new Entity({ id: "1", class: EntityEnums.Class.Action }), new Entity({ id: "2", class: EntityEnums.Class.Concept })];
    const badRelation = new Superclass({ entityIds: [entities[0].id, entities[1].id] });
    badRelation.entities = entities;

    await expect(badRelation.beforeSave(request)).rejects.toBeInstanceOf(ModelNotValidError);
  })
});