import { apiPath } from "@common/constants";
import { UserEnums } from "@inkvisitor/shared/enums";
import {
  DocumentDoesNotExist,
  PermissionDeniedError,
} from "@inkvisitor/shared/types/errors";
import { pool } from "@middlewares/db";
import Document from "@models/document/document";
import User from "@models/user/user";
import { Db } from "@service/rethink";
import { clean, testErroneousResponse } from "@modules/common.test";
import {
  createAgentWithUserId,
  getAuthenticatedAgent,
  AuthAgent,
} from "@modules/testAuth";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { v4 as uuidv4 } from "uuid";

describe("modules/documents export-batch", function () {
  const db = new Db();

  const personId = "person-1";
  const conceptId = "concept-1";

  const documentA = new Document({
    title: "Doc A",
    content: `one <${personId}>Peter</${personId}> two <${conceptId}>faith</${conceptId}>`,
    entityIds: {
      [EntityEnums.Class.Person]: [personId],
      [EntityEnums.Class.Concept]: [conceptId],
    },
  } as any);

  const documentB = new Document({
    title: "Doc B",
    content: `other <${personId}>Peter</${personId}>`,
    entityIds: {
      [EntityEnums.Class.Person]: [personId],
    },
  } as any);

  const unknownId = "not-anchored-1";

  const documentC = new Document({
    title: "Doc C",
    content: `kept <${unknownId}>stranger</${unknownId}> and <${conceptId}>faith</${conceptId}>`,
    entityIds: {
      [EntityEnums.Class.Concept]: [conceptId],
    },
  } as any);

  const editorId = uuidv4();

  let adminAgent: AuthAgent;
  let editorAgent: AuthAgent;

  beforeAll(async () => {
    await db.initDb();
    await documentA.save(db.connection);
    await documentB.save(db.connection);
    await documentC.save(db.connection);
    await new User({
      id: editorId,
      role: UserEnums.Role.Editor,
      active: true,
      verified: true,
    } as any).save(db.connection);

    adminAgent = await getAuthenticatedAgent();
    editorAgent = await createAgentWithUserId(editorId);
  });

  afterAll(async () => {
    await clean(db);
    await pool.end();
  });

  it("should return one entry per document, keeping only the exported classes", async () => {
    await adminAgent
      .post(`${apiPath}/documents/export-batch`)
      .send({
        documentIds: [documentA.id, documentB.id],
        exportedEntities: [EntityEnums.Class.Person],
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(2);

        const [exportA, exportB] = res.body;
        expect(exportA.id).toEqual(documentA.id);
        expect(exportA.title).toEqual("Doc A");
        expect(exportA.content).toContain(`<${personId}>`);
        expect(exportA.content).not.toContain(`<${conceptId}>`);
        expect(exportA.content).not.toContain(`</${conceptId}>`);
        // dropping the anchor keeps the annotated text itself
        expect(exportA.content).toContain("faith");

        expect(exportB.id).toEqual(documentB.id);
        expect(exportB.content).toContain(`<${personId}>`);
      });
  });

  it("should keep an unknown entity's tag - it is not anchored under any class", async () => {
    await adminAgent
      .post(`${apiPath}/documents/export-batch`)
      .send({
        documentIds: [documentC.id],
        exportedEntities: [EntityEnums.Class.Person],
      })
      .expect(200)
      .expect((res) => {
        expect(res.body[0].content).toContain(`<${unknownId}>`);
        expect(res.body[0].content).toContain(`</${unknownId}>`);
      });
  });

  it("should return a BadParams error for an empty list", async () => {
    await adminAgent
      .post(`${apiPath}/documents/export-batch`)
      .send({ documentIds: [], exportedEntities: [] })
      .expect(400);
  });

  it("should return a DocumentDoesNotExist error for an unknown id", async () => {
    await adminAgent
      .post(`${apiPath}/documents/export-batch`)
      .send({
        documentIds: [documentA.id, "does-not-exist"],
        exportedEntities: [EntityEnums.Class.Person],
      })
      .expect(
        testErroneousResponse.bind(undefined, new DocumentDoesNotExist("", ""))
      );
  });

  it("should filter a single document the same way through /export", async () => {
    await adminAgent
      .post(`${apiPath}/documents/export`)
      .send({
        documentId: documentA.id,
        exportedEntities: [EntityEnums.Class.Person],
      })
      .expect(200)
      .expect("content-type", /text\/plain/)
      .expect((res) => {
        expect(res.text).toContain(`<${personId}>`);
        expect(res.text).not.toContain(`<${conceptId}>`);
        expect(res.text).toContain("faith");
      });
  });

  it("should deny an editor without the document's resource assigned", async () => {
    await editorAgent
      .post(`${apiPath}/documents/export-batch`)
      .send({
        documentIds: [documentA.id],
        exportedEntities: [EntityEnums.Class.Person],
      })
      .expect(
        testErroneousResponse.bind(undefined, new PermissionDeniedError(""))
      );
  });
});
