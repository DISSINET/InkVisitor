import { apiPath } from "@common/constants";
import Action from "@models/action/action";
import Entity from "@models/entity/entity";
import { getEntityClass } from "@models/factory";
import Statement, {
  StatementActant,
  StatementAction,
} from "@models/statement/statement";
import { testErroneousResponse } from "@modules/common.test";
import { Db } from "@service/RethinkDB";
import { deleteEntities } from "@service/shorthands";
import {
  Certainty,
  Elvl,
  EntityClass,
  Logic,
  Mood,
  MoodVariant,
  Operator,
  Partitivity,
  Position,
  Virtuality,
} from "@shared/enums";
import { IStatementActant, IStatementAction } from "@shared/types";
import { BadParams } from "@shared/types/errors";
import request, { Response } from "supertest";
import "ts-jest";
import { supertestConfig } from "..";
import app from "../../Server";

describe("Entities search", function () {
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
        .send({ class: EntityClass.Concept })
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

  describe("ssearch by params", () => {
    let db: Db;
    const rand = Math.random().toString();

    const entityData = new Entity({
      id: `testentity-${rand}`,
      label: "entity",
      class: EntityClass.Person,
    });

    const linkedEntityData = new Entity({
      id: `linkedaction-${rand}`,
      label: "linked-entity",
      class: EntityClass.Concept,
    });

    const actionData = new Action({
      id: `testaction-${rand}`,
      label: "action",
    });

    const statement = new Statement({
      id: `teststatement-${rand}`,
      label: "statement",
    });

    statement.data.actants = [
      new StatementActant({
        ...({
          id: entityData.id,
          actant: entityData.id,
          bundleEnd: false,
          bundleStart: false,
          elvl: Elvl.Inferential,
          logic: Logic.Positive,
          bundleOperator: Operator.And,
          partitivity: Partitivity.DiscreteParts,
          position: Position.Actant1,
          virtuality: Virtuality.Allegation,
        } as IStatementActant),
      }),
      new StatementActant({
        ...({
          id: linkedEntityData.id,
          actant: linkedEntityData.id,
          bundleEnd: false,
          bundleStart: false,
          elvl: Elvl.Inferential,
          logic: Logic.Positive,
          bundleOperator: Operator.And,
          partitivity: Partitivity.DiscreteParts,
          position: Position.Actant1,
          virtuality: Virtuality.Allegation,
        } as IStatementActant),
      }),
    ];
    statement.data.actions = [
      new StatementAction({
        ...({
          id: actionData.id,
          action: actionData.id,
          certainty: Certainty.Empty,
          elvl: Elvl.Inferential,
          logic: Logic.Negative,
          mood: [Mood.Allegation],
          moodvariant: MoodVariant.Irrealis,
          bundleOperator: Operator.And,
        } as IStatementAction),
      }),
    ];

    beforeAll(async () => {
      db = new Db();
      await db.initDb();

      const entityA = getEntityClass(actionData as any);
      if (entityA) {
        await entityA.save(db.connection);
      }

      const entityP = getEntityClass(entityData as any);
      if (entityP) {
        await entityP.save(db.connection);
      }

      const linkedEntity = getEntityClass(linkedEntityData as any);
      if (linkedEntity) {
        await linkedEntity.save(db.connection);
      }

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
          .send({ class: entityData.class, label: entityData.label })
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body[0].entityId).toEqual(entityData.id);
          });

        done();
      });
    });

    describe("search only by non-existing label", () => {
      it("should return a 400 code with successful response for invalid label", async (done) => {
        await request(app)
          .post(`${apiPath}/entities/search`)
          .send({ label: entityData.label + "xxxx" })
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
            class: linkedEntityData.class,
            entityId: entityData.id,
          })
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(1);
            expect(res.body[0].entityId).toEqual(linkedEntityData.id);
          });

        done();
      });
    });

    describe("search only by non-existing entity in statement", () => {
      it("should return a 200 code with successful response", async (done) => {
        await request(app)
          .post(`${apiPath}/entities/search`)
          .send({
            entityId: entityData.id + "xxx", // does not exist
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
            class: linkedEntityData.class,
            entityId: actionData.id,
          })
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(1);
            expect(res.body[0].entityId).toEqual(linkedEntityData.id);
          });

        done();
      });
    });

    describe("search only by non-existing action in statement", () => {
      it("should return a 200 code with empty response", async (done) => {
        await request(app)
          .post(`${apiPath}/entities/search`)
          .send({
            entityId: actionData.id + "xxx", // does not exist
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
              class: linkedEntityData.class,
              entityId: entityData.id,
              label: linkedEntityData.label,
            })
            .set("authorization", "Bearer " + supertestConfig.token)
            .expect("Content-Type", /json/)
            .expect(200)
            .expect((res: Response) => {
              expect(res.body[0].entityId).toEqual(linkedEntityData.id);
            });

          done();
        });
      });

      describe("using action id", () => {
        it("should return a 200 code with successful response", async (done) => {
          await request(app)
            .post(`${apiPath}/entities/search`)
            .send({
              class: linkedEntityData.class,
              entityId: actionData.id,
              label: linkedEntityData.label,
            })
            .set("authorization", "Bearer " + supertestConfig.token)
            .expect("Content-Type", /json/)
            .expect(200)
            .expect((res: Response) => {
              expect(res.body[0].entityId).toEqual(linkedEntityData.id);
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
              class: linkedEntityData.class,
              entityId: entityData.id,
              label: linkedEntityData.label + "xxxx",
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
              class: linkedEntityData.class,
              entityId: actionData.id,
              label: linkedEntityData.label + "xxxx", // does not exist
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
