import { ActantType } from "@shared/enums";
import "ts-jest";
import Statement, { StatementTerritory } from "./statement";
import { Db } from "@service/RethinkDB";
import { deleteActants, findActantById } from "@service/shorthands";
import Territory from "./territory";
import { IStatement } from "@shared/types/statement";

describe("Statement constructor test", function () {
  describe("empty data", () => {
    const emptyData = {};
    const emptyStatement: Statement = Object.create(Statement.prototype);
    emptyStatement.id = "";
    emptyStatement.class = ActantType.Statement;
    emptyStatement.label = "";

    emptyStatement.data = Object.create(StatementTerritory.prototype);
    emptyStatement.data.action = "";
    emptyStatement.data.certainty = "";
    emptyStatement.data.elvl = "";
    emptyStatement.data.modality = "";
    emptyStatement.data.text = "";
    emptyStatement.data.note = "";

    emptyStatement.data.territory = Object.create(StatementTerritory.prototype);
    emptyStatement.data.territory.id = "";
    emptyStatement.data.territory.order = -1;

    emptyStatement.data.actants = [];
    emptyStatement.data.props = [];
    emptyStatement.data.references = [];
    emptyStatement.data.tags = [];

    it("should return empty statement", () => {
      const out = new Statement(emptyData);
      expect(out).toEqual(emptyStatement);
    });
  });

  describe("ok data", () => {
    const fullData = {
      id: "id",
      class: "S",
      label: "label",
      data: {
        action: "action",
        certainty: "certainty",
        elvl: "elvl",
        modality: "modality",
        text: "text",
        note: "note",
        territory: {
          id: "id",
          order: 1,
        },
        actants: [],
        props: [],
        references: [],
        tags: [],
      },
    };
    const fullStatement: Statement = Object.create(Statement.prototype);
    fullStatement.id = "id";
    fullStatement.class = ActantType.Statement;
    fullStatement.label = "label";
    fullStatement.data = Object.create(StatementTerritory.prototype);
    fullStatement.data.action = "action";
    fullStatement.data.certainty = "certainty";
    fullStatement.data.elvl = "elvl";
    fullStatement.data.modality = "modality";
    fullStatement.data.text = "text";
    fullStatement.data.note = "note";

    fullStatement.data.territory = Object.create(StatementTerritory.prototype);
    fullStatement.data.territory.id = "id";
    fullStatement.data.territory.order = 1;

    fullStatement.data.actants = [];
    fullStatement.data.props = [];
    fullStatement.data.references = [];
    fullStatement.data.tags = [];

    it("should return full statement", () => {
      const out = new Statement(fullData);
      expect(out).toEqual(fullStatement);
    });
  });
});

describe("Statement validate test", function () {
  describe("empty data", () => {
    it("should return true", () => {
      const emptyStatement = new Statement(undefined);
      expect(emptyStatement.isValid()).toEqual(false);
    });
  });
  describe("not empty data", () => {
    it("should return true", () => {
      const notEmpty = new Statement({
        id: "id",
        class: "S",
        label: "label",
        data: {
          action: "action",
          certainty: "certainty",
          elvl: "elvl",
          modality: "modality",
          text: "text",
          note: "note",
          territory: {
            id: "id",
            order: 1,
          },
          actants: [],
          props: [],
          references: [],
          tags: [],
        },
      });
      expect(notEmpty.isValid()).toEqual(true);
    });
  });
});

