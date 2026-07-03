import { apiPath } from "@common/constants";
import { StatementActant, StatementAction } from "@models/statement/statement";
import { testErroneousResponse } from "@modules/common.test";
import { Db } from "@service/rethink";
import { deleteEntities } from "@service/shorthands";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { BadParams } from "@inkvisitor/shared/types/errors";
import { prepareEntity } from "@models/entity/entity.test";
import { Response } from "supertest";
import "ts-jest";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { prepareStatement } from "@models/statement/statement.test";
import { pool } from "@middlewares/db";

// The search endpoint was redesigned: it is now `GET /entities/` taking the
// search params as query string (was `POST /entities/search` with a JSON body).
// Co-occurrence search (find entities appearing together in a statement) moved
// from the single `entityId` param to `cooccurrenceId`. The response is now a
// list of full IResponseEntity objects, so result items expose `id` (not the
// former `entityId`).

describe("Entities search (requests)", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  // NOTE: the shared db pool is ended once in the final top-level describe's
  // afterAll ("Entities search (params)"). Ending it here would drain the pool
  // before that describe runs, causing database-timeout 500s.

  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .get(`${apiPath}/entities`)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("valid request data (only class)", () => {
    // Previously class without a label was rejected with BadParams. Class alone
    // is now a valid search, so this should succeed with a 200 list response.
    it("should return a 200 code with successful response", async () => {
      await authAgent
        .get(`${apiPath}/entities`)
        .query({ class: EntityEnums.Class.Concept })
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });
  describe("invalid class data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .get(`${apiPath}/entities`)
        .query({ class: "something", label: "mnop" })
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
});

describe("Entities search (params)", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("search by params", () => {
    let db: Db;

    const [, entity] = prepareEntity();
    entity.labels = ["entity"];
    entity.id = `${entity.labels[0]}-${entity.id}`;
    entity.class = EntityEnums.Class.Person;

    const [, linkedEntity] = prepareEntity();
    linkedEntity.labels = ["linked-entity"];
    linkedEntity.id = `${linkedEntity.labels[0]}-${linkedEntity.id}`;
    linkedEntity.class = EntityEnums.Class.Concept;

    const [, action] = prepareEntity();
    action.labels = ["action"];
    action.id = `${action.labels[0]}-${action.id}`;
    action.class = EntityEnums.Class.Action;

    const [statementId, statement] = prepareStatement();
    statement.labels = ["statement"];
    statement.id = `${statement.labels[0]}-${statement.id}`;

    statement.data.actants = [
      new StatementActant({ id: entity.id, entityId: entity.id }),
      new StatementActant({ id: linkedEntity.id, entityId: linkedEntity.id }),
    ];
    statement.data.actions = [
      new StatementAction({ id: action.id, actionId: action.id }),
    ];

    beforeAll(async () => {
      db = new Db();
      await db.initDb();

      await action.save(db.connection);

      await entity.save(db.connection);
      await linkedEntity.save(db.connection);
      await statement.save(db.connection);
    });

    afterAll(async () => {
      await deleteEntities(db);
      await db.close();
    });

    describe("search only class + by existing label", () => {
      it("should return a 200 code with successful response", async () => {
        await authAgent
          .get(`${apiPath}/entities`)
          .query({ class: entity.class, label: entity.labels[0] })
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body[0].id).toEqual(entity.id);
          });
      });
    });

    describe("search only by non-existing label", () => {
      it("should return a 200 code with empty response for invalid label", async () => {
        await authAgent
          .get(`${apiPath}/entities`)
          .query({ label: entity.labels[0] + "xxxx" })
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(0);
          });
      });
    });

    describe("search only by class + existing entity in statement", () => {
      it("should return a 200 code with successful response", async () => {
        await authAgent
          .get(`${apiPath}/entities`)
          .query({
            class: linkedEntity.class,
            cooccurrenceId: entity.id,
          })
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(1);
            expect(res.body[0].id).toEqual(linkedEntity.id);
          });
      });
    });

    describe("search only by non-existing entity in statement", () => {
      it("should return a 200 code with successful response", async () => {
        await authAgent
          .get(`${apiPath}/entities`)
          .query({
            cooccurrenceId: entity.id + "xxx", // does not exist
          })
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(0);
          });
      });
    });

    describe("search only by class + existing action in statement", () => {
      it("should return a 200 code with successful response", async () => {
        await authAgent
          .get(`${apiPath}/entities`)
          .query({
            class: linkedEntity.class,
            cooccurrenceId: action.id,
          })
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(1);
            expect(res.body[0].id).toEqual(linkedEntity.id);
          });
      });
    });

    describe("search only by non-existing action in statement", () => {
      it("should return a 200 code with empty response", async () => {
        await authAgent
          .get(`${apiPath}/entities`)
          .query({
            cooccurrenceId: action.id + "xxx", // does not exist
          })
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(0);
          });
      });
    });

    describe("search by all params", () => {
      describe("using entity id", () => {
        it("should return a 200 code with successful response", async () => {
          await authAgent
            .get(`${apiPath}/entities`)
            .query({
              class: linkedEntity.class,
              cooccurrenceId: entity.id,
              label: linkedEntity.labels[0],
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .expect((res: Response) => {
              expect(res.body[0].id).toEqual(linkedEntity.id);
            });
        });
      });

      describe("using action id", () => {
        it("should return a 200 code with successful response", async () => {
          await authAgent
            .get(`${apiPath}/entities`)
            .query({
              class: linkedEntity.class,
              cooccurrenceId: action.id,
              label: linkedEntity.labels[0],
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .expect((res: Response) => {
              expect(res.body[0].id).toEqual(linkedEntity.id);
            });
        });
      });
    });

    describe("search by all params + misused label", () => {
      describe("using entity id", () => {
        it("should return a 200 code with empty response", async () => {
          await authAgent
            .get(`${apiPath}/entities`)
            .query({
              class: linkedEntity.class,
              cooccurrenceId: action.id,
              label: linkedEntity.labels[0] + "xxxx",
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .expect((res: Response) => {
              expect(res.body).toHaveLength(0);
            });
        });
      });

      describe("using action id", () => {
        it("should return a 200 code with empty response", async () => {
          await authAgent
            .get(`${apiPath}/entities`)
            .query({
              class: linkedEntity.class,
              cooccurrenceId: action.id,
              label: linkedEntity.labels[0] + "xxxx", // does not exist
            })
            .expect("Content-Type", /json/)
            .expect(200)
            .expect((res: Response) => {
              expect(res.body).toHaveLength(0);
            });
        });
      });
    });
  });
});
