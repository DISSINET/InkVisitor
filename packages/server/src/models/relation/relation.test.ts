import "ts-jest";
import { Db } from "@service/RethinkDB";
import Relation from "./relation";
import { newMockRequest } from "@modules/common.test";
import { prepareEntity } from "@models/entity/entity.test";
import Entity from "@models/entity/entity";
import { IRequest } from "src/custom_typings/request";
import { ModelNotValidError } from "@shared/types/errors";

export const prepareRelation = (): [string, Relation] => {
  const id = Math.random().toString();

  const ent = new Relation({ id });

  return [id, ent];
};

describe("test Relation.beforeSave", function () {
  test("test preloading entities", async () => {
    const db = new Db();
    const entities: Entity[] = [];
    let relation: Relation;
    let request: IRequest;

    await db.initDb();
    const [, entity1] = prepareEntity();
    await entity1.save(db.connection);
    entities.push(entity1);
    const [, entity2] = prepareEntity();
    await entity2.save(db.connection);
    entities.push(entity2);

    relation = new Relation({ entityIds: [entities[0].id, entities[1].id] });
    request = newMockRequest(db);

    expect(relation.entities).toBeUndefined();
    await expect(relation.beforeSave(request)).resolves.not.toThrowError();
    expect(relation.entities).not.toBeUndefined();

    await db.close();
  })

  test("test invalid entity", async () => {
    const db = new Db();
    const entities: Entity[] = [];
    let relation: Relation;
    let request: IRequest;

    await db.initDb();
    const [, entity1] = prepareEntity();
    await entity1.save(db.connection);
    entities.push(entity1);
    const [, entity2] = prepareEntity();
    (entity2 as any).class = "invalid"
    await entity2.save(db.connection);
    entities.push(entity2);

    relation = new Relation({ entityIds: [entities[0].id, entities[1].id] });
    request = newMockRequest(db);

    expect(relation.entities).toBeUndefined();
    await expect(relation.beforeSave(request)).rejects.toBeInstanceOf(ModelNotValidError);
    expect(relation.entities).not.toBeUndefined();

    await db.close();
  })
});