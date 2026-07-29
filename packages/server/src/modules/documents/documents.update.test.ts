import { clean, testErroneousResponse } from "@modules/common.test";
import {
  BadParams,
  DocumentDoesNotExist,
  DocumentChangedConcurrently,
} from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { apiPath } from "@common/constants";
import app from "../../server";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { Db } from "@service/rethink";
import { successfulGenericResponse } from "@modules/common.test";
import Document from "@models/document/document";
import { pool } from "@middlewares/db";
import { contentFingerprint } from "@inkvisitor/shared/utils/content-fingerprint";

describe("modules/documents UPDATE", function () {
  let authAgent: Awaited<ReturnType<typeof getAuthenticatedAgent>>;

  beforeAll(async () => {
    authAgent = await getAuthenticatedAgent();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe("empty data", () => {
    it("should return a BadParams error wrapped in IResponseGeneric", async () => {
      await authAgent
        .put(`${apiPath}/documents/random1345`)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });
  describe("faulty data ", () => {
    it("should return an DocumentDoesNotExist error wrapped in IResponseGeneric", async () => {
      await authAgent
        .put(`${apiPath}/documents/random13545`)
        .send({ test: "" })
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
      await authAgent
        .put(`${apiPath}/documents/${document.id}`)
        .send({ title: changeTitleTo })
        .expect("Content-Type", /json/)
        .expect(200)
        .expect(successfulGenericResponse)
        .expect(async () => {
          const changedEntry = await Document.getDocumentById(
            db.connection,
            document.id
          );
          expect(changedEntry?.title).toEqual(changeTitleTo);
        });
    });
  });

  describe("content fingerprint", () => {
    const db = new Db();

    beforeAll(async () => {
      await db.initDb();
    });

    afterAll(async () => await clean(db));

    it("should accept a write whose fingerprint matches the stored content", async () => {
      const document = new Document({ content: "base content", title: "fp-match" });
      await document.save(db.connection);

      await authAgent
        .put(`${apiPath}/documents/${document.id}`)
        .set("x-inkvisitor-document-base", contentFingerprint("base content"))
        .send({ content: "base content edited" })
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      const stored = await Document.getDocumentById(db.connection, document.id);
      expect(stored?.content).toEqual("base content edited");
    });

    it("should reject a write whose fingerprint is stale and leave the content untouched", async () => {
      const document = new Document({ content: "base content", title: "fp-stale" });
      await document.save(db.connection);

      await authAgent
        .put(`${apiPath}/documents/${document.id}`)
        .set("x-inkvisitor-document-base", contentFingerprint("what the client last saw"))
        .send({ content: "clobbering content" })
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(undefined, new DocumentChangedConcurrently())
        );

      const stored = await Document.getDocumentById(db.connection, document.id);
      expect(stored?.content).toEqual("base content");
    });

    it("should accept a write that carries no fingerprint at all", async () => {
      const document = new Document({ content: "base content", title: "fp-absent" });
      await document.save(db.connection);

      await authAgent
        .put(`${apiPath}/documents/${document.id}`)
        .send({ content: "unchecked content" })
        .expect("Content-Type", /json/)
        .expect(successfulGenericResponse);

      const stored = await Document.getDocumentById(db.connection, document.id);
      expect(stored?.content).toEqual("unchecked content");
    });
  });
});
