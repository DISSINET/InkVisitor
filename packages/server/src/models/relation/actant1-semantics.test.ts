import "ts-jest";
import { Db } from "@service/RethinkDB";
import { newMockRequest } from "@modules/common.test";
import { prepareEntity } from "@models/entity/entity.test";
import Entity from "@models/entity/entity";
import { IRequest } from "src/custom_typings/request";
import { ModelNotValidError } from "@shared/types/errors";
import Actant1Semantics from "./actant1-semantics";
import { EntityEnums } from "@shared/enums";

describe("test Actant1Semantics.beforeSave", function () {
  const db = new Db();
  const entities: Entity[] = [];
  let request: IRequest;

  beforeAll(async () => {
    await db.initDb();
    const [, entity1] = prepareEntity();
    entity1.class = EntityEnums.Class.Action;
    await entity1.save(db.connection);
    entities.push(entity1);
    const [, entity2] = prepareEntity();
    entity2.class = EntityEnums.Class.Concept;
    await entity2.save(db.connection);
    entities.push(entity2);
    request = newMockRequest(db);
  })

  afterAll(async () => {
    await db.close();
  })

  test("ok relation", async () => {
    const okRelation = new Actant1Semantics({ entityIds: [entities[0].id, entities[1].id] });

    await expect(okRelation.beforeSave(request)).resolves.not.toThrowError();
  });

  test("bad relation", async () => {
    const badRelation = new Actant1Semantics({ entityIds: [entities[1].id, entities[0].id] });

    await expect(badRelation.beforeSave(request)).rejects.toBeInstanceOf(ModelNotValidError);
  })
});