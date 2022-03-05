import "ts-jest";
import Statement, {
  StatementActant,
  StatementAction,
  StatementReference,
} from "./statement";
import { Db } from "@service/RethinkDB";
import { deleteEntities, findEntityById } from "@service/shorthands";
import Territory from "@models/territory/territory";
import { IStatement } from "@shared/types/statement";
import {
  getIStatementActionMock,
  getIStatementMock,
} from "@modules/common.test";
import Prop, { PropSpec } from "@models/prop/prop";

const fillStatementProps = function (
  container: StatementActant | StatementAction
): void {
  // children lvl 1
  container.props[0].children.push(new Prop({}));
  container.props[0].children[0].type = new PropSpec({});
  container.props[0].children[0].value = new PropSpec({});

  // children lvl 2
  container.props[0].children[0].children.push(new Prop({}));
  container.props[0].children[0].children[0].type = new PropSpec({});
  container.props[0].children[0].children[0].value = new PropSpec({});
  // children lvl 3
  container.props[0].children[0].children[0].children.push(new Prop({}));
  container.props[0].children[0].children[0].children[0].type = new PropSpec(
    {}
  );
  container.props[0].children[0].children[0].children[0].value = new PropSpec(
    {}
  );
};
export const prepareStatement = (): [string, Statement] => {
  const detailId = Math.random().toFixed();

  const st1 = new Statement({});
  st1.data.actants.push(new StatementActant({}));
  st1.data.actants[0].props.push(new Prop({}));
  st1.data.actants[0].props.push(new Prop({}));

  fillStatementProps(st1.data.actants[0]);

  st1.data.actions.push(new StatementAction({}));
  st1.data.actions[0].props.push(new Prop({}));
  st1.data.actions[0].props.push(new Prop({}));

  fillStatementProps(st1.data.actions[0]);

  return [detailId, st1];
};