describe("findDependentStatementIds", function () {
  let db: Db;
  const baseStatementData: IStatement = {
    class: ActantType.Statement,
    id: "",
    label: "",
    data: {
      action: "",
      certainty: "",
      elvl: "",
      modality: "",
      note: "",
      props: [],
      references: [],
      tags: [],
      territory: {
        id: "",
        order: 0,
      },
      text: "",
      actants: [],
    },
  };
  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  beforeEach(async () => {
    await deleteActants(db);
  });

  afterAll(async () => {
    await db.close();
  });

  describe("empty db", () => {
    it("should return empty array", async (done) => {
      const ids = await Statement.findDependentStatementIds(db.connection, "");
      expect(ids).toHaveLength(0);
      done();
    });
  });

  describe("one territory", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const ids = await Statement.findDependentStatementIds(
        db.connection,
        territory.id
      );
      expect(ids).toHaveLength(0);
    });
  });

  describe("one territory, one unlinked statement", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statement = new Statement({
        data: { territory: { id: "non existent" } },
      });
      await statement.save(db.connection);

      const ids = await Statement.findDependentStatementIds(
        db.connection,
        territory.id
      );
      expect(ids).toHaveLength(0);
    });
  });

  describe("one territory, one linked statement via actants field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statementData: IStatement = JSON.parse(
        JSON.stringify(baseStatementData)
      );
      statementData.data.actants = [
        {
          actant: territory.id,
          certainty: "",
          elvl: "",
          id: "",
          position: "",
        },
      ];
      const statement = new Statement({ ...statementData });
      await statement.save(db.connection);

      const ids = await Statement.findDependentStatementIds(
        db.connection,
        territory.id
      );
      expect(ids).toHaveLength(1);
    });
  });

  describe("one territory, one linked statement via tags field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statementData: IStatement = JSON.parse(
        JSON.stringify(baseStatementData)
      );
      statementData.data.tags = [territory.id];
      const statement = new Statement({ ...statementData });
      await statement.save(db.connection);

      const ids = await Statement.findDependentStatementIds(
        db.connection,
        territory.id
      );
      expect(ids).toHaveLength(1);
    });
  });

  describe("one territory, one linked statement via props.origin field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statementData: IStatement = JSON.parse(
        JSON.stringify(baseStatementData)
      );
      statementData.data.props = [
        {
          id: "",
          certainty: "",
          elvl: "",
          modality: "",
          origin: territory.id,
          type: {
            certainty: "",
            elvl: "",
            id: "",
          },
          value: {
            certainty: "",
            elvl: "",
            id: "",
          },
        },
      ];
      const statement = new Statement({ ...statementData });
      await statement.save(db.connection);

      const ids = await Statement.findDependentStatementIds(
        db.connection,
        territory.id
      );
      expect(ids).toHaveLength(1);
    });
  });

  describe("one territory, one linked statement via props.type.id field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statementData: IStatement = JSON.parse(
        JSON.stringify(baseStatementData)
      );
      statementData.data.props = [
        {
          id: "",
          certainty: "",
          elvl: "",
          modality: "",
          origin: "",
          type: {
            certainty: "",
            elvl: "",
            id: territory.id,
          },
          value: {
            certainty: "",
            elvl: "",
            id: "",
          },
        },
      ];
      const statement = new Statement({ ...statementData });
      await statement.save(db.connection);

      const ids = await Statement.findDependentStatementIds(
        db.connection,
        territory.id
      );
      expect(ids).toHaveLength(1);
    });
  });

  describe("one territory, one linked statement via props.value.id field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statementData: IStatement = JSON.parse(
        JSON.stringify(baseStatementData)
      );
      statementData.data.props = [
        {
          id: "",
          certainty: "",
          elvl: "",
          modality: "",
          origin: "",
          type: {
            certainty: "",
            elvl: "",
            id: "",
          },
          value: {
            certainty: "",
            elvl: "",
            id: territory.id,
          },
        },
      ];
      const statement = new Statement({ ...statementData });
      await statement.save(db.connection);

      const ids = await Statement.findDependentStatementIds(
        db.connection,
        territory.id
      );
      expect(ids).toHaveLength(1);
    });
  });

  describe("one territory, one linked statement via references.resource field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statementData: IStatement = JSON.parse(
        JSON.stringify(baseStatementData)
      );
      statementData.data.references = [
        {
          id: "",
          part: "",
          resource: territory.id,
          type: "",
        },
      ];
      const statement = new Statement({ ...statementData });
      await statement.save(db.connection);

      const ids = await Statement.findDependentStatementIds(
        db.connection,
        territory.id
      );
      expect(ids).toHaveLength(1);
    });
  });

  describe("one territory, one linked statement via territory.id field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statementData: IStatement = JSON.parse(
        JSON.stringify(baseStatementData)
      );
      statementData.data.territory.id = territory.id;
      const statement = new Statement({ ...statementData });
      await statement.save(db.connection);

      const ids = await Statement.findDependentStatementIds(
        db.connection,
        territory.id
      );
      expect(ids).toHaveLength(1);
    });
  });

  describe("one territory, two linked statement via references.resource and tags respectively", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      // first statement linked via references array
      const statementData1: IStatement = JSON.parse(
        JSON.stringify(baseStatementData)
      );
      statementData1.data.references = [
        {
          id: "",
          part: "",
          resource: territory.id,
          type: "",
        },
      ];
      const statement1 = new Statement({ ...statementData1 });
      await statement1.save(db.connection);

      // second statement linked via tags array
      const statementData2: IStatement = JSON.parse(
        JSON.stringify(baseStatementData)
      );
      statementData2.data.tags = [territory.id];
      const statement2 = new Statement({ ...statementData2 });
      await statement2.save(db.connection);

      const ids = await Statement.findDependentStatementIds(
        db.connection,
        territory.id
      );
      expect(ids).toHaveLength(2);
    });
  });

  describe("one territory, two linked statement via references.resource and tags at once", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      // first statement linked via references array and tags
      const statementData1: IStatement = JSON.parse(
        JSON.stringify(baseStatementData)
      );
      statementData1.data.tags = [territory.id];
      statementData1.data.references = [
        {
          id: "",
          part: "",
          resource: territory.id,
          type: "",
        },
      ];
      // second statement is the same
      const statementData2: IStatement = JSON.parse(
        JSON.stringify(statementData1)
      );

      const statement1 = new Statement({ ...statementData1 });
      await statement1.save(db.connection);
      const statement2 = new Statement({ ...statementData2 });
      await statement2.save(db.connection);

      const ids = await Statement.findDependentStatementIds(
        db.connection,
        territory.id
      );
      expect(ids).toHaveLength(2);
    });
  });
});

