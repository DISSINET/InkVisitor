import { clean, testErroneousResponse } from "@modules/common.test";
import { DocumentDoesNotExist } from "@shared/types/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { Db } from "@service/RethinkDB";
import Document from "@models/document/document";
import { IDocument } from "@shared/types";

describe("modules/documents/:documentId GET", function () {
  describe("Wrong param", () => {
    it("should return an DocumentDoesNotExist error wrapped in IResponseGeneric", () => {
      return request(app)
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

describe("modules/documents GET", function () {
  describe("Without params", () => {
    it("should return a 200 code", async () => {
      return request(app)
        .get(`${apiPath}/documents`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200);
    });
  });
  describe("Find by ids param", () => {
    const db = new Db();

    const document1 = new Document({
      id: Math.random().toString(),
      content: "test",
      title: "test",
    });
    const document2 = new Document({
      id: Math.random().toString(),
      content: "test",
      title: "test",
    });

    beforeAll(async () => {
      await db.initDb();
      await document1.save(db.connection);
      await document2.save(db.connection);
    });

    afterAll(async () => {
      await document1.delete(db.connection);
      await document2.delete(db.connection);
      await db.close();
    });

    it("should return a 200 code with both documents", async () => {
      await request(app)
        .get(
          `${apiPath}/documents?ids=${[document1.id, document2.id].join(",")}`
        )
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200)
        .expect((res) => {
          expect(typeof res.body).toEqual("object");
          expect(res.body.length).toEqual(2);
          expect(
            (res.body as IDocument[]).find((d) => d.id === document1.id)
          ).toBeTruthy();
          expect(
            (res.body as IDocument[]).find((d) => d.id === document2.id)
          ).toBeTruthy();
        });
    });
  });
});
