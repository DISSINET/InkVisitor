import "ts-jest";
import { Db } from "@service/RethinkDB";
import Entity from "./entity";
import Statement from "@models/statement/statement";
import { clean } from "@modules/common.test";
import { findEntityById } from "@service/shorthands";
import { IStatement } from "@shared/types";
import Prop from "@models/prop/prop";
import { Order } from "@shared/enums";

export const prepareEntity = (): [string, Entity] => {
  const entityId = Math.random().toFixed();

  const ent = new Entity({});
  ent.props.push(new Prop({}));

  ent.props[0].children.push(new Prop({}));
  ent.props[0].children[0].children.push(new Prop({}));
  ent.props[0].children[0].children[0].children.push(new Prop({}));

  return [entityId, ent];
};

describe("test Entity.delete", function () {
  describe("one existing linked statement", () => {
    it("should correctly remove entity from statement's data.actants", async () => {
      const db = new Db();
      await db.initDb();

      const entity = new Entity({});
      await entity.save(db.connection);
      const statement = new Statement({
        data: {
          actants: [
            {
              actant: entity.id,
            },
          ],
        },
      });
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
      statementViaActants = new Statement({
        data: {
          actants: [
            {
              actant: entity.id,
            },
          ],
        },
      });
      await statementViaActants.save(db.connection);
      statementViaActions = new Statement({
        data: {
          actions: [
            {
              action: entity.id,
            },
          ],
        },
      });
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

      const entity = new Statement({
        data: {
          territory: {
            id: "territoryId",
            order: 2,
          },
          actants: [
            {
              id: "1",
            },
            {
              id: "2",
            },
          ],
          text: "jea",
          tags: ["origtag1", "origtag2"],
        },
      });
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
      expect(existingEntityData.data.territory?.id).toEqual(
        entity.data.territory.id
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

describe("test Entity.toJSON", function () {
  const instance = new Entity({});
  for (const fieldName of Entity.publicFields) {
    (instance as any)[fieldName] = `value for ${fieldName}`;
  }
  const jsoned = JSON.parse(JSON.stringify(instance));
  const newKeys = Object.keys(jsoned);
  const newValues = Object.values(jsoned);

  it("should correctly map to pub lic fields", () => {
    expect(newKeys).toEqual(Entity.publicFields);
  });

  it("should correctly assign values", () => {
    expect(newValues).toEqual(
      Entity.publicFields.map((fieldName) => (instance as any)[fieldName])
    );
  });
});

describe("test Entity.determineOrder", function () {
  describe("when wanting already used order value", () => {
    const takenIndex = -2;
    const siblings: Record<number, unknown> = { [takenIndex]: true };

    it("should choose slightly bigger real number", () => {
      expect(Entity.determineOrder(takenIndex, siblings)).toBe(takenIndex + 1);
    });
  });

  describe("when wanting already used order value with already used following indexes (+1, +2, +3...)", () => {
    const takenIndex = -2;
    const siblings: Record<number, unknown> = {};
    for (let i = takenIndex; i < 5; i++) {
      siblings[i] = true;
    }

    it("should choose slightly bigger decimal number than originally wanted idnex", () => {
      expect(Entity.determineOrder(takenIndex, siblings)).toBe(
        takenIndex + 0.5
      );
    });
  });

  describe("when wanting unused value", () => {
    const takenIndex = 1;
    const wantedIndex = 2;
    const siblings: Record<number, unknown> = { [takenIndex]: true };

    it("should allow such value", () => {
      expect(Entity.determineOrder(wantedIndex, siblings)).toBe(wantedIndex);
    });
  });

  describe("when wanting last position", () => {
    const wantedIndex = Order.Last;
    const siblings: Record<number, unknown> = { [-1]: true, 0: true, 1: true };
    const values = Object.keys(siblings)
      .map((v) => parseInt(v))
      .sort();

    it("should get originally first index - 1 value", () => {
      expect(Entity.determineOrder(wantedIndex, siblings)).toBe(
        values[values.length - 1] + 1
      );
    });
  });
});

describe("test Entity.getEntitiesIds", function () {
  describe("one id used repeatedly", function () {
    const [id, instance] = prepareEntity();
    instance.props[0].value.id = id;
    instance.props[0].type.id = id;
    instance.props[0].children[0].value.id = id;
    instance.props[0].children[0].children[0].type.id = id;
    instance.props[0].children[0].children[0].children[0].value.id = id;

    const idList = instance.getEntitiesIds();
    it("should return only one element", () => {
      expect(idList).toEqual([id]);
    });
  });

  describe("two ids used", function () {
    const [id, instance] = prepareEntity();
    const id2 = id + "2";

    instance.props[0].value.id = id;
    instance.props[0].type.id = id2;
    instance.props[0].children[0].value.id = id;
    instance.props[0].children[0].children[0].type.id = id2;
    instance.props[0].children[0].children[0].children[0].value.id = id2;

    const idList = instance.getEntitiesIds();
    it("should return both elements", () => {
      expect(idList.sort()).toEqual([id, id2].sort());
    });
  });
});
