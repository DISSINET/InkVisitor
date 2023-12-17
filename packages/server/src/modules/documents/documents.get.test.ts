import { clean, testErroneousResponse } from "@modules/common.test";
import { DocumentDoesNotExist } from "@shared/types/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../server";
import { Db } from "@service/rethink";
import Document from "@models/document/document";
import { pool } from "@middlewares/db";

describe("modules/documents GET", function () {
  afterAll(async () => {
    await pool.end();
  });

  describe("Wrong param", () => {
    it("should return an DocumentDoesNotExist error wrapped in IResponseGeneric", async () => {
      await request(app)
        .get(`${apiPath}/documents/123`)
        .set("authorization", "Bearer " + supertestConfig.token)
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
      await request(app)
        .get(`${apiPath}/documents/${document.id}`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body).toEqual("object");
          expect(res.body.id).toEqual(document.id);
        });
    });
  });
});
