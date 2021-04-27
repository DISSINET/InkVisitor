import "ts-jest";
import { Db } from "@service/RethinkDB";
import Actant from "./actant";
import Statement from "./statement";
import { clean } from "@modules/common.test";
import { findActantById } from "@service/shorthands";
import { IStatement } from "@shared/types";

describe("test Actant.getDependentStatements", function () {
  describe("if there is one non dependent statement", () => {
    it("should return empty array", async () => {
      const db = new Db();
      await db.initDb();

      const actant = new Actant();
      await actant.save(db.connection);
      const statement = new Statement({});
      await statement.save(db.connection);

      const linkedStatements = await actant.getDependentStatements(
        db.connection
      );

      expect(linkedStatements).toHaveLength(0);

      await clean(db);
    });
  });

  describe("if there exists one dependent statement via actants array", () => {
    it("should return array with one element", async () => {
      const db = new Db();
      await db.initDb();

      const actant = new Actant();
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

      const linkedStatements = await actant.getDependentStatements(
        db.connection
      );

      expect(linkedStatements).toHaveLength(1);
      expect(linkedStatements[0].id).toEqual(statement.id);

      await clean(db);
    });
  });

  describe("if there exists one dependent statement via props array", () => {
    it("should return array with one element", async () => {
      const db = new Db();
      await db.initDb();

      const actant = new Actant();
      await actant.save(db.connection);
      const statement = new Statement({
        data: {
          props: [
            {
              origin: actant.id,
            },
          ],
        },
      });
      await statement.save(db.connection);

      const linkedStatements = await actant.getDependentStatements(
        db.connection
      );

      expect(linkedStatements).toHaveLength(1);
      expect(linkedStatements[0].id).toEqual(statement.id);

      await clean(db);
    });
  });

  describe("if there exists dependent statement via actants and props field", () => {
    it("should return array with one element", async () => {
      const db = new Db();
      await db.initDb();

      const actant = new Actant();
      await actant.save(db.connection);
      const statement = new Statement({
        data: {
          actants: [
            {
              actant: actant.id,
            },
          ],
          props: [
            {
              origin: actant.id,
            },
          ],
        },
      });
      await statement.save(db.connection);

      const linkedStatements = await actant.getDependentStatements(
        db.connection
      );

      expect(linkedStatements).toHaveLength(1);
      expect(linkedStatements[0].id).toEqual(statement.id);

      await clean(db);
    });
  });

  describe("if there exists one dependent statement and one non dependent", () => {
    it("should return array with one element", async () => {
      const db = new Db();
      await db.initDb();

      const actant = new Actant();
      await actant.save(db.connection);
      const depStatement = new Statement({
        data: {
          actants: [
            {
              actant: actant.id,
            },
          ],
        },
      });
      await depStatement.save(db.connection);
      const nondepStatement = new Statement({});
      await nondepStatement.save(db.connection);

      const linkedStatements = await actant.getDependentStatements(
        db.connection
      );

      expect(linkedStatements).toHaveLength(1);
      expect(linkedStatements[0].id).toEqual(depStatement.id);

      await clean(db);
    });
  });

  describe("if there exist two dependen dependent statements", () => {
    it("should return array with two elements", async () => {
      const db = new Db();
      await db.initDb();

      const actant = new Actant();
      await actant.save(db.connection);
      const depStatement1 = new Statement({
        data: {
          actants: [
            {
              actant: actant.id,
            },
          ],
        },
      });
      await depStatement1.save(db.connection);
      const depStatement2 = new Statement({
        data: {
          props: [
            {
              origin: actant.id,
            },
          ],
        },
      });
      await depStatement2.save(db.connection);

      const linkedStatements = await actant.getDependentStatements(
        db.connection
      );

      expect(linkedStatements).toHaveLength(2);

      await clean(db);
    });
  });
});

describe("test Actant.delete", function () {
  describe("one existing linked statement", () => {
    it("should correctly remove actant from statement's data.actants", async () => {
      const db = new Db();
      await db.initDb();

      const actant = new Actant();
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
      const actant = new Actant();
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
