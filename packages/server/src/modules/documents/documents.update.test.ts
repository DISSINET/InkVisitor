import { clean, testErroneousResponse } from "@modules/common.test";
import { BadParams, DocumentDoesNotExist } from "@shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import { Db } from "@service/RethinkDB";
import { successfulGenericResponse } from "@modules/common.test";
import Document from "@models/document/document";

describe("modules/documents UPDATE", function () {
  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .put(`${apiPath}/documents/random1345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")))
        .then(() => done());
    });
  });
  describe("faulty data ", () => {
    it("should return an DocumentDoesNotExist error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .put(`${apiPath}/documents/random13545`)
        .send({ test: "" })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(
            undefined,
            new DocumentDoesNotExist("", "")
          )
        )
        .then(() => done());
    });
  });
  describe("ok data", () => {
    const db = new Db();
    const changeTitleTo = "new title";
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
        .put(`${apiPath}/documents/${document.id}`)
        .send({ title: changeTitleTo })
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(successfulGenericResponse)
        .expect(async () => {
          const changedEntry = await Document.findDocumentById(
            db.connection,
            document.id
          );
          expect(changedEntry?.title).toEqual(changeTitleTo);
        });
    });
  });
});
