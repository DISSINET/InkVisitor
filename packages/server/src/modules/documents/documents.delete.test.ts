import { clean, testErroneousResponse } from "@modules/common.test";
import { DocumentDoesNotExist } from "@inkvisitor/shared/types/errors";
import { Db } from "@service/rethink";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { getAuthenticatedAgent } from "@modules/testAuth";
import Document from "@models/document/document";
import { pool } from "@middlewares/db";

describe("modules/documents DELETE", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("faulty data", () => {
    it("should return a DocumentDoesNotExist error wrapped in IResponseGeneric", async () => {
      await authAgent
        .delete(`${apiPath}/documents/randomid12345`)
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
      await authAgent
        .delete(`${apiPath}/documents/${document.id}`)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(async () => {
          const deleted = await Document.getDocumentById(
            db.connection,
            document.id
          );
          expect(deleted).toBeNull();
        });
    });
  });
});
