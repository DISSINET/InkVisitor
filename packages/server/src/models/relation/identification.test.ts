import "ts-jest";
import { Db } from "@service/RethinkDB";
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
  })

  afterAll(async () => {
    await db.close();
  })

  test("ok relations", async () => {
    let entities = EntityEnums.PLOGESTRB.map((eClass, i) => new Entity({ id: i.toString(), class: eClass }));
    for (let i = 0; i < entities.length - 1; i++) {
      const okRelation = new Identification({ entityIds: [entities[i].id, entities[i + 1].id] });
      okRelation.entities = entities;
      await expect(okRelation.beforeSave(request)).resolves.not.toThrowError();
    }
  });

  test("bad relation", async () => {
    const entities = [new Entity({ id: "1", class: EntityEnums.Class.Location }), new Entity({ id: "2", class: EntityEnums.Class.Value })];
    const badRelation = new Identification({ entityIds: [entities[0].id, entities[1].id] });
    badRelation.entities = entities;
    await expect(badRelation.beforeSave(request)).rejects.toBeInstanceOf(ModelNotValidError);
  })
});