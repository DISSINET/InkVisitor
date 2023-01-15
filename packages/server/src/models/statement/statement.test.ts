import "ts-jest";
import Statement, {
  StatementActant,
  StatementAction,
  StatementData,
  StatementTerritory,
} from "./statement";
import { Db } from "@service/RethinkDB";
import { deleteEntities, findEntityById } from "@service/shorthands";
import Territory from "@models/territory/territory";
import { IStatement, IStatementData } from "@shared/types/statement";
import {
  getIStatementActionMock,
  getIStatementMock,
} from "@modules/common.test";
import Prop, { PropSpec } from "@models/prop/prop";

const fillStatementProps = function (
  container: StatementActant | StatementAction,
  id: string,
): void {
  // children lvl 1
  container.props[0].children.push(new Prop({ id: `${id}.props[0].children[0].id` }));
  container.props[0].children[0].type = new PropSpec({ entityId: `${id}.props[0].children[0].type.entityId` });
  container.props[0].children[0].value = new PropSpec({ entityId: `${id}.props[0].children[0].value.entityId` });

  // children lvl 2
  container.props[0].children[0].children.push(new Prop({ id: `${id}.props[0].children[0].children[0].id` }));
  container.props[0].children[0].children[0].type = new PropSpec({ entityId: `${id}.props[0].children[0].children[0].type.entityId` });
  container.props[0].children[0].children[0].value = new PropSpec({ entityId: `${id}.props[0].children[0].children[0].value.entityId` });

  // children lvl 3
  container.props[0].children[0].children[0].children.push(new Prop({ id: `${id}.props[0].children[0].children[0].children[0].id` }));
  container.props[0].children[0].children[0].children[0].type = new PropSpec({ entityId: `${id}.props[0].children[0].children[0].children[0].type.entityId` });
  container.props[0].children[0].children[0].children[0].value = new PropSpec({ entityId: `${id}.props[0].children[0].children[0].children[0].value.entityId` });
};

export const prepareStatement = (): [string, Statement] => {
  const id = Math.random().toString();

  const st1 = new Statement({ id });
  st1.data.actants.push(new StatementActant({ id: `${id}-data-actants[0].id`, entityId: `${id}-data-actants[0].entityId` }));
  st1.data.actants[0].props.push(new Prop({ id: `${id}-data-actants[0].props[0].id` }));
  st1.data.actants[0].props.push(new Prop({ id: `${id}-data-actants[0].props[1].id` }));

  fillStatementProps(st1.data.actants[0], `${id}-data-actants[0]`);

  st1.data.actions.push(new StatementAction({ id: `${id}-data-actions[0].id`, actionId: `${id}-data-actions[0].actionId` }));
  st1.data.actions[0].props.push(new Prop({ id: `${id}-data-actions[0].props[0].id` }));
  st1.data.actions[0].props.push(new Prop({ id: `${id}-data-actions[0].props[1].id` }));

  fillStatementProps(st1.data.actions[0], `${id}-data-actions[0]`);

  return [id, st1];
};

