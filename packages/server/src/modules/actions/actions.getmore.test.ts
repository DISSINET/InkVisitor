import "@modules/common.test";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { IAction } from "@shared/types";
import { Db } from "@service/RethinkDB";
import { createAction, deleteActions } from "@service/shorthands";

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
  expect(res.body).toBeTruthy();
  expect(res.body.constructor.name).toEqual("Array");
  expect(res.body.length).toBeGreaterThan(0);
  expect(Object.keys(res.body[0])).toEqual(Object.keys(actionExample));
  expect(res.body[0].id).toBeTruthy();
};

describe("Actions getMore", function () {
  describe("Empty param", () => {
    it("should return a 200 code with array of all actions", async (done) => {
      const db = new Db();
      await db.initDb();

      const randomLabel = "actions-getMore-" + Math.random().toString();
      await createAction(
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
      await request(app)
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
        });

      await deleteActions(db);
      await db.close();
      done();
    });
  });
  describe("Correct label param", () => {
    it("should return a 200 code with array of 1 element", async (done) => {
      const db = new Db();
      await db.initDb();
      const randomLabel = "actions-getMore-" + Math.random().toString();
      await createAction(
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
      await request(app)
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
        });

      await deleteActions(db);
      await db.close();
      done();
    });
  });
});