describe("Statement - save territory order", function () {
  let db: Db;
  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  beforeEach(async () => {
    await deleteActants(db);
  });

  afterAll(async () => {
    await db.close();
  });

  describe("insert one child without explicit order", () => {
    it("should have order = 0", async (done) => {
      const statement = new Statement({ data: { territory: { id: "any" } } });
      await statement.save(db.connection);

      const createdData = await findActantById<IStatement>(db, statement.id);
      expect(createdData.data.territory.id).toEqual(
        statement.data.territory.id
      );
      expect(createdData.data.territory.order).toEqual(0);

      done();
    });
  });

  describe("insert one child with explicit order", () => {
    it("should have order = 999 as wanted", async (done) => {
      const statement = new Statement({
        data: { territory: { id: "any", order: 999 } },
      });
      await statement.save(db.connection);

      const createdData = await findActantById<IStatement>(db, statement.id);
      expect(createdData.data.territory.id).toEqual(
        statement.data.territory.id
      );
      expect(createdData.data.territory.order).toEqual(
        statement.data.territory.order
      );

      done();
    });
  });

  describe("insert two child without explicit order", () => {
    it("should have order = 0 and 1 respectively", async (done) => {
      const statement1 = new Statement({
        data: { territory: { id: "any" } },
      });
      await statement1.save(db.connection);
      const statement2 = new Statement({
        data: { territory: { id: "any" } },
      });
      await statement2.save(db.connection);

      // first statement provides order = -1, which should result in save '0' value
      const createdData1 = await findActantById<IStatement>(db, statement1.id);
      expect(createdData1.data.territory.id).toEqual(
        createdData1.data.territory.id
      );
      expect(createdData1.data.territory.order).toEqual(
        createdData1.data.territory.order
      );
      expect(createdData1.data.territory.order).toEqual(0);

      // second statement provides order = -1, which should result in save '1' value
      const createdData2 = await findActantById<IStatement>(db, statement2.id);
      expect(createdData2.data.territory.id).toEqual(
        createdData2.data.territory.id
      );
      expect(createdData2.data.territory.order).toEqual(
        createdData2.data.territory.order
      );
      expect(createdData2.data.territory.order).toEqual(1);
      done();
    });
  });
});

