import { clean } from "@modules/common.test";
import request from "supertest";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { apiPath } from "@common/constants";
import app from "../../server";
import { Db } from "@service/rethink";
import Document from "@models/document/document";
import { deleteDocuments } from "@service/shorthands";
import { pool } from "@middlewares/db";

describe("modules/documents INDEX", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  const db = new Db();

  const document1 = new Document({
    content: "test",
    title: "test",
  });
  const document2 = new Document({
    content: "test2",
    title: "test2",
  });

  beforeAll(async () => {
    await db.initDb();
    await deleteDocuments(db);
    await document1.save(db.connection);
    await document2.save(db.connection);
  });

  afterAll(async () => {
    await clean(db);
    await pool.end();
  });

  it("should return a 200 code", async () => {
    await authAgent
      .get(`${apiPath}/documents`)
      .expect(200)
      .expect((res) => {
        expect(res.body.length).toBeTruthy();
        expect(res.body.length).toEqual(2);
        expect(
          (res.body as Document[]).find((d) => d.id === document1.id)
        ).toBeTruthy();
        expect(
          (res.body as Document[]).find((d) => d.id === document2.id)
        ).toBeTruthy();
      });
  });
});
