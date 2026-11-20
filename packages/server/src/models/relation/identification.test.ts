import "ts-jest";
import { Db } from "@service/storage";
import { newMockRequest } from "@modules/common.test";
import Entity from "@models/entity/entity";
import { IRequest } from "src/custom_typings/request";
import { ModelNotValidError } from "@inkvisitor/shared/types/errors";
import Identification from "./identification";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { Relation as RelationTypes } from "@inkvisitor/shared/types";
import { deleteRelations } from "@service/shorthands";

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
      // preloaded entities count must match entityIds count, otherwise
      // beforeSave re-fetches them from the (empty) db and fails
      okRelation.entities = [entities[i], entities[i + 1]];
      await expect(okRelation.beforeSave(request)).resolves.not.toThrowError();
    }
  });

  test("bad relation", async () => {
    // Identification allows any class combination except the disabledEntities
    // (Action, Concept). Location-Value is now valid, so use a disabled class
    // (Action) to trigger the ModelNotValidError.
    const entities = [
      new Entity({ id: "1", class: EntityEnums.Class.Location }),
      new Entity({ id: "2", class: EntityEnums.Class.Action }),
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

describe("test Identification.getIdentificationForwardConnections", function () {
  const db = new Db();

  const saveIdentification = (id: string, entityIds: [string, string]) =>
    new Identification({
      id,
      entityIds,
      certainty: EntityEnums.Certainty.Certain,
    }).save(db.connection);

  const relatedIds = (
    entityId: string,
    connections: RelationTypes.IConnection<RelationTypes.IIdentification>[] = []
  ): string[] => {
    const out: string[] = [];
    for (const connection of connections) {
      const related = connection.entityIds.find((id) => id !== entityId) as string;
      out.push(related, ...relatedIds(related, connection.subtrees));
    }
    return out;
  };

  beforeAll(async () => {
    await db.initDb();
    await deleteRelations(db);

    // a cycle t1 = t2 = t3 = t1, with t1 = t2 stored a second time reversed
    await saveIdentification("ide-t1-t2", ["t1", "t2"]);
    await saveIdentification("ide-t2-t1", ["t2", "t1"]);
    await saveIdentification("ide-t2-t3", ["t2", "t3"]);
    await saveIdentification("ide-t3-t1", ["t3", "t1"]);
  });

  afterAll(async () => {
    await deleteRelations(db);
    await db.close();
  });

  test("every direct identification is a top-level connection in a cycle", async () => {
    const connections = await Identification.getIdentificationForwardConnections(
      db.connection,
      "t1",
      3,
      0,
      []
    );
    expect(connections.map((connection) => connection.id).sort()).toEqual([
      "ide-t1-t2",
      "ide-t2-t1",
      "ide-t3-t1",
    ]);
  });

  test("a branch does not lead back to the root", async () => {
    const connections = await Identification.getIdentificationForwardConnections(
      db.connection,
      "t1",
      3,
      0,
      []
    );
    expect(relatedIds("t1", connections)).not.toContain("t1");
    const viaT3 = connections.find((connection) => connection.id === "ide-t3-t1");
    expect((viaT3?.subtrees ?? []).map((connection) => connection.id)).toEqual(["ide-t2-t3"]);
  });
});
