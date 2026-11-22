import { testErroneousResponse } from "@modules/common.test";
import { BadParams, PermissionDeniedError } from "@inkvisitor/shared/types/errors";
import { getAuthenticatedAgent, createAgentWithUserId, AuthAgent } from "../../test/testAuth";
import { apiPath } from "@common/constants";
import { Db, storage } from "@service/storage";
import { pool } from "@middlewares/db";
import { createEntity } from "@service/shorthands";
import Concept from "@models/concept/concept";
import Resource from "@models/resource/resource";
import User from "@models/user/user";
import { RelationEnums, UserEnums } from "@inkvisitor/shared/enums";
import { AuditScope, IAudit } from "@inkvisitor/shared/types";
import { IResponseQueryExportJson } from "@inkvisitor/shared/types/response-query";
import { EventType } from "@inkvisitor/shared/types/stats";

describe("POST /entities/query-export-json", function () {
  const db = new Db();
  const suffix = Math.random().toString();
  const dogId = `dog-${suffix}`;
  const animalId = `animal-${suffix}`;
  const bookId = `book-${suffix}`;
  const otherId = `other-${suffix}`;
  const documentId = `document-${suffix}`;
  const relationId = `scl-${suffix}`;

  const owner = new User({
    id: `owner-${suffix}`,
    name: `owner-${suffix}`,
    email: `owner-${suffix}@test.com`,
    password: "owner",
    active: true,
    verified: true,
    role: UserEnums.Role.Owner,
  });
  let ownerAgent: AuthAgent;
  let adminAgent: AuthAgent;

  const audit = (id: string, auditScope: AuditScope, modelId: string, changes: object = {}) =>
    ({
      id: `${id}-${suffix}`,
      auditScope,
      modelId,
      user: owner.id,
      date: new Date(),
      changes,
      type: EventType.EDIT,
    }) as IAudit;

  beforeAll(async () => {
    await db.initDb();
    await owner.save(db.connection);
    ownerAgent = await createAgentWithUserId(owner.id);
    adminAgent = await getAuthenticatedAgent();

    await createEntity(db, new Concept({ id: dogId, labels: ["dog"] }));
    await createEntity(db, new Concept({ id: animalId, labels: ["animal"] }));
    await createEntity(db, new Concept({ id: otherId, labels: ["other"] }));
    await createEntity(
      db,
      new Resource({
        id: bookId,
        labels: ["book"],
        data: { documentId, url: "", partValueLabel: "", partValueBaseURL: "" },
      })
    );
    await storage.relations.insert(db.connection, {
      id: relationId,
      type: RelationEnums.Type.Superclass,
      entityIds: [dogId, animalId],
      order: 1,
    });
    await storage.audits.insert(db.connection, [
      audit("dog", AuditScope.Entity, dogId),
      audit("other", AuditScope.Entity, otherId),
      audit("relation", AuditScope.Relation, relationId, { entityIds: [dogId, animalId] }),
      // a deleted relation keeps its audits
      audit("deleted-relation", AuditScope.Relation, `gone-${suffix}`, {
        entityIds: [dogId, otherId],
      }),
      audit("document", AuditScope.Document, documentId),
    ]);
  });

  afterAll(async () => {
    await owner.delete(db.connection);
    await db.close();
    await pool.end();
  });

  it("is refused to an admin", async () => {
    await adminAgent
      .post(`${apiPath}/entities/query-export-json`)
      .send({ entityIds: [dogId] })
      .expect(
        testErroneousResponse.bind(
          undefined,
          new PermissionDeniedError("the JSON export is for the owner only")
        )
      );
  });

  it("needs entity ids", async () => {
    await ownerAgent
      .post(`${apiPath}/entities/query-export-json`)
      .send({ entityIds: [] })
      .expect(
        testErroneousResponse.bind(undefined, new BadParams("entityIds array must be provided"))
      );
  });

  it("returns the entities, their relations and the audits of all three", async () => {
    const response = await ownerAgent
      .post(`${apiPath}/entities/query-export-json`)
      .send({ entityIds: [dogId, bookId] })
      .expect(200);
    const body = response.body as IResponseQueryExportJson;

    expect(body.entities.map((entity) => entity.id).sort()).toEqual([bookId, dogId].sort());
    expect(body.relations.map((relation) => relation.id)).toEqual([relationId]);
    expect(body.audits.map((a) => a.id).sort()).toEqual(
      [
        `dog-${suffix}`,
        `relation-${suffix}`,
        `deleted-relation-${suffix}`,
        `document-${suffix}`,
      ].sort()
    );
  });
});
