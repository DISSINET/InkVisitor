import "ts-jest";
import { Db } from "@service/RethinkDB";
import Entity from "./entity";
import Statement from "@models/statement/statement";
import { clean } from "@modules/common.test";
import { findActantById } from "@service/shorthands";
import { IStatement } from "@shared/types";

describe("test Entity.delete", function () {
  describe("one existing linked statement", () => {
    it("should correctly remove actant from statement's data.actants", async () => {
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
      const existingStatement = await findActantById<IStatement>(
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
      const existinStatementViaActants = await findActantById<IStatement>(
        db,
        statementViaActants.id
      );
      expect(existinStatementViaActants.data.actants).toHaveLength(0);
    });

    it("should correctly remove actant from actions array for the second statement", async () => {
      // after the deletion, the linked statement should reflect this ->
      // empty actants array
      const existinStatementViaAction = await findActantById<IStatement>(
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

      const existingEntityData = await findActantById<IStatement>(
        db,
        entity.id
      );
      // new value
      expect(existingEntityData.data.text).toEqual(newTextValue);
      //  territory data from the save call
      expect(existingEntityData.data.territory.id).toEqual(
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
