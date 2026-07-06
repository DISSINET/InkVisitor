import { clean, testErroneousResponse } from "@modules/common.test";
import { DocumentDoesNotExist } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { apiPath } from "@common/constants";
import app from "../../server";
import { Db } from "@service/rethink";
import Document from "@models/document/document";
import { pool } from "@middlewares/db";

describe("modules/documents GET", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("Wrong param", () => {
    it("should return an DocumentDoesNotExist error wrapped in IResponseGeneric", async () => {
      await authAgent
        .get(`${apiPath}/documents/123`)
        .expect(
          testErroneousResponse.bind(
            undefined,
            new DocumentDoesNotExist("", "")
          )
        );
    });
  });
  describe("Correct param", () => {
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

    it("should return a 200 code", async () => {
      await authAgent
        .get(`${apiPath}/documents/${document.id}`)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body).toEqual("object");
          expect(res.body.id).toEqual(document.id);
        });
    });
  });
});