describe("models/statement", function () {
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
        expect(JSON.parse(JSON.stringify(fullStatement))).toEqual(fullData);
      });
    });
  });

  describe("Statement validate test", function () {
    describe("empty data", () => {
      it("should be true", () => {
        const emptyStatement = new Statement({});
        expect(emptyStatement.isValid()).toEqual(true);
      });
    });
    describe("invalid territory data", () => {
      it("should be true", () => {
        const emptyStatement = new Statement({});
        emptyStatement.data.territory = new StatementTerritory({}); // invalid - empty id
        expect(emptyStatement.isValid()).toEqual(false);
      });
    });
    describe("not empty data", () => {
      it("should return true", () => {
        const notEmpty = new Statement({
          id: "id",
          label: "label",
          data: {
            text: "text",
            territory: {
              territoryId: "id",
              order: 1,
            },
          } as IStatementData,
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
        const statements = await Statement.getLinkedEntities(db.connection, "");
        expect(statements).toHaveLength(0);
        done();
      });
    });

    describe("one territory", () => {
      it("should return empty array", async () => {
        const territory = new Territory({});
        await territory.save(db.connection);

        const statements = await Statement.getLinkedEntities(
          db.connection,
          territory.id
        );
        expect(statements).toHaveLength(0);
      });
    });

    describe("one territory, one unlinked statement", () => {
      it("should return empty array", async () => {
        const territory = new Territory({});
        await territory.save(db.connection);

        const statement = new Statement({
          data: new StatementData({ territory: { territoryId: "non existent", order: 1 } }),
        });
        await statement.save(db.connection);

        const statements = await Statement.getLinkedEntities(
          db.connection,
          territory.id
        );
        expect(statements).toHaveLength(0);
      });
    });

    describe("one territory, one linked statement via actants field", () => {
      it("should return empty array", async () => {
        const territory = new Territory({});
        await territory.save(db.connection);

        const statement = new Statement(
          JSON.parse(JSON.stringify(baseStatementData))
        );
        statement.data.actants = [
          new StatementActant({
            entityId: territory.id,
          }),
        ];
        await statement.save(db.connection);

        const statements = await Statement.getLinkedEntities(
          db.connection,
          territory.id
        );
        expect(statements).toHaveLength(1);
      });
    });

    describe("one territory, one linked statement via tags field", () => {
      it("should return empty array", async () => {
        const territory = new Territory({});
        await territory.save(db.connection);

        const statement = new Statement(
          JSON.parse(JSON.stringify(baseStatementData))
        );
        statement.data.tags = [territory.id];
        await statement.save(db.connection);

        const statements = await Statement.getLinkedEntities(
          db.connection,
          territory.id
        );
        expect(statements).toHaveLength(1);
      });
    });

    describe("one territory, one linked statement via territory.id field", () => {
      it("should return empty array", async () => {
        const territory = new Territory({});
        await territory.save(db.connection);

        const statement = new Statement(
          JSON.parse(JSON.stringify(baseStatementData))
        );
        statement.data.territory = new StatementTerritory({ territoryId: territory.id });

        await statement.save(db.connection);

        const statements = await Statement.getLinkedEntities(
          db.connection,
          territory.id
        );
        expect(statements).toHaveLength(1);
      });
    });

    describe("one territory, two linked statement via territory.id and tags respectively", () => {
      it("should return empty array", async () => {
        const territory = new Territory({ id: "T0" });
        await territory.save(db.connection);

        // first statement linked via references array
        const statement1 = new Statement(
          JSON.parse(JSON.stringify(baseStatementData))
        );
        statement1.data.territory = new StatementTerritory({ territoryId: territory.id });
        await statement1.save(db.connection);

        // second statement linked via tags array
        const statement2 = new Statement(JSON.parse(JSON.stringify(baseStatementData)));
        statement2.data.tags = [territory.id];
        await statement2.save(db.connection);

        const statements = await Statement.getLinkedEntities(
          db.connection,
          territory.id
        );
        expect(statements).toHaveLength(2);
      });
    });

    describe("one territory, two linked statement via references.resource and tags at once", () => {
      it("should return empty array", async () => {
        const territory = new Territory({ id: "T0" });
        await territory.save(db.connection);

        // first statement linked via references array and tags
        const statement1 = new Statement(
          JSON.parse(JSON.stringify(baseStatementData))
        );
        statement1.data.tags = [territory.id];
        statement1.data.territory = new StatementTerritory({ territoryId: territory.id });

        // second statement is the same
        const statement2 = new Statement(JSON.parse(JSON.stringify(statement1)));

        await statement1.save(db.connection);
        await statement2.save(db.connection);

        const statements = await Statement.getLinkedEntities(
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
        const statement = new Statement({});
        statement.data = new StatementData({ territory: { territoryId: "any", order: 0 } });
        await statement.save(db.connection);

        const createdData = await findEntityById<IStatement>(db, statement.id);
        expect(createdData.data.territory?.territoryId).toEqual(
          statement.data.territory?.territoryId
        );
        expect(createdData.data.territory?.order).toEqual(0);

        done();
      });
    });

    describe("insert one child with explicit order", () => {
      it("should have order = 999 as wanted", async (done) => {
        const statement = new Statement({});
        statement.data = new StatementData({ territory: { territoryId: "any", order: 999 } });
        await statement.save(db.connection);

        const createdData = await findEntityById<IStatement>(db, statement.id);
        expect(createdData.data.territory?.territoryId).toEqual(
          statement.data.territory?.territoryId
        );
        expect(createdData.data.territory?.order).toEqual(
          statement.data.territory?.order
        );

        done();
      });
    });

    describe("insert two child without explicit order", () => {
      it("should have order = 0 and 1 respectively", async (done) => {
        const statement1 = new Statement({});
        statement1.data = new StatementData({ territory: { territoryId: "any", order: 0 } });
        await statement1.save(db.connection);

        const statement2 = new Statement({});
        statement2.data = new StatementData({ territory: { territoryId: "any", order: 0 } });
        await statement2.save(db.connection);

        // first statement provides order = -1, which should result in save '0'
        // value
        const createdData1 = await findEntityById<IStatement>(db, statement1.id);
        expect(createdData1.data.territory?.territoryId).toEqual(
          createdData1.data.territory?.territoryId
        );
        expect(createdData1.data.territory?.order).toEqual(0);

        // second statement provides order = -1, which should result in save '1'
        // value
        const createdData2 = await findEntityById<IStatement>(db, statement2.id);
        expect(createdData2.data.territory?.territoryId).toEqual(
          createdData2.data.territory?.territoryId
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
      it("should have order = 0", async (done) => {
        const statement = new Statement({});
        statement.data = new StatementData({ territory: { territoryId: "any", order: 0 } });
        await statement.save(db.connection);

        const wantedNewOrder = 999;
        await statement.update(db.connection, {
          data: { territory: { order: wantedNewOrder } },
        });
        const createdData = await findEntityById<IStatement>(db, statement.id);
        expect(createdData.data.territory?.order).toEqual(0);

        done();
      });
    });

    describe("update the second's order value without conflict ", () => {
      it("should have order as chosen", async (done) => {
        const statement1 = new Statement({});
        statement1.data = new StatementData({ territory: { territoryId: "any", order: 0 } });
        await statement1.save(db.connection);

        const statement2 = new Statement({});
        statement2.data = new StatementData({ territory: { territoryId: "any", order: 0 } });
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
        const statement1 = new Statement({});
        statement1.data = new StatementData({ territory: { territoryId: "any", order: 0 } });
        await statement1.save(db.connection);

        const statement2 = new Statement({});
        statement2.data = new StatementData({ territory: { territoryId: "any", order: 0 } });
        await statement2.save(db.connection);

        await statement2.update(db.connection, {
          data: { territory: { order: statement1.data.territory?.order } },
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
        const statement1 = new Statement({});
        statement1.data = new StatementData({ territory: { territoryId: "any", order: 0 } });
        await statement1.save(db.connection);

        const statement2 = new Statement({});
        statement2.data = new StatementData({ territory: { territoryId: "any", order: 0 } });
        await statement2.save(db.connection);

        const statement3 = new Statement({});
        statement3.data = new StatementData({ territory: { territoryId: "any", order: 0 } });
        await statement3.save(db.connection);

        // third statement wants to have the same order as first statement
        await statement3.update(db.connection, {
          data: { territory: { order: statement1.data.territory?.order } },
        });

        // first statement should retain its order
        const createdData1 = await findEntityById<IStatement>(db, statement1.id);
        expect(createdData1.data.territory?.order).toEqual(
          statement1.data.territory?.order
        );

        // second statement should retain its order
        const createdData2 = await findEntityById<IStatement>(db, statement2.id);
        expect(createdData2.data.territory?.order).toEqual(
          statement2.data.territory?.order
        );

        // thirs statement should be before the 1 and 2
        const createdData3 = await findEntityById<IStatement>(db, statement3.id);
        expect(createdData3.data.territory?.order).toEqual(0.5);

        done();
      });
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
      st.data.actants[0].props[0].type.entityId = detailId;

      it("should find the statement successfully", async () => {
        await st.save(db.connection);

        const foundStatements = await Statement.findByDataPropsId(
          db.connection,
          detailId
        );
        expect(foundStatements).toHaveLength(1);
        expect(foundStatements[0].id).toEqual(st.id);
      });
    });

    describe("detail id in actants[0].props[0].value.id", () => {
      const [detailId, st] = prepareStatement();
      st.data.actants[0].props[0].value.entityId = detailId;

      it("should find the statement successfully", async () => {
        await st.save(db.connection);

        const foundStatements = await Statement.findByDataPropsId(
          db.connection,
          detailId
        );
        expect(foundStatements).toHaveLength(1);
        expect(foundStatements[0].id).toEqual(st.id);
      });
    });

    describe("detail id in actants[0].props[0].children[0].type.id", () => {
      const [detailId, st] = prepareStatement();
      st.data.actants[0].props[0].children[0].value.entityId = detailId;

      it("should find the statement successfully", async () => {
        await st.save(db.connection);

        const foundStatements = await Statement.findByDataPropsId(
          db.connection,
          detailId
        );
        expect(foundStatements).toHaveLength(1);
        expect(foundStatements[0].id).toEqual(st.id);
      });
    });

    describe("detail id in actants[0].props[0].children[0].children[0].type.id", () => {
      const [detailId, st] = prepareStatement();
      st.data.actants[0].props[0].children[0].children[0].value.entityId =
        detailId;

      it("should find the statement successfully", async () => {
        await st.save(db.connection);

        const foundStatements = await Statement.findByDataPropsId(
          db.connection,
          detailId
        );
        expect(foundStatements).toHaveLength(1);
        expect(foundStatements[0].id).toEqual(st.id);
      });
    });

    describe("multiple same-id occurrences in one statement", () => {
      const [detailId, st] = prepareStatement();
      st.data.actants[0].props[0].type.entityId = detailId;
      st.data.actants[0].props[1].type.entityId = detailId;

      it("should find one statement", async () => {
        await st.save(db.connection);

        const foundStatements = await Statement.findByDataPropsId(
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

      st1.data.actants[0].props[0].type.entityId = detailId;
      st2.data.actants[0].props[0].type.entityId = detailId;

      it("should find both statements", async () => {
        await st1.save(db.connection);
        await st2.save(db.connection);

        const foundStatements = await Statement.findByDataPropsId(
          db.connection,
          detailId
        );
        expect(foundStatements).toHaveLength(2);
        expect(foundStatements.find((st) => st.id === st1.id)).not.toBeNull();
        expect(foundStatements.find((st) => st.id === st2.id)).not.toBeNull();
      });
    });
  });

  describe("test Statement.findByTerritoryId", function () {
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

    describe("found by multiple territories", () => {
      const [id1a, st1a] = prepareStatement();
      const [id1b, st1b] = prepareStatement();
      const [id2a, st2a] = prepareStatement();
      const [id2b, st2b] = prepareStatement();

      const tId1 = `t-${id1a}`;
      const tId2 = `t-${id2a}`;

      st1a.data.territory = new StatementTerritory({ territoryId: tId1 });
      st1b.data.territory = new StatementTerritory({ territoryId: tId1 });
      st2a.data.territory = new StatementTerritory({ territoryId: tId2 });
      st2b.data.territory = new StatementTerritory({ territoryId: tId2 });

      it("should find the statements successfully", async () => {
        await st1a.save(db.connection);
        await st1b.save(db.connection);
        await st2a.save(db.connection);
        await st2b.save(db.connection);

        const foundStatements = await Statement.findByTerritoryIds(db.connection, [tId1, tId2]);
        expect(foundStatements).toHaveLength(4);
        expect(foundStatements.find(s => s.id === id1a)).toBeTruthy();
        expect(foundStatements.find(s => s.id === id1b)).toBeTruthy();
        expect(foundStatements.find(s => s.id === id2a)).toBeTruthy();
        expect(foundStatements.find(s => s.id === id2b)).toBeTruthy();
      });
    });
  });
});
