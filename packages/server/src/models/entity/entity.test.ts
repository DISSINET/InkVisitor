import "ts-jest";
import { Db } from "@service/RethinkDB";
import Entity from "./entity";
import Statement, {
  StatementActant,
  StatementAction,
  StatementTerritory,
} from "@models/statement/statement";
import { clean } from "@modules/common.test";
import { findEntityById } from "@service/shorthands";
import { IEntity, IEvent, IStatement } from "@shared/types";
import Prop from "@models/prop/prop";
import { EntityEnums } from "@shared/enums";
import { getEntityClass } from "@models/factory";
import entities from "@modules/entities";
import Reference from "./reference";
import { InvalidDeleteError } from "@shared/types/errors";

export const prepareEntity = (
  classValue: EntityEnums.Class = EntityEnums.Class.Concept
): [string, Entity] => {
  const id = Math.random().toString();

  const ent = new Entity({ id, class: classValue });
  ent.props.push(new Prop({ id: `${id}-props[0].id` }));

  ent.props[0].children.push(new Prop({ id: `${id}-props[0].children[0].id` }));
  ent.props[0].children[0].children.push(
    new Prop({ id: `${id}-props[0].children[0].children[0].id` })
  );
  ent.props[0].children[0].children[0].children.push(
    new Prop({ id: `${id}-props[0].children[0].children[0].children[0].id` })
  );

  return [id, ent];
};

describe("test Entity.save", () => {
  let db: Db;
  const entity = new Entity({});

  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  afterAll(async () => {
    await db.close();
  });

  test("createdAt timestamp should be added in save call", async () => {
    expect(entity.createdAt).toBeUndefined();

    await entity.save(db.connection);
    expect(entity.createdAt).not.toBeUndefined();
  });

  test("createdAt timestamp should be retrievable", async () => {
    const foundEntity = await findEntityById(db, entity.id);
    expect(foundEntity.createdAt).toEqual(entity.createdAt);
  });

  test("updatedAt timestamp should be empty after initial save", async () => {
    expect(entity.updatedAt).toBeUndefined();
  });
});

describe("test Entity.update", function () {
  let db: Db;
  let entity = new Entity({});
  let afterSave: Date | undefined,
    after1Update: Date | undefined,
    after2Update: Date | undefined;

  beforeAll(async () => {
    db = new Db();
    await db.initDb();
    await entity.save(db.connection);
    afterSave = entity.updatedAt;
    await entity.update(db.connection, {});
    after1Update = entity.updatedAt;
    entity = new Entity(await findEntityById(db, entity.id));
    await entity.update(db.connection, {});
    after2Update = entity.updatedAt;
  });

  afterAll(async () => {
    await db.close();
  });

  describe("if providing only part of nested data", () => {
    it("should update it as merge operation", async (done) => {
      const entity = new Statement({});
      entity.data.tags = ["origtag1", "origtag2"];
      entity.data.text = "jea";
      entity.data.territory = new StatementTerritory({
        territoryId: "territoryId",
        order: 2,
      });
      entity.data.actants = [
        new StatementActant({ id: "1" }),
        new StatementActant({ id: "2" }),
      ];

      await entity.save(db.connection);

      const entityRef = new Statement({ id: entity.id });
      const newTextValue = "changed";
      const newEntityId = "3";
      const newTagsValue: string[] = [];
      await entityRef.update(db.connection, {
        data: {
          text: newTextValue,
          actants: [{ id: newEntityId }],
          tags: newTagsValue,
        },
      });

      const existingEntityData = await findEntityById<IStatement>(
        db,
        entity.id
      );

      // new value
      expect(existingEntityData.data.text).toEqual(newTextValue);
      //  territory data from the save call
      expect(existingEntityData.data.territory?.territoryId).toEqual(
        entity.data.territory?.territoryId
      );
      // actants field should be replaced
      expect(existingEntityData.data.actants).toHaveLength(1);
      expect(existingEntityData.data.actants[0].id).toEqual(newEntityId);
      expect(existingEntityData.data.tags).toEqual(newTagsValue);

      await clean(db);
      done();
    });
  });

  describe("updatedAt timestamp should be added in update call", () => {
    it("updateAt should be empty after save", () => {
      expect(afterSave).toBeUndefined();
    });

    it("updateAt should be set after first update", () => {
      expect(after1Update).not.toBeUndefined();
    });

    it("updateAt should be renewed after second update", () => {
      expect(after2Update).not.toBeUndefined();
      expect(after1Update?.getTime()).not.toEqual(after2Update?.getTime());
    });
  });
});

