import "@modules/common.test";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { IAction } from "@shared/types";
import { Db } from "@service/RethinkDB";
import { createAction, deleteAction } from "@service/shorthands";
import "ts-jest";

const checkArrayOfActions = (res: any) => {
  const actionExample: IAction = {
    id: "",
    labels: [],
    note: "",
    parent: "",
    rulesActants: [],
    rulesProperties: [],
    types: [],
    valencies: [],
  };
  res.body.should.not.empty;
  res.body.should.be.a("array");
  res.body.should.have.lengthOf.above(0);
  res.body[0].should.have.keys(Object.keys(actionExample));
  res.body[0].id.should.not.empty;
};

describe("Actions getMore", function () {
  describe("Empty param", () => {
    it("should return a 200 code with array of all actions", async (done) => {
      const db = new Db();
      await db.initDb();
      const randomLabel = "actions-getMore-" + Math.random().toString();
      const insertResult = await createAction(
        db,
        {
          id: "",
          labels: [
            {
              id: randomLabel,
              lang: "en",
              value: randomLabel,
            },
          ],
          note: "",
          parent: false,
          rulesActants: [],
          rulesProperties: [],
          types: [],
          valencies: [],
        },
        false
      );
      request(app)
        .post(`${apiPath}/actions/getMore`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect((res) => {
          checkArrayOfActions(res);
          const foundLabel = (res.body as IAction[]).find(
            (action) =>
              !!action.labels.find((label) => label.value === randomLabel)
          );
          expect(foundLabel).not.toBeNull();
        })
        .then(() =>
          deleteAction(
            db,
            insertResult.generated_keys ? insertResult.generated_keys[0] : ""
          )
        )
        .then(() => db.close())
        .then(() => done());
    });
  });
  describe("Correct label param", () => {
    it("should return a 200 code with array of 1 element", async (done) => {
      const db = new Db();
      await db.initDb();
      const randomLabel = "actions-getMore-" + Math.random().toString();
      const insertResult = await createAction(
        db,
        {
          id: "",
          labels: [
            {
              id: randomLabel,
              lang: "en",
              value: randomLabel,
            },
          ],
          note: "",
          parent: false,
          rulesActants: [],
          rulesProperties: [],
          types: [],
          valencies: [],
        },
        false
      );
      request(app)
        .post(`${apiPath}/actions/getMore`)
        .send({ label: randomLabel })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect((res) => {
          checkArrayOfActions(res);
          expect((res.body as []).length).toEqual(1);
          const foundLabel = (res.body as IAction[]).find(
            (action) =>
              !!action.labels.find((label) => label.value === randomLabel)
          );
          expect(foundLabel).not.toBeNull();
        })
        .then(() =>
          deleteAction(
            db,
            insertResult.generated_keys ? insertResult.generated_keys[0] : ""
          )
        )
        .then(() => db.close())
        .then(() => done());
    });
  });
});
