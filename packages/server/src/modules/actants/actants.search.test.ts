import { testErroneousResponse } from "@modules/common.test";
import { BadParams } from "@shared/types/errors";
import request, { Response } from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import { Db } from "@service/RethinkDB";
import "ts-jest";
import { deleteActants } from "@service/shorthands";
import {
  ActantType,
  Certainty,
  Elvl,
  Logic,
  Mood,
  MoodVariant,
  Operator,
  Partitivity,
  Position,
  Virtuality,
} from "@shared/enums";
import { getActantType } from "@models/factory";
import Statement, { StatementActant, StatementAction } from "@models/statement/statement";
import { IStatementActant, IStatementAction } from "@shared/types";
import Action from "@models/action/action";
import Entity from "@models/entity/entity";

describe("Actants search", function () {
  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/actants/search`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("invalid request data(only class)", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/actants/search`)
        .send({ class: ActantType.Concept })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("invalid class data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .post(`${apiPath}/actants/search`)
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

    const actantData = new Entity({
      id: `testactant-${rand}`,
      label: "actant",
      class: ActantType.Person,
    });

    const linkedActantData = new Entity({
      id: `linkedaction-${rand}`,
      label: "linked-actant",
      class: ActantType.Concept,
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
          id: actantData.id,
          actant: actantData.id,
          bundleEnd: false,
          bundleStart: false,
          elvl: Elvl.Inferential,
          logic: Logic.Positive,
          operator: Operator.And,
          partitivity: Partitivity.DiscreteParts,
          position: Position.Actant1,
          virtuality: Virtuality.Allegation,
        } as IStatementActant),
      }),
      new StatementActant({
        ...({
          id: linkedActantData.id,
          actant: linkedActantData.id,
          bundleEnd: false,
          bundleStart: false,
          elvl: Elvl.Inferential,
          logic: Logic.Positive,
          operator: Operator.And,
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
          operator: Operator.And,
        } as IStatementAction),
      }),
    ];

    beforeAll(async () => {
      db = new Db();
      await db.initDb();

      const actantA = getActantType(actionData as any);
      if (actantA) {
        await actantA.save(db.connection);
      }

      const actantP = getActantType(actantData as any);
      if (actantP) {
        await actantP.save(db.connection);
      }

      const linkedActant = getActantType(linkedActantData as any);
      if (linkedActant) {
        await linkedActant.save(db.connection);
      }

      await statement.save(db.connection);
    });

    afterAll(async () => {
      await deleteActants(db);
      await db.close();
    });

    describe("search only class + by existing label", () => {
      it("should return a 200 code with successful response", async (done) => {
        await request(app)
          .post(`${apiPath}/actants/search`)
          .send({ class: actantData.class, label: actantData.label })
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body[0].actantId).toEqual(actantData.id);
          });

        done();
      });
    });

    describe("search only by non-existing label", () => {
      it("should return a 400 code with successful response for invalid label", async (done) => {
        await request(app)
          .post(`${apiPath}/actants/search`)
          .send({ label: actantData.label + "xxxx" })
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(0);
          });

        done();
      });
    });

    describe("search only by class + existing actant in statement", () => {
      it("should return a 200 code with successful response", async (done) => {
        await request(app)
          .post(`${apiPath}/actants/search`)
          .send({
            class: linkedActantData.class,
            actantId: actantData.id,
          })
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(1);
            expect(res.body[0].actantId).toEqual(linkedActantData.id);
          });

        done();
      });
    });

    describe("search only by non-existing actant in statement", () => {
      it("should return a 200 code with successful response", async (done) => {
        await request(app)
          .post(`${apiPath}/actants/search`)
          .send({
            actantId: actantData.id + "xxx", // does not exist
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
          .post(`${apiPath}/actants/search`)
          .send({
            class: linkedActantData.class,
            actantId: actionData.id,
          })
          .set("authorization", "Bearer " + supertestConfig.token)
          .expect("Content-Type", /json/)
          .expect(200)
          .expect((res: Response) => {
            expect(res.body).toHaveLength(1);
            expect(res.body[0].actantId).toEqual(linkedActantData.id);
          });

        done();
      });
    });

    describe("search only by non-existing action in statement", () => {
      it("should return a 200 code with empty response", async (done) => {
        await request(app)
          .post(`${apiPath}/actants/search`)
          .send({
            actantId: actionData.id + "xxx", // does not exist
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
      describe("using actant id", () => {
        it("should return a 200 code with successful response", async (done) => {
          await request(app)
            .post(`${apiPath}/actants/search`)
            .send({
              class: linkedActantData.class,
              actantId: actantData.id,
              label: linkedActantData.label,
            })
            .set("authorization", "Bearer " + supertestConfig.token)
            .expect("Content-Type", /json/)
            .expect(200)
            .expect((res: Response) => {
              expect(res.body[0].actantId).toEqual(linkedActantData.id);
            });

          done();
        });
      });

      describe("using action id", () => {
        it("should return a 200 code with successful response", async (done) => {
          await request(app)
            .post(`${apiPath}/actants/search`)
            .send({
              class: linkedActantData.class,
              actantId: actionData.id,
              label: linkedActantData.label,
            })
            .set("authorization", "Bearer " + supertestConfig.token)
            .expect("Content-Type", /json/)
            .expect(200)
            .expect((res: Response) => {
              expect(res.body[0].actantId).toEqual(linkedActantData.id);
            });

          done();
        });
      });
    });

    describe("search by all params + misused label", () => {
      describe("using actant id", () => {
        it("should return a 200 code with empty response", async (done) => {
          await request(app)
            .post(`${apiPath}/actants/search`)
            .send({
              class: linkedActantData.class,
              actantId: actantData.id,
              label: linkedActantData.label + "xxxx", // does not exist
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
            .post(`${apiPath}/actants/search`)
            .send({
              class: linkedActantData.class,
              actantId: actionData.id,
              label: linkedActantData.label + "xxxx", // does not exist
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
