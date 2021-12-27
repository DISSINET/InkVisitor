import "ts-jest";
import { Db } from "@service/RethinkDB";
import Actant from "./actant";
import Statement from "./statement";
import { clean } from "@modules/common.test";
import { findActantById } from "@service/shorthands";
import { IStatement } from "@shared/types";

describe("test Actant.delete", function () {
  describe("one existing linked statement", () => {
    it("should correctly remove actant from statement's data.actants", async () => {
      const db = new Db();
      await db.initDb();

      const actant = new Actant({});
      await actant.save(db.connection);
      const statement = new Statement({
        data: {
          actants: [
            {
              actant: actant.id,
            },
          ],
        },
      });
      await statement.save(db.connection);

      await actant.delete(db.connection);

      // after the deletion, the linked statement should reflect this -> empty actants array
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
    let statementViaProps: Statement;

    beforeAll(async () => {
      await db.initDb();
      const actant = new Actant({});
      await actant.save(db.connection);
      statementViaActants = new Statement({
        data: {
          actants: [
            {
              actant: actant.id,
            },
          ],
        },
      });
      await statementViaActants.save(db.connection);
      statementViaProps = new Statement({
        data: {
          props: [
            {
              origin: actant.id,
            },
          ],
        },
      });
      await statementViaProps.save(db.connection);
      await actant.delete(db.connection);
    });
    afterAll(async () => await clean(db));

    it("should correctly remove actant from actants array for the first statement", async () => {
      // after the deletion, the linked statement should reflect this -> empty actants array
      const existinStatementViaActants = await findActantById<IStatement>(
        db,
        statementViaActants.id
      );
      expect(existinStatementViaActants.data.actants).toHaveLength(0);
    });

    it("should correctly remove actant from props array for the second statement", async () => {
      // after the deletion, the linked statement should reflect this -> empty actants array
      const existinStatementViaProps = await findActantById<IStatement>(
        db,
        statementViaProps.id
      );
      expect(existinStatementViaProps.data.props).toHaveLength(0);
    });
  });
});

describe("test Actant.update", function () {
  describe("if providing only part of nested data", () => {
    it("should update it as merge operation", async (done) => {
      const db = new Db();
      await db.initDb();

      const actant = new Statement({
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
      await actant.save(db.connection);

      const actantRef = new Statement({ id: actant.id });
      const newTextValue = "changed";
      const newActantId = "3";
      const newTagsValue: string[] = [];
      await actantRef.update(db.connection, {
        data: {
          text: newTextValue,
          actants: [{ id: newActantId }],
          tags: newTagsValue,
        },
      });

      const existingActantData = await findActantById<IStatement>(
        db,
        actant.id
      );
      // new value
      expect(existingActantData.data.text).toEqual(newTextValue);
      //  territory data from the save call
      expect(existingActantData.data.territory.id).toEqual(
        actant.data.territory.id
      );
      // actants field should be replaced
      expect(existingActantData.data.actants).toHaveLength(1);
      expect(existingActantData.data.actants[0].id).toEqual(newActantId);
      expect(existingActantData.data.tags).toEqual(newTagsValue);

      await clean(db);
      done();
    });
  });
});

describe("test Actant.toJSON", function () {
  describe("without response fields", () => {
    const instance = new Actant({});

    it("should correctly remove serialize", () => {
      const newKeys = Object.keys(JSON.parse(JSON.stringify(instance)));
      expect(newKeys).toEqual(Actant.getPublicFields(instance));
    });
  });
});
