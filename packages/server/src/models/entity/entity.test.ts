import "ts-jest";
import { Db } from "@service/rethink";
import Entity from "./entity";
import Statement, {
  StatementActant,
  StatementAction,
  StatementTerritory,
} from "@models/statement/statement";
import { clean } from "@modules/common.test";
import { findEntityById } from "@service/shorthands";
import { IEvent, IReference, IStatement } from "@shared/types";
import Prop, { PropSpec } from "@models/prop/prop";
import { EntityEnums } from "@shared/enums";
import { getEntityClass } from "@models/factory";
import Reference from "./reference";
import { ModelNotValidError } from "@shared/types/errors";

export const prepareEntity = (
  classValue: EntityEnums.Class = EntityEnums.Class.Concept
): [string, Entity] => {
  const id = Math.random().toString();

  const ent = new Entity({ id, class: classValue });
  ent.label = `${ent.id}-label`;
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

describe("test Entity.beforeSave", () => {
  let db: Db;

  const tpl = new Entity({ isTemplate: true });
  const notTpl = new Entity({ isTemplate: false });

  beforeAll(async () => {
    db = new Db();
    await db.initDb();
    await tpl.save(db.connection);
    await notTpl.save(db.connection);
  });

  afterAll(async () => {
    await tpl.delete(db.connection);
    await notTpl.delete(db.connection);
    await db.close();
  });

  test("before save should not throw anything if linked-entities are empty", async () => {
    const entity = new Entity({});
    expect(async () => {
      await entity.beforeSave(db.connection);
    }).not.toThrowError();
  });

  test("before save should not throw anything if linked-entities are non-tpls", async () => {
    const entityRef = new Entity({
      references: [
        { id: "rand", resource: "res", value: notTpl.id },
      ] as IReference[],
    });
    const statementAction = new Statement({});
    statementAction.data.actions.push(
      new StatementAction({
        props: [
          new Prop({
            type: new PropSpec({
              entityId: notTpl.id,
            }),
          }),
        ],
      })
    );

    expect(async () => {
      await entityRef.beforeSave(db.connection);
    }).not.toThrowError();
    expect(async () => {
      await statementAction.beforeSave(db.connection);
    }).not.toThrowError();
  });

  test("before save should throw an error if tpl is used in various places", async () => {
    const entityRef = new Entity({
      references: [
        { id: "rand", resource: "res", value: tpl.id },
      ] as IReference[],
    });
    const statementAction = new Statement({});
    statementAction.data.actions.push(
      new StatementAction({
        props: [
          new Prop({
            type: new PropSpec({
              entityId: tpl.id,
            }),
          }),
        ],
      })
    );

    expect(async () => {
      await entityRef.beforeSave(db.connection);
    }).rejects.toThrowError(ModelNotValidError);
    expect(async () => {
      await statementAction.beforeSave(db.connection);
    }).rejects.toThrowError(ModelNotValidError);
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
    it("should update it as merge operation", async () => {
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

  describe("unwanted data", () => {
    it("should not have unwanted field in final object", async () => {
      const entity = new Statement({});
      await entity.save(db.connection);
      const updateData = {
        unwanted: 1,
        labels: ["newtitle"],
        legacyId: "legacy",
      };
      await entity.update(db.connection, { ...updateData });

      const updatedEntity = await findEntityById<
        IStatement & { unwanted?: string }
      >(db, entity.id);

      // required field
      expect(updatedEntity.labels).toEqual(updateData.labels);
      // optional field
      expect(updatedEntity.legacyId).toEqual(updateData.legacyId);
      // unwanted field
      expect(updatedEntity.unwanted).toBeUndefined();
    });
  });
});

describe("test Entity.delete", function () {
  describe("one referenced, one free entity", () => {
    const db = new Db();
    const entity = new Entity({ id: Math.random().toString() });

    beforeAll(async () => {
      await db.initDb();
      await entity.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    it("should correctly allow delete call", async () => {
      await expect(entity.delete(db.connection)).resolves.toBeTruthy();

      const afterDelete = await findEntityById(db.connection, entity.id);
      expect(afterDelete).toBeFalsy();
    });
  });
});

describe("test Entity.getUsedByEntity", function () {
  describe("one referenced, one not referenced entity", () => {
    const db = new Db();
    const entity = new Entity({ id: Math.random().toString() });
    const freeEntity = new Entity({ id: Math.random().toString() });
    const statement1 = new Statement({});
    statement1.data.actants.push(
      new StatementActant({
        entityId: entity.id,
      })
    );
    const statement2 = new Statement({});
    statement2.data.actants.push(
      new StatementActant({
        entityId: entity.id,
      })
    );

    beforeAll(async () => {
      await db.initDb();
      await entity.save(db.connection);
      await freeEntity.save(db.connection);
      await statement1.save(db.connection);
      await statement2.save(db.connection);
    });

    afterAll(async () => {
      await clean(db);
    });

    it("should find dependencies(2) for referenced entity", async () => {
      const dependencies = await entity.getUsedByEntity(db.connection);
      expect(dependencies).toHaveLength(2); // two statements
      expect(dependencies.find((e) => e.id === statement1.id)).toBeTruthy();
      expect(dependencies.find((e) => e.id === statement2.id)).toBeTruthy();
    });

    it("should find zero dependent entities for free entity", async () => {
      await expect(
        freeEntity.getUsedByEntity(db.connection)
      ).resolves.toHaveLength(0);
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
      labels: [],
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
