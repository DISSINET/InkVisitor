import { clean, testErroneousResponse } from "@modules/common.test";
import { DocumentDoesNotExist } from "@shared/types/errors";
import { Db } from "@service/rethink";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { supertestConfig } from "..";
import Document from "@models/document/document";
import { pool } from "@middlewares/db";

describe("modules/documents DELETE", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("faulty data", () => {
    it("should return a DocumentDoesNotExist error wrapped in IResponseGeneric", async () => {
      await request(app)
        .delete(`${apiPath}/documents/randomid12345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(
            undefined,
            new DocumentDoesNotExist("", "")
          )
        );
    });
  });
  describe("ok data", () => {
    const db = new Db();

    const document = new Document({
      content: "test",
      title: "test",
    });

    beforeAll(async () => {
      await db.initDb();
      await document.save(db.connection);
    });

    afterAll(async () => await clean(db));

    it("should return a 200 code with successful response", async () => {
      await request(app)
        .delete(`${apiPath}/documents/${document.id}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(async () => {
          const deleted = await Document.findDocumentById(
            db.connection,
            document.id
          );
          expect(deleted).toBeNull();
        });
    });
  });
});
