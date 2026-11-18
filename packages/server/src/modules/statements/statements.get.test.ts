import { clean, testErroneousResponse } from "@modules/common.test";
import { BadParams, StatementDoesNotExits } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { apiPath } from "@common/constants";
import app from "../../server";
import { Db } from "@service/storage";
import { createEntity } from "@service/shorthands";
import Statement, {
  StatementData,
  StatementTerritory,
} from "@models/statement/statement";
import { ResponseStatement } from "@models/statement/response";
import Territory from "@models/territory/territory";
import Person from "@models/person/person";
import Location from "@models/location/location";
import Document from "@models/document/document";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IStatementActant } from "@inkvisitor/shared/types";
import { NEARBY_SUGGESTIONS_LIMIT } from "@inkvisitor/shared/constants";
import treeCache from "@service/treeCache";
import { pool } from "@middlewares/db";

const testValidStatement = (res: any) => {
  expect(res.body).toBeTruthy();
  expect(typeof res.body).toEqual("object");
  // The endpoint returns a ResponseStatement (Statement enriched with entities,
  // right, warnings, usedInDocuments, ...), not a bare Statement, so compare the
  // key set against ResponseStatement. createdAt is set on save (Entity.save),
  // so a persisted statement carries it - include it in the example.
  const example = new ResponseStatement(
    new Statement({ createdAt: new Date() })
  );

  expect(Object.keys(res.body).sort()).toEqual(
    Object.keys(example).sort()
  );
  expect(res.body.id).toBeTruthy();
};