describe("Statement constructor test", function () {
  describe("empty data", () => {
    const emptyData = {};
    const emptyStatement = new Statement({});

    it("should return empty statement", () => {
      const out = new Statement(emptyData);
      expect(out).toEqual(emptyStatement);
    });
  });

  describe("ok data", () => {
    const fullData = getIStatementMock();
    fullData.data.actions.push(getIStatementActionMock());
    const fullStatement: Statement = new Statement({ ...fullData });

    it("should return full statement", () => {
      expect(fullData).toEqual(fullStatement);
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
          text: "text",
          territory: {
            id: "id",
            order: 1,
          },
          actions: [],
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
  const baseStatementData = new Statement({});

  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  beforeEach(async () => {
    await deleteEntities(db);
  });

  afterAll(async () => {
    await db.close();
  });

  describe("empty db", () => {
    it("should return empty array", async (done) => {
      const statements = await Statement.findUsedInDataEntities(
        db.connection,
        ""
      );
      expect(statements).toHaveLength(0);
      done();
    });
  });

  describe("one territory", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statements = await Statement.findUsedInDataEntities(
        db.connection,
        territory.id
      );
      expect(statements).toHaveLength(0);
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

      const statements = await Statement.findUsedInDataEntities(
        db.connection,
        territory.id
      );
      expect(statements).toHaveLength(0);
    });
  });

  describe("one territory, one linked statement via actants field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statement = new Statement(
        JSON.parse(JSON.stringify(baseStatementData))
      );
      statement.data.actants = [
        new StatementActant({
          actant: territory.id,
        }),
      ];
      await statement.save(db.connection);

      const statements = await Statement.findUsedInDataEntities(
        db.connection,
        territory.id
      );
      expect(statements).toHaveLength(1);
    });
  });

  describe("one territory, one linked statement via tags field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statement = new Statement(
        JSON.parse(JSON.stringify(baseStatementData))
      );
      statement.data.tags = [territory.id];
      await statement.save(db.connection);

      const statements = await Statement.findUsedInDataEntities(
        db.connection,
        territory.id
      );
      expect(statements).toHaveLength(1);
    });
  });

  describe("one territory, one linked statement via props.origin field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statement = new Statement(
        JSON.parse(JSON.stringify(baseStatementData))
      );
      statement.props = [new Prop({ origin: territory.id })];
      await statement.save(db.connection);

      const statements = await Statement.findUsedInDataEntities(
        db.connection,
        territory.id
      );
      expect(statements).toHaveLength(1);
    });
  });

  describe("one territory, one linked statement via props.type.id field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statement = new Statement(
        JSON.parse(JSON.stringify(baseStatementData))
      );
      statement.props = [new Prop({ type: { id: territory.id } })];
      await statement.save(db.connection);

      const statements = await Statement.findUsedInDataEntities(
        db.connection,
        territory.id
      );
      expect(statements).toHaveLength(1);
    });
  });

  describe("one territory, one linked statement via props.value.id field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statement = new Statement(
        JSON.parse(JSON.stringify(baseStatementData))
      );
      statement.props = [new Prop({ value: { id: territory.id } })];
      await statement.save(db.connection);

      const statements = await Statement.findUsedInDataEntities(
        db.connection,
        territory.id
      );
      expect(statements).toHaveLength(1);
    });
  });

  describe("one territory, one linked statement via references.resource field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statement = new Statement(
        JSON.parse(JSON.stringify(baseStatementData))
      );
      statement.data.references = [
        new StatementReference({ resource: territory.id }),
      ];
      await statement.save(db.connection);

      const statements = await Statement.findUsedInDataEntities(
        db.connection,
        territory.id
      );
      expect(statements).toHaveLength(1);
    });
  });

  describe("one territory, one linked statement via territory.id field", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      const statement = new Statement(
        JSON.parse(JSON.stringify(baseStatementData))
      );
      statement.data.territory.id = territory.id;
      await statement.save(db.connection);

      const statements = await Statement.findUsedInDataEntities(
        db.connection,
        territory.id
      );
      expect(statements).toHaveLength(1);
    });
  });

  describe("one territory, two linked statement via references.resource and tags respectively", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      // first statement linked via references array
      const statement1 = new Statement(
        JSON.parse(JSON.stringify(baseStatementData))
      );
      statement1.data.references = [
        new StatementReference({ resource: territory.id }),
      ];
      await statement1.save(db.connection);

      // second statement linked via tags array
      const statement2 = new Statement(
        JSON.parse(JSON.stringify(baseStatementData))
      );
      statement2.data.tags = [territory.id];
      await statement2.save(db.connection);

      const statements = await Statement.findUsedInDataEntities(
        db.connection,
        territory.id
      );
      expect(statements).toHaveLength(2);
    });
  });

  describe("one territory, two linked statement via references.resource and tags at once", () => {
    it("should return empty array", async () => {
      const territory = new Territory(undefined);
      await territory.save(db.connection);

      // first statement linked via references array and tags
      const statement1 = new Statement(
        JSON.parse(JSON.stringify(baseStatementData))
      );
      statement1.data.tags = [territory.id];
      statement1.data.references = [
        new StatementReference({ resource: territory.id }),
      ];

      // second statement is the same
      const statement2 = new Statement(JSON.parse(JSON.stringify(statement1)));

      await statement1.save(db.connection);
      await statement2.save(db.connection);

      const statements = await Statement.findUsedInDataEntities(
        db.connection,
        territory.id
      );
      expect(statements).toHaveLength(2);
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
    await deleteEntities(db);
  });

  afterAll(async () => {
    await db.close();
  });

  describe("insert one child without explicit order", () => {
    it("should have order = 0", async (done) => {
      const statement = new Statement({ data: { territory: { id: "any" } } });
      await statement.save(db.connection);

      const createdData = await findEntityById<IStatement>(db, statement.id);
      expect(createdData.data.territory?.id).toEqual(
        statement.data.territory.id
      );
      expect(createdData.data.territory?.order).toEqual(0);

      done();
    });
  });

  describe("insert one child with explicit order", () => {
    it("should have order = 999 as wanted", async (done) => {
      const statement = new Statement({
        data: { territory: { id: "any", order: 999 } },
      });
      await statement.save(db.connection);

      const createdData = await findEntityById<IStatement>(db, statement.id);
      expect(createdData.data.territory?.id).toEqual(
        statement.data.territory.id
      );
      expect(createdData.data.territory?.order).toEqual(
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

      // first statement provides order = -1, which should result in save '0'
      // value
      const createdData1 = await findEntityById<IStatement>(db, statement1.id);
      expect(createdData1.data.territory?.id).toEqual(
        createdData1.data.territory?.id
      );
      expect(createdData1.data.territory?.order).toEqual(0);

      // second statement provides order = -1, which should result in save '1'
      // value
      const createdData2 = await findEntityById<IStatement>(db, statement2.id);
      expect(createdData2.data.territory?.id).toEqual(
        createdData2.data.territory?.id
      );
      expect(createdData2.data.territory?.order).toEqual(1);
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
    await deleteEntities(db);
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
      const createdData = await findEntityById<IStatement>(db, statement.id);
      expect(createdData.data.territory?.order).toEqual(wantedNewOrder);

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

      const createdData = await findEntityById<IStatement>(db, statement2.id);
      expect(createdData.data.territory?.order).toEqual(wantedNewOrder);

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
      const createdData2 = await findEntityById<IStatement>(db, statement2.id);
      expect(createdData2.data.territory?.order).toEqual(1);

      // first statement's order remains 0
      const createdData1 = await findEntityById<IStatement>(db, statement1.id);
      expect(createdData1.data.territory?.order).toEqual(0);

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
      const createdData1 = await findEntityById<IStatement>(db, statement1.id);
      expect(createdData1.data.territory?.order).toEqual(
        statement1.data.territory.order
      );

      // second statement should retain its order
      const createdData2 = await findEntityById<IStatement>(db, statement2.id);
      expect(createdData2.data.territory?.order).toEqual(
        statement2.data.territory.order
      );

      // thirs statement should be before the 1 and 2
      const createdData3 = await findEntityById<IStatement>(db, statement3.id);
      expect(createdData3.data.territory?.order).toEqual(0.5);

      done();
    });
  });
});

describe("Statement - findMetaStatements", function () {
  let db: Db;
  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  beforeEach(async () => {
    await deleteEntities(db);
  });

  afterAll(async () => {
    await db.close();
  });

  describe("bad territory or entity", () => {
    it("should return empty list", async (done) => {
      const wantedActantId = "A0";
      const statement1 = new Statement({
        data: {
          territory: { id: "something" },
          actants: [{ actant: "something" }],
        },
      });
      await statement1.save(db.connection);
      const statement2 = new Statement({
        data: {
          territory: { id: "T0" },
          actants: [{ actant: "something" }],
        },
      });
      await statement2.save(db.connection);
      const statement3 = new Statement({
        data: {
          territory: { id: "something" },
          actants: [{ actant: "A0" }],
        },
      });
      await statement3.save(db.connection);

      const statements = await Statement.findMetaStatements(
        db.connection,
        wantedActantId
      );

      expect(statements.length).toEqual(0);

      done();
    });
  });

  describe("basic search by T0 and A1", () => {
    it("should return list of 1 item", async (done) => {
      const actantId = "A1";
      const statement = new Statement({
        data: { territory: { id: "T0" }, actants: [{ actant: actantId }] },
      });
      await statement.save(db.connection);

      const statements = await Statement.findMetaStatements(
        db.connection,
        actantId
      );

      expect(statements.length).toEqual(1);

      done();
    });
  });
});

describe("test Statement.toJSON", function () {
  const instance = new Statement({});
  for (const fieldName of Statement.publicFields) {
    (instance as any)[fieldName] = `value for ${fieldName}`;
  }
  const jsoned = JSON.parse(JSON.stringify(instance));
  const newKeys = Object.keys(jsoned);
  const newValues = Object.values(jsoned);

  it("should correctly map to public fields", () => {
    expect(newKeys).toEqual(Statement.publicFields);
  });

  it("should correctly assign values", () => {
    expect(newValues).toEqual(
      Statement.publicFields.map((fieldName) => (instance as any)[fieldName])
    );
  });
});

describe("test Statement.findUsedInDataProps", function () {
  let db: Db;

  beforeAll(async () => {
    db = new Db();
    await db.initDb();
  });

  beforeEach(async () => {
    await deleteEntities(db);
  });

  afterAll(async () => {
    await db.close();
  });

  describe("detail id in actants[0].props[0].type.id", () => {
    const [detailId, st] = prepareStatement();
    st.data.actants[0].props[0].type.id = detailId;

    it("should find the statement successfully", async () => {
      await st.save(db.connection);

      const foundStatements = await Statement.findUsedInDataProps(
        db.connection,
        detailId
      );
      expect(foundStatements).toHaveLength(1);
      expect(foundStatements[0].id).toEqual(st.id);
    });
  });

  describe("detail id in actants[0].props[0].value.id", () => {
    const [detailId, st] = prepareStatement();
    st.data.actants[0].props[0].value.id = detailId;

    it("should find the statement successfully", async () => {
      await st.save(db.connection);

      const foundStatements = await Statement.findUsedInDataProps(
        db.connection,
        detailId
      );
      expect(foundStatements).toHaveLength(1);
      expect(foundStatements[0].id).toEqual(st.id);
    });
  });

  describe("detail id in actants[0].props[0].children[0].type.id", () => {
    const [detailId, st] = prepareStatement();
    st.data.actants[0].props[0].children[0].value.id = detailId;

    it("should find the statement successfully", async () => {
      await st.save(db.connection);

      const foundStatements = await Statement.findUsedInDataProps(
        db.connection,
        detailId
      );
      expect(foundStatements).toHaveLength(1);
      expect(foundStatements[0].id).toEqual(st.id);
    });
  });

  describe("detail id in actants[0].props[0].children[0].type.id", () => {
    const [detailId, st] = prepareStatement();
    st.data.actants[0].props[0].children[0].children[0].value.id = detailId;

    it("should find the statement successfully", async () => {
      await st.save(db.connection);

      const foundStatements = await Statement.findUsedInDataProps(
        db.connection,
        detailId
      );
      expect(foundStatements).toHaveLength(1);
      expect(foundStatements[0].id).toEqual(st.id);
    });
  });

  describe("detail id in actants[0].props[0].children[0].children[0].type.id", () => {
    const [detailId, st] = prepareStatement();
    st.data.actants[0].props[0].children[0].children[0].children[0].value.id =
      detailId;

    it("should find the statement successfully", async () => {
      await st.save(db.connection);

      const foundStatements = await Statement.findUsedInDataProps(
        db.connection,
        detailId
      );
      expect(foundStatements).toHaveLength(1);
      expect(foundStatements[0].id).toEqual(st.id);
    });
  });

  describe("multiple same-id occurences in one statement", () => {
    const [detailId, st] = prepareStatement();
    st.data.actants[0].props[0].type.id = detailId;
    st.data.actants[0].props[1].type.id = detailId;

    it("should find one statement", async () => {
      await st.save(db.connection);

      const foundStatements = await Statement.findUsedInDataProps(
        db.connection,
        detailId
      );
      expect(foundStatements).toHaveLength(1);
      expect(foundStatements[0].id).toEqual(st.id);
    });
  });

  describe("two statements linked to the same detail", () => {
    const [detailId, st1] = prepareStatement();
    const [, st2] = prepareStatement();

    st1.data.actants[0].props[0].type.id = detailId;
    st2.data.actants[0].props[0].type.id = detailId;

    it("should find both statements", async () => {
      await st1.save(db.connection);
      await st2.save(db.connection);

      const foundStatements = await Statement.findUsedInDataProps(
        db.connection,
        detailId
      );
      expect(foundStatements).toHaveLength(2);
      expect(foundStatements.find((st) => st.id === st1.id)).not.toBeNull();
      expect(foundStatements.find((st) => st.id === st2.id)).not.toBeNull();
    });
  });
});
