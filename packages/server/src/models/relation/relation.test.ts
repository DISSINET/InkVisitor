import "ts-jest";
import { Db } from "@service/RethinkDB";
import Relation from "./relation";
import { clean, newMockRequest } from "@modules/common.test";
import { prepareEntity } from "@models/entity/entity.test";
import Entity from "@models/entity/entity";
import { IRequest } from "src/custom_typings/request";
import { InternalServerError, ModelNotValidError } from "@shared/types/errors";
import { EntityEnums, RelationEnums } from "@shared/enums";
import { getRelationClass } from "@models/factory";
import Actant1Semantics from "./actant1-semantics";
import Actant2Semantics from "./actant2-semantics";
import { deleteRelations } from "@service/shorthands";

export const prepareRelation = <T extends Relation>(type: RelationEnums.Type): [string, T] => {
  const id = Math.random().toString();

  const ent = getRelationClass({ id, type }) as T;

  return [id, ent];
};

describe("test Relation.beforeSave", function () {
  let db: Db;

  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  beforeEach(async () => {
    await deleteRelations(db);
  });

  afterAll(async () => {
    await clean(db);
  });

  test("test preloading entities", async () => {
    const entities: Entity[] = [];
    let relation: Relation;
    let request: IRequest;

    const [, entity1] = prepareEntity();
    await entity1.save(db.connection);
    entities.push(entity1);
    const [, entity2] = prepareEntity();
    await entity2.save(db.connection);
    entities.push(entity2);

    relation = new Relation({ entityIds: [entities[0].id, entities[1].id], type: RelationEnums.Type.Synonym });
    request = newMockRequest(db);

    expect(relation.entities).toBeUndefined();
    await expect(relation.beforeSave(request)).resolves.not.toThrowError();
    expect(relation.entities).not.toBeUndefined();
  });

  test("test invalid entity", async () => {
    const entities: Entity[] = [];
    let relation: Relation;
    let request: IRequest;

    const [, entity1] = prepareEntity();
    await entity1.save(db.connection);
    entities.push(entity1);
    const [, entity2] = prepareEntity();
    (entity2 as any).class = "invalid";
    await entity2.save(db.connection);
    entities.push(entity2);

    relation = new Relation({ entityIds: [entities[0].id, entities[1].id] });
    request = newMockRequest(db);

    expect(relation.entities).toBeUndefined();
    await expect(relation.beforeSave(request)).rejects.toBeInstanceOf(Error);
    expect(relation.entities).not.toBeUndefined();
  });

  test("invalid order", async () => {
    const [, relation] = prepareRelation<Actant1Semantics>(RelationEnums.Type.Actant1Semantics);
    relation.order = "random" as any;

    expect(relation.isValid()).toBeFalsy();
  });

  test("order values", async () => {
    const [, entity1] = prepareEntity();
    entity1.class = EntityEnums.Class.Action;
    await entity1.save(db.connection);
    const [, entity2] = prepareEntity();
    entity2.class = EntityEnums.Class.Concept;
    await entity2.save(db.connection);

    // first - should have order 0
    const [, relation1] = prepareRelation<Actant1Semantics>(RelationEnums.Type.Actant1Semantics);
    relation1.entityIds = [entity1.id, entity2.id];
    await relation1.beforeSave(newMockRequest(db));
    await relation1.save(db.connection);
    expect(relation1.order).toEqual(0);

    // second - should have order 1
    const [, relation2] = prepareRelation<Actant1Semantics>(RelationEnums.Type.Actant1Semantics);
    relation2.entityIds = [entity1.id, entity2.id];
    await relation2.beforeSave(newMockRequest(db));
    await relation2.save(db.connection);
    expect(relation2.order).toEqual(1);

    // third - manually set order - should be stored as 0.5
    const [, relation3] = prepareRelation<Actant1Semantics>(RelationEnums.Type.Actant1Semantics);
    relation3.entityIds = [entity1.id, entity2.id];
    relation3.order = 0;
    await relation3.beforeSave(newMockRequest(db));
    await relation3.save(db.connection);
    expect(relation3.order).toEqual(0.5);


    // fourth - different class - different order
    const [, relation4] = prepareRelation<Actant2Semantics>(RelationEnums.Type.Actant2Semantics);
    relation4.entityIds = [entity1.id, entity2.id];
    await relation4.beforeSave(newMockRequest(db));
    await relation4.save(db.connection);
    expect(relation4.order).toEqual(0);


    // fifth - using the first order - automatically set to 2
    const [, relation5] = prepareRelation<Actant1Semantics>(RelationEnums.Type.Actant1Semantics);
    relation5.entityIds = [entity1.id, entity2.id];
    await relation5.beforeSave(newMockRequest(db));
    await relation5.save(db.connection);
    expect(relation5.order).toEqual(2);

  });
});

describe("test Relation.areEntitiesValid", function () {
  test("missing preloaded entities", () => {
    const relation = new Relation({ entityIds: ["1", "2"] });
    expect(relation.areEntitiesValid()).toBeInstanceOf(InternalServerError);
  });

  test("test synonym (success)", () => {
    const relation = new Relation({ entityIds: ["1", "2"], type: RelationEnums.Type.Synonym });
    relation.entities = [];
    relation.entities.push(new Entity({ id: "1", class: EntityEnums.Class.Concept }));
    relation.entities.push(new Entity({ id: "2", class: EntityEnums.Class.Concept }));

    expect(relation.areEntitiesValid()).toBeNull();
  });

  test("test synonym (fail)", () => {
    const relation = new Relation({ entityIds: ["1", "2"], type: RelationEnums.Type.Synonym });
    relation.entities = [];
    relation.entities.push(new Entity({ id: "1", class: EntityEnums.Class.Concept }));
    relation.entities.push(new Entity({ id: "2", class: EntityEnums.Class.Action }));

    expect(relation.areEntitiesValid()).toBeInstanceOf(ModelNotValidError);
  });

  test("test classification (success)", () => {
    const relation = new Relation({ entityIds: ["1", "2"], type: RelationEnums.Type.Classification });
    relation.entities = [];
    relation.entities.push(new Entity({ id: "1", class: EntityEnums.Class.Event }));
    relation.entities.push(new Entity({ id: "2", class: EntityEnums.Class.Concept }));

    expect(relation.areEntitiesValid()).toBeNull();
  });

  test("test classification (fail)", () => {
    const relation = new Relation({ entityIds: ["1", "2"], type: RelationEnums.Type.Classification });
    relation.entities = [];
    relation.entities.push(new Entity({ id: "1", class: EntityEnums.Class.Concept }));
    relation.entities.push(new Entity({ id: "2", class: EntityEnums.Class.Action }));

    expect(relation.areEntitiesValid()).toBeInstanceOf(ModelNotValidError);
  });
});