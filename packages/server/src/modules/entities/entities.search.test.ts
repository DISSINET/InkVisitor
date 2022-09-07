import { apiPath } from "@common/constants";
import { StatementActant, StatementAction } from "@models/statement/statement";
import { testErroneousResponse } from "@modules/common.test";
import { Db } from "@service/RethinkDB";
import { deleteEntities } from "@service/shorthands";
import { EntityEnums } from "@shared/enums";
import { BadParams } from "@shared/types/errors";
import { prepareEntity } from "@models/entity/entity.test";
import request, { Response } from "supertest";
import "ts-jest";
import { supertestConfig } from "..";
import app from "../../Server";
import { prepareStatement } from "@models/statement/statement.test";

describe("Entities search (requests)", function () {
  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/entities/search`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("invalid request data(only class)", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/entities/search`)
        .send({ class: EntityEnums.Class.Concept })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("invalid class data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/entities/search`)
        .send({ class: "something", label: "mnop" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
});

describe("Entities search (params)", function () {
  describe("search by params", () => {
    let db: Db;
    const rand = Math.random().toString();

    const [, entity] = prepareEntity();
    entity.label = "entity";
    entity.id = `${entity.label}-${entity.id}`;
    entity.class = EntityEnums.Class.Person;

    const [, linkedEntity] = prepareEntity();
    linkedEntity.label = "linked-entity";
    linkedEntity.id = `${linkedEntity.label}-${linkedEntity.id}`;
    linkedEntity.class = EntityEnums.Class.Concept;

    const [, action] = prepareEntity();
    action.label = "action";
    action.id = `${action.label}-${action.id}`;

    const [statementId, statement] = prepareStatement();
    statement.label = "statement";
    statement.id = `${statement.label}-${statement.id}`;

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
      it("should return a 200 code with successful response", async (done) => {
        await request(app)
          .post(`${apiPath}/entities/search`)
          .send({ class: entity.class, label: entity.label })
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body[0].entityId).toEqual(entity.id);
          });

        done();
      });
    });

    describe("search only by non-existing label", () => {
      it("should return a 400 code with successful response for invalid label", async (done) => {
        await request(app)
          .post(`${apiPath}/entities/search`)
          .send({ label: entity.label + "xxxx" })
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(0);
          });

        done();
      });
    });

    describe("search only by class + existing entity in statement", () => {
      it("should return a 200 code with successful response", async (done) => {
        await request(app)
          .post(`${apiPath}/entities/search`)
          .send({
            class: linkedEntity.class,
            entityId: entity.id,
          })
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(1);
            expect(res.body[0].entityId).toEqual(linkedEntity.id);
          });

        done();
      });
    });

    describe("search only by non-existing entity in statement", () => {
      it("should return a 200 code with successful response", async (done) => {
        await request(app)
          .post(`${apiPath}/entities/search`)
          .send({
            entityId: entity.id + "xxx", // does not exist
          })
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(0);
          });

        done();
      });
    });

    describe("search only by class + existing action in statement", () => {
      it("should return a 200 code with successful response", async (done) => {
        await request(app)
          .post(`${apiPath}/entities/search`)
          .send({
            class: linkedEntity.class,
            entityId: action.id,
          })
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(1);
            expect(res.body[0].entityId).toEqual(linkedEntity.id);
          });

        done();
      });
    });

    describe("search only by non-existing action in statement", () => {
      it("should return a 200 code with empty response", async (done) => {
        await request(app)
          .post(`${apiPath}/entities/search`)
          .send({
            entityId: action.id + "xxx", // does not exist
          })
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(0);
          });

        done();
      });
    });

    describe("search by all params", () => {
      describe("using entity id", () => {
        it("should return a 200 code with successful response", async (done) => {
          await request(app)
            .post(`${apiPath}/entities/search`)
            .send({
              class: linkedEntity.class,
              entityId: entity.id,
              label: linkedEntity.label,
            })
            .set("authorization", "Bearer " + supertestConfig.token)
            .expect("Content-Type", /json/)
            .expect(200)
            .expect((res: Response) => {
              expect(res.body[0].entityId).toEqual(linkedEntity.id);
            });

          done();
        });
      });

      describe("using action id", () => {
        it("should return a 200 code with successful response", async (done) => {
          await request(app)
            .post(`${apiPath}/entities/search`)
            .send({
              class: linkedEntity.class,
              entityId: action.id,
              label: linkedEntity.label,
            })
            .set("authorization", "Bearer " + supertestConfig.token)
            .expect("Content-Type", /json/)
            .expect(200)
            .expect((res: Response) => {
              expect(res.body[0].entityId).toEqual(linkedEntity.id);
            });

          done();
        });
      });
    });

    describe("search by all params + misused label", () => {
      describe("using entity id", () => {
        it("should return a 200 code with empty response", async (done) => {
          await request(app)
            .post(`${apiPath}/entities/search`)
            .send({
              class: linkedEntity.class,
              entityId: action.id,
              label: linkedEntity.label + "xxxx",
            })
            .set("authorization", "Bearer " + supertestConfig.token)
            .expect("Content-Type", /json/)
            .expect(200)
            .expect((res: Response) => {
              expect(res.body).toHaveLength(0);
            });

          done();
        });
      });

      describe("using action id", () => {
        it("should return a 200 code with empty response", async (done) => {
          await request(app)
            .post(`${apiPath}/entities/search`)
            .send({
              class: linkedEntity.class,
              entityId: action.id,
              label: linkedEntity.label + "xxxx", // does not exist
            })
            .set("authorization", "Bearer " + supertestConfig.token)
            .expect("Content-Type", /json/)
            .expect(200)
            .expect((res: Response) => {
              expect(res.body).toHaveLength(0);
            });

          done();
        });
      });
    });
  });
});
