import "ts-jest";
import { Db } from "@service/RethinkDB";
import Entity from "./entity";
import Statement, { StatementActant, StatementAction, StatementTerritory } from "@models/statement/statement";
import { clean } from "@modules/common.test";
import { findEntityById } from "@service/shorthands";
import { IStatement } from "@shared/types";
import Prop from "@models/prop/prop";
import { EntityEnums } from "@shared/enums";

export const prepareEntity = (): [string, Entity] => {
  const id = Math.random().toString();

  const ent = new Entity({ id, class: EntityEnums.Class.Concept });
  ent.props.push(new Prop({ id: `${id}-props[0].id` }));

  ent.props[0].children.push(new Prop({ id: `${id}-props[0].children[0].id` }));
  ent.props[0].children[0].children.push(new Prop({ id: `${id}-props[0].children[0].children[0].id` }));
  ent.props[0].children[0].children[0].children.push(new Prop({ id: `${id}-props[0].children[0].children[0].children[0].id` }));

  return [id, ent];
};

describe("test Entity.delete", function () {
  describe("one existing linked statement", () => {
    it("should correctly remove entity from statement's data.actants", async () => {
      const db = new Db();
      await db.initDb();

      const entity = new Entity({});
      await entity.save(db.connection);
      const statement = new Statement({});
      statement.data.actants.push(new StatementActant({
        entityId: entity.id,
      }));
      await statement.save(db.connection);

      await entity.delete(db.connection);

      // after the deletion, the linked statement should reflect this ->
      // empty actants array
      const existingStatement = await findEntityById<IStatement>(
        db,
        statement.id
      );
      expect(existingStatement.data.actants).toHaveLength(0);

      await clean(db);
    });
  });

  describe("two existing linked statements", () => {
    const db = new Db();
    let statementViaActants: Statement;
    let statementViaActions: Statement;

    beforeAll(async () => {
      await db.initDb();
      const entity = new Entity({});
      await entity.save(db.connection);

      statementViaActants = new Statement({});
      statementViaActants.data.actants.push(new StatementActant({
        entityId: entity.id,
      }));
      await statementViaActants.save(db.connection);

      statementViaActions = new Statement({});
      statementViaActions.data.actions.push(new StatementAction({
        actionId: entity.id,
      }));
      await statementViaActions.save(db.connection);
      await entity.delete(db.connection);
    });

    afterAll(async () => await clean(db));

    it("should correctly remove actant from actants array for the first statement", async () => {
      // after the deletion, the linked statement should reflect this ->
      // empty actants array
      const existinStatementViaActants = await findEntityById<IStatement>(
        db,
        statementViaActants.id
      );
      expect(existinStatementViaActants.data.actants).toHaveLength(0);
    });

    it("should correctly remove actant from actions array for the second statement", async () => {
      // after the deletion, the linked statement should reflect this ->
      // empty actants array
      const existinStatementViaAction = await findEntityById<IStatement>(
        db,
        statementViaActions.id
      );
      expect(existinStatementViaAction.data.actions).toHaveLength(0);
    });
  });
});

describe("test Entity.update", function () {
  describe("if providing only part of nested data", () => {
    it("should update it as merge operation", async (done) => {
      const db = new Db();
      await db.initDb();

      const entity = new Statement({});
      entity.data.tags = ["origtag1", "origtag2"];
      entity.data.text = "jea";
      entity.data.territory = new StatementTerritory({
        territoryId: "territoryId",
        order: 2,
      });
      entity.data.actants = [
        new StatementActant({ id: "1" }),
        new StatementActant({ id: "2" })
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
