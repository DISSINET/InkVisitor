import { clean, testErroneousResponse } from "@modules/common.test";
import { ActionDoesNotExits, BadParams } from "@shared/types/errors";
import request, { Response } from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "../../common/constants";
import app from "../../Server";
import { IAction } from "@shared/types";
import { Db } from "@service/RethinkDB";
import { deleteActions, createAction } from "@service/shorthands";

const testValidAction = (res: Response) => {
  expect(res.body).toBeTruthy();
  expect(typeof res.body).toEqual("object");
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
  expect(Object.keys(res.body)).toEqual(Object.keys(actionExample));
  expect(res.body.id).toBeTruthy();
};

describe("Actions get", function () {
  describe("Empty param", () => {
    it("should return a 400 code with BadParams error", (done) => {
      return request(app)
        .get(`${apiPath}/actions/get`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("Wrong param", () => {
    it("should return a 400 code with ActantDoesNotExits error", (done) => {
      return request(app)
        .get(`${apiPath}/actions/get/invalidId12345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(
          testErroneousResponse.bind(undefined, new ActionDoesNotExits(""))
        )
        .then(() => done());
    });
  });
  describe("Correct param", () => {
    it("should return a 200 code with user response", async (done) => {
      const db = new Db();
      await db.initDb();
      const result = await createAction(
        db,
        {
          id: "",
          labels: [
            {
              id: "randomLabel",
              lang: "en",
              value: "randomLabel",
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

      let id = "";
      if (!result.generated_keys) {
        expect(result.generated_keys).not.toBeNull();
      } else {
        id = result.generated_keys[0];
      }

      await request(app)
        .get(`${apiPath}/actions/get/${id}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect(testValidAction);

      await clean(db);
      done();
    });
  });
});