describe("test Entity.delete", function () {
  describe("one referenced, one free entity", () => {
    const db = new Db();
    const entity = new Entity({ id: Math.random().toString() });
    const freeEntity = new Entity({ id: Math.random().toString() });
    const statement = new Statement({});
    statement.data.actants.push(
      new StatementActant({
        entityId: entity.id,
      })
    );

    beforeAll(async () => {
      await db.initDb();
      await entity.save(db.connection);
      await freeEntity.save(db.connection);
      await statement.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    it("should correctly issue error when trying to remove entity still referenced in statement's data.actants", async () => {
      await expect(entity.delete(db.connection)).rejects.toThrowError(
        InvalidDeleteError
      );
    });

    it("should correctly allow delete call for not referenced entity", async () => {
      await expect(freeEntity.delete(db.connection)).resolves.toBeTruthy();

      const afterDelete = await findEntityById(db.connection, freeEntity.id);
      expect(afterDelete).toBeFalsy();
    });
  });
});

describe("test Entity.getEntitiesIds", function () {
  describe("one id used repeatedly", function () {
    const [id, instance] = prepareEntity();
    instance.props[0].value.entityId = id;
    instance.props[0].type.entityId = id;
    instance.props[0].children[0].value.entityId = id;
    instance.props[0].children[0].children[0].type.entityId = id;
    instance.props[0].children[0].children[0].children[0].value.entityId = id;

    const idList = instance.getEntitiesIds();
    it("should return only one element", () => {
      expect(idList).toEqual([id]);
    });
  });

  describe("two ids used", function () {
    const [id, instance] = prepareEntity();
    const id2 = id + "2";

    instance.props[0].value.entityId = id;
    instance.props[0].type.entityId = id2;
    instance.props[0].children[0].value.entityId = id;
    instance.props[0].children[0].children[0].type.entityId = id2;
    instance.props[0].children[0].children[0].children[0].value.entityId = id2;

    const idList = instance.getEntitiesIds();
    it("should return both elements", () => {
      expect(idList.sort()).toEqual([id, id2].sort());
    });
  });
});

describe("test Entity.findFromTemplate", function () {
  const db = new Db();

  beforeAll(async () => {
    await db.initDb();
  });
  afterAll(async () => await clean(db));

  describe("one cast for template", function () {
    const [templateId, template] = prepareEntity();

    const [cast1Id, cast1] = prepareEntity();
    cast1.usedTemplate = templateId;

    it("should return only one element", async () => {
      await template.save(db.connection);
      await cast1.save(db.connection);

      const foundCasts = await template.findFromTemplate(db.connection);

      expect(foundCasts.length).toEqual(1);
      expect(foundCasts[0].id).toEqual(cast1Id);
    });
  });
});

describe("test Entity.resetIds", function () {
  test("exhausting Event", function () {
    const defaulId = "test";
    const entityData: IEvent = {
      id: defaulId,
      class: EntityEnums.Class.Event,
      data: {
        logicalType: EntityEnums.LogicalType.Definite,
      },
      status: EntityEnums.Status.Approved,
      label: "",
      detail: "",
      language: EntityEnums.Language.Empty,
      notes: [],
      props: [
        new Prop({ id: defaulId, children: [new Prop({ id: defaulId })] }),
      ],
      references: [new Reference({ id: defaulId, resource: "", value: "" })],
    };

    const instance = getEntityClass(entityData);

    expect(instance.id).toEqual(defaulId);
    expect(instance.props[0].id).toEqual(defaulId);
    expect(instance.props[0].children[0].id).toEqual(defaulId);
    expect(instance.references[0].id).toEqual(defaulId);

    instance.resetIds();

    expect(instance.id).toBeFalsy();
    expect(instance.props[0].id).toBeTruthy();
    expect(instance.props[0].id).not.toEqual(defaulId);
    expect(instance.props[0].children[0].id).toBeTruthy();
    expect(instance.props[0].children[0].id).not.toEqual(defaulId);
    expect(instance.references[0].id).toBeTruthy();
    expect(instance.references[0].id).not.toEqual(defaulId);
  });
});
