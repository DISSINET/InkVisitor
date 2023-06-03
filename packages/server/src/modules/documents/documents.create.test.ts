import {
  clean,
  successfulGenericResponse,
  testErroneousResponse,
} from "@modules/common.test";
import { ModelNotValidError } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import { Db } from "@service/RethinkDB";
import "ts-jest";
import Relation from "@models/relation/relation";
import { RelationEnums } from "@shared/enums";
import Document from "@models/document/document";

describe("modules/documents create", function () {
  describe("empty data", () => {
    it("should return a ModelNotValid", (done) => {
      return request(app)
        .post(`${apiPath}/documents`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        )
        .then(() => done());
    });
  });
  describe("faulty data ", () => {
    it("should return a ModelNotValid", (done) => {
      return request(app)
        .post(`${apiPath}/documents`)
        .send({ test: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        )
        .then(() => done());
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async () => {
      const db = new Db();
      await db.initDb();

      const newDocument = new Document({
        content: "test",
        title: "test"
      });

      await request(app)
        .post(`${apiPath}/documents`)
        .send(newDocument)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      await clean(db);
    });
  });
});
