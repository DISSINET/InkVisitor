import { clean, testErroneousResponse } from "@modules/common.test";
import { DocumentDoesNotExist, EntityDoesNotExist, InvalidDeleteError } from "@shared/types/errors";
import { Db } from "@service/RethinkDB";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { findEntityById } from "@service/shorthands";
import { supertestConfig } from "..";
import { IEntity } from "@shared/types";
import Territory from "@models/territory/territory";
import Classification from "@models/relation/classification";
import Person from "@models/person/person";
import Concept from "@models/concept/concept";
import Document from "@models/document/document";

describe("modules/documents DELETE", function () {
  describe("faulty data", () => {
    it("should return a DocumentDoesNotExist error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .delete(`${apiPath}/documents/randomid12345`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new DocumentDoesNotExist("", ""))
        )
        .then(() => done());
    });
  });
  describe("ok data", () => {
    const db = new Db();

    const document = new Document({
      content: "test",
      title: "test"
    })

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