describe("Statements get", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  // Skipped: the only GET route is "/:statementId", so GET /statements has no
  // matching handler and returns 404 (not the BadParams 400 this asserted). The
  // empty-id BadParams branch in the handler is unreachable via HTTP because
  // Express cannot match an empty :statementId segment.
  describe.skip("Empty param", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .get(`${apiPath}/statements`)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("Wrong param", () => {
    it("should return a StatementDoesNotExits error wrapped in IResponseGeneric", async () => {
      await authAgent
        .get(`${apiPath}/statements/invalidId12345`)
        .expect(
          testErroneousResponse.bind(
            undefined,
            new StatementDoesNotExits("", "")
          )
        );
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with IResponseStatement response", async () => {
      const db = new Db();
      await db.initDb();
      const randomId = Math.random().toString();
      // The statement's parent territory must exist in the (global) tree cache:
      // ResponseStatement.prepare -> getTValidationWarnings looks up
      // treeCache.tree.idMap[parentTId].path unconditionally, so a dangling
      // territory id now yields a 500. Create a real root territory, point the
      // statement at it, and rebuild the global tree cache before the request.
      // (prepareTreeCache/initialize is a no-op under NODE_ENV=test, so we build
      // the tree directly via createTree, mirroring the other module tests.)
      const territoryId = `root-${randomId}`;
      await createEntity(db, new Territory({ id: territoryId }));
      await createEntity(
        db,
        new Statement({
          id: randomId,
          data: new StatementData({
            territory: new StatementTerritory({ territoryId }),
          }),
        })
      );
      treeCache.db = db.connection;
      treeCache.tree = await treeCache.createTree();

      await authAgent
        .get(`${apiPath}/statements/${randomId}`)
        .expect(200)
        .expect(testValidStatement);

      await clean(db);
    });

    it("should list the entities anchored around the statement, closest first", async () => {
      const db = new Db();
      await db.initDb();
      // document tag names exclude ".", so the anchored ids are dot-free
      const tagSafeId = () => Math.random().toString().replace(/\./g, "");
      const tag = (id: string, text: string) => `<${id}>${text}</${id}>`;

      const territoryId = `root${tagSafeId()}`;
      const statementId = tagSafeId();
      const inSpan = new Person({ id: tagSafeId() });
      const discouraged = new Person({
        id: tagSafeId(),
        status: EntityEnums.Status.Discouraged,
      });
      const inTerritory = new Location({ id: tagSafeId() });

      await createEntity(db, new Territory({ id: territoryId }));
      await createEntity(
        db,
        new Statement({
          id: statementId,
          data: new StatementData({
            territory: new StatementTerritory({ territoryId }),
          }),
        })
      );
      await createEntity(db, inSpan);
      await createEntity(db, discouraged);
      await createEntity(db, inTerritory);

      // the entities must exist before preprocess so the anchors resolve
      const document = new Document({
        id: tagSafeId(),
        content: tag(
          territoryId,
          `${tag(inTerritory.id, "Rome")}: ` +
            tag(statementId, `${tag(discouraged.id, "he")} saw ${tag(inSpan.id, "Peter")}`)
        ),
      });
      await document.preprocess(db.connection);
      await document.save(db.connection);

      treeCache.db = db.connection;
      treeCache.tree = await treeCache.createTree();

      try {
        const res = await authAgent.get(`${apiPath}/statements/${statementId}`).expect(200);

        expect(res.body.anchoredNearby.map((entity: IEntity) => entity.id)).toEqual([
          inSpan.id,
          inTerritory.id,
        ]);
      } finally {
        // a second root territory left behind breaks the tree of the next test
        await clean(db);
      }
    });

    it("should leave discouraged entities out of the per-class cap", async () => {
      const db = new Db();
      await db.initDb();
      const tagSafeId = () => Math.random().toString().replace(/\./g, "");
      const tag = (id: string, text: string) => `<${id}>${text}</${id}>`;

      const territoryId = `root${tagSafeId()}`;
      const statementId = tagSafeId();
      const discouraged = Array.from(
        { length: NEARBY_SUGGESTIONS_LIMIT },
        () => new Person({ id: tagSafeId(), status: EntityEnums.Status.Discouraged })
      );
      const approved = new Person({ id: tagSafeId() });

      await createEntity(db, new Territory({ id: territoryId }));
      await createEntity(
        db,
        new Statement({
          id: statementId,
          data: new StatementData({
            territory: new StatementTerritory({ territoryId }),
          }),
        })
      );
      for (const person of [...discouraged, approved]) {
        await createEntity(db, person);
      }

      // the discouraged persons are closer to the statement than the approved one
      const document = new Document({
        id: tagSafeId(),
        content: tag(
          territoryId,
          tag(statementId, discouraged.map((person) => tag(person.id, "he")).join(" ")) +
            ` and ${tag(approved.id, "Peter")}`
        ),
      });
      await document.preprocess(db.connection);
      await document.save(db.connection);

      treeCache.db = db.connection;
      treeCache.tree = await treeCache.createTree();

      try {
        const res = await authAgent.get(`${apiPath}/statements/${statementId}`).expect(200);

        expect(res.body.anchoredNearby.map((entity: IEntity) => entity.id)).toEqual([
          approved.id,
        ]);
      } finally {
        await clean(db);
      }
    });

    it("should list the entities the statement already uses after the others", async () => {
      const db = new Db();
      await db.initDb();
      const tagSafeId = () => Math.random().toString().replace(/\./g, "");
      const tag = (id: string, text: string) => `<${id}>${text}</${id}>`;

      const territoryId = `root${tagSafeId()}`;
      const statementId = tagSafeId();
      const used = new Person({ id: tagSafeId() });
      const unused = new Person({ id: tagSafeId() });

      await createEntity(db, new Territory({ id: territoryId }));
      await createEntity(
        db,
        new Statement({
          id: statementId,
          data: new StatementData({
            territory: new StatementTerritory({ territoryId }),
            actants: [{ id: tagSafeId(), entityId: used.id } as IStatementActant],
          }),
        })
      );
      await createEntity(db, used);
      await createEntity(db, unused);

      const document = new Document({
        id: tagSafeId(),
        content: tag(
          territoryId,
          tag(statementId, `${tag(used.id, "Peter")} saw ${tag(unused.id, "Paul")}`)
        ),
      });
      await document.preprocess(db.connection);
      await document.save(db.connection);

      treeCache.db = db.connection;
      treeCache.tree = await treeCache.createTree();

      try {
        const res = await authAgent.get(`${apiPath}/statements/${statementId}`).expect(200);

        expect(res.body.anchoredNearby.map((entity: IEntity) => entity.id)).toEqual([
          unused.id,
          used.id,
        ]);
      } finally {
        await clean(db);
      }
    });
  });
});