describe("Statement - update territory order", function () {
  let db: Db;
  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  beforeEach(async () => {
    await deleteActants(db);
  });

  afterAll(async () => {
    await db.close();
  });

  describe("update the only child", () => {
    it("should have order as chosen", async (done) => {
      const statement = new Statement({ data: { territory: { id: "any" } } });
      await statement.save(db.connection);
      const wantedNewOrder = 999;
      await statement.update(db.connection, {
        data: { territory: { order: wantedNewOrder } },
      });
      const createdData = await findActantById<IStatement>(db, statement.id);
      expect(createdData.data.territory.order).toEqual(wantedNewOrder);

      done();
    });
  });

  describe("update the second's order value without conflict ", () => {
    it("should have order as chosen", async (done) => {
      const statement1 = new Statement({ data: { territory: { id: "any" } } });
      await statement1.save(db.connection);

      const statement2 = new Statement({ data: { territory: { id: "any" } } });
      await statement2.save(db.connection);

      const wantedNewOrder = 999;
      await statement2.update(db.connection, {
        data: { territory: { order: wantedNewOrder } },
      });

      const createdData = await findActantById<IStatement>(db, statement2.id);
      expect(createdData.data.territory.order).toEqual(wantedNewOrder);

      done();
    });
  });

  describe("update the second's order value (conflict)", () => {
    it("should have order as before", async (done) => {
      const statement1 = new Statement({ data: { territory: { id: "any" } } });
      await statement1.save(db.connection);

      const statement2 = new Statement({ data: { territory: { id: "any" } } });
      await statement2.save(db.connection);

      await statement2.update(db.connection, {
        data: { territory: { order: statement1.data.territory.order } },
      });

      // second statement's order is still 1... 0 is taken
      const createdData2 = await findActantById<IStatement>(db, statement2.id);
      expect(createdData2.data.territory.order).toEqual(1);

      // first statement's order remains 0
      const createdData1 = await findActantById<IStatement>(db, statement1.id);
      expect(createdData1.data.territory.order).toEqual(0);

      done();
    });
  });

  describe("update the third's order value (conflict)", () => {
    it("should have non conflicting order", async (done) => {
      const statement1 = new Statement({ data: { territory: { id: "any" } } });
      await statement1.save(db.connection);

      const statement2 = new Statement({ data: { territory: { id: "any" } } });
      await statement2.save(db.connection);

      const statement3 = new Statement({ data: { territory: { id: "any" } } });
      await statement3.save(db.connection);

      // third statement wants to have the same order as first statement
      await statement3.update(db.connection, {
        data: { territory: { order: statement1.data.territory.order } },
      });

      // first statement should retain its order
      const createdData1 = await findActantById<IStatement>(db, statement1.id);
      expect(createdData1.data.territory.order).toEqual(
        statement1.data.territory.order
      );

      // second statement should retain its order
      const createdData2 = await findActantById<IStatement>(db, statement2.id);
      expect(createdData2.data.territory.order).toEqual(
        statement2.data.territory.order
      );

      // thirs statement should be before the 1 and 2
      const createdData3 = await findActantById<IStatement>(db, statement3.id);
      expect(createdData3.data.territory.order).toEqual(0.5);

      done();
    });
  });
});
