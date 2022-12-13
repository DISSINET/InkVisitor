import "ts-jest";
import { Db } from "@service/RethinkDB";
import { clean, newMockRequest } from "@modules/common.test";
import { prepareEntity } from "@models/entity/entity.test";
import Entity from "@models/entity/entity";
import { IRequest } from "src/custom_typings/request";
import { ModelNotValidError } from "@shared/types/errors";
import { EntityEnums, RelationEnums } from "@shared/enums";
import { prepareRelation } from "@models/relation/relation.test";
import { ResponseTooltip } from "./response-tooltip";

describe("test ResponseTooltip.getActionEventNodes", function () {
  const db = new Db();
  const entities: Entity[] = [];
  let request: IRequest;
  let entity: Entity;

  beforeAll(async () => {
    await db.initDb();
    [, entity] = prepareEntity();
    entity.class = EntityEnums.Class.Action;
    await entity.save(db.connection);

    console.log("entity saved");
    // search for AEE
    const [, relation1] = prepareRelation(RelationEnums.Type.ActionEventEquivalent);
    relation1.entityIds = [entity.id, "2"];
    console.log("relation1", relation1.type, relation1.entityIds);
    await relation1.save(db.connection);

    // search for SCL
    const [, relation2] = prepareRelation(RelationEnums.Type.Superclass);
    relation2.entityIds = ["2", "3"];
    await relation2.save(db.connection);

    // search for SCL lvl 2
    const [, relation3] = prepareRelation(RelationEnums.Type.Superclass);
    relation3.entityIds = ["3", "4"];
    await relation3.save(db.connection);

    // search for SCL lvl 3 (two instances)
    const [, relation4_1] = prepareRelation(RelationEnums.Type.Superclass);
    relation4_1.entityIds = ["4", "5-1"];
    await relation4_1.save(db.connection);

    const [, relation4_2] = prepareRelation(RelationEnums.Type.Superclass);
    relation4_2.entityIds = ["4", "5-2"];
    await relation4_2.save(db.connection);

    // search for SCL lvl 4
    const [, relation5] = prepareRelation(RelationEnums.Type.Superclass);
    relation5.entityIds = ["5-1", "6"];
    await relation5.save(db.connection);

    request = newMockRequest(db);
  });

  afterAll(async () => {
    await clean(db);
  });

  test("bad class for relation", async () => {
    const entity = new Entity({ class: EntityEnums.Class.Concept });
    const response = new ResponseTooltip(entity);
    await response.relations.prepare(request, [RelationEnums.Type.ActionEventEquivalent]);
    expect(response.relations[RelationEnums.Type.ActionEventEquivalent]?.connections).toHaveLength(0);
  });

  test("full tree available", async () => {
    const response = new ResponseTooltip(entity);
    await response.relations.prepare(request, [RelationEnums.Type.ActionEventEquivalent]);

    const connections = response.relations[RelationEnums.Type.ActionEventEquivalent]?.connections || [];

    // AEE
    expect(connections).toHaveLength(1); // relation1

    const lvl1 = connections[0].subtrees;

    expect(lvl1).toHaveLength(1); // relation2
  });
});