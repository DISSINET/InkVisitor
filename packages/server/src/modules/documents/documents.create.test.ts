import {
  clean,
  successfulGenericResponse,
  testErroneousResponse,
} from "@modules/common.test";
import { ModelNotValidError } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { Db } from "@service/rethink";
import "ts-jest";
import Document from "@models/document/document";
import { pool } from "@middlewares/db";

describe("modules/documents create", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("empty data", () => {
    it("should return a ModelNotValid", async () => {
      await authAgent
        .post(`${apiPath}/documents`)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        );
    });
  });
  describe("faulty data ", () => {
    it("should return a ModelNotValid", async () => {
      await authAgent
        .post(`${apiPath}/documents`)
        .send({ test: "" })
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new ModelNotValidError(""))
        );
    });
  });
  describe("ok data", () => {
    it("should return a 200 code with successful response", async () => {
      const db = new Db();
      await db.initDb();

      const newDocument = new Document({
        content: "test",
        title: "test",
      });

      await authAgent
        .post(`${apiPath}/documents`)
        .send(newDocument)
        .expect(200)
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      await clean(db);
    });
  });
});
