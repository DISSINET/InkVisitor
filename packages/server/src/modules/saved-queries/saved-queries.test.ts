import "@modules/common.test";
import { apiPath } from "@common/constants";
import { UserEnums } from "@inkvisitor/shared/enums";
import { ISavedQuery } from "@inkvisitor/shared/types";
import {
  BadParams,
  NotFound,
  PermissionDeniedError,
} from "@inkvisitor/shared/types/errors";
import { pool } from "@middlewares/db";
import SavedQuery from "@models/saved-query/saved-query";
import User from "@models/user/user";
import { Db } from "@service/rethink";
import { r as rethink } from "rethinkdb-ts";
import {
  successfulGenericResponse,
  testErroneousResponse,
} from "../common.test";
import {
  createAgentWithUserId,
  getAuthenticatedAgent,
  AuthAgent,
} from "@modules/testAuth";

describe("Saved queries", function () {
  const db = new Db();

  const userAId = `test-user-a-${Math.random().toString(36).slice(2)}`;
  const userBId = `test-user-b-${Math.random().toString(36).slice(2)}`;
  const userCId = `test-user-c-${Math.random().toString(36).slice(2)}`;

  let adminAgent: AuthAgent;
  let agentA: AuthAgent; // viewer
  let agentB: AuthAgent; // viewer
  let agentC: AuthAgent; // editor

  const queryData: ISavedQuery["data"] = {
    query: {
      id: "root",
      type: "E" as any,
      params: {},
      operator: "and" as any,
      edges: [],
    },
    includeEquivalents: false,
    includeSubordinates: true,
  };

  beforeAll(async () => {
    await db.initDb();

    // the table may not exist in an older test db
    const tables = await rethink.tableList().run(db.connection);
    if (!tables.includes(SavedQuery.table)) {
      await rethink.tableCreate(SavedQuery.table).run(db.connection);
    }

    await new User({
      id: userAId,
      role: UserEnums.Role.Viewer,
      active: true,
      verified: true,
    } as any).save(db.connection);
    await new User({
      id: userBId,
      role: UserEnums.Role.Viewer,
      active: true,
      verified: true,
    } as any).save(db.connection);
    await new User({
      id: userCId,
      role: UserEnums.Role.Editor,
      active: true,
      verified: true,
    } as any).save(db.connection);

    adminAgent = await getAuthenticatedAgent();
    agentA = await createAgentWithUserId(userAId);
    agentB = await createAgentWithUserId(userBId);
    agentC = await createAgentWithUserId(userCId);
  });

  afterAll(async () => {
    await rethink
      .table(SavedQuery.table)
      .filter((row: any) =>
        rethink.expr([userAId, userBId, userCId]).contains(row("ownerId"))
      )
      .delete()
      .run(db.connection);
    await rethink
      .table("users")
      .getAll(userAId, userBId, userCId)
      .delete()
      .run(db.connection);
    await db.close();
    await pool.end();
  });

  describe("create", () => {
    it("rejects a payload without a name", async () => {
      await agentA
        .post(`${apiPath}/saved-queries`)
        .send({ name: "", shared: false, data: queryData })
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });

    it("creates a private query owned by the caller", async () => {
      const res = await agentA
        .post(`${apiPath}/saved-queries`)
        .send({ name: "A private", shared: false, data: queryData })
        .expect("Content-Type", /json/)
        .expect(200);
      expect(res.body.result).toBeTruthy();
      expect(res.body.data.id).toBeTruthy();
      expect(res.body.data.ownerId).toEqual(userAId);
    });

    it("ignores an ownerId sent by the client", async () => {
      const res = await agentA
        .post(`${apiPath}/saved-queries`)
        .send({
          name: "A spoofed",
          shared: false,
          data: queryData,
          ownerId: userBId,
        })
        .expect(200);
      expect(res.body.data.ownerId).toEqual(userAId);
    });

    it("a viewer cannot create a shared query", async () => {
      await agentA
        .post(`${apiPath}/saved-queries`)
        .send({ name: "A wants shared", shared: true, data: queryData })
        .expect(
          testErroneousResponse.bind(undefined, new PermissionDeniedError(""))
        );
    });

    it("an admin can create a shared query", async () => {
      const res = await adminAgent
        .post(`${apiPath}/saved-queries`)
        .send({ name: "admin shared", shared: true, data: queryData })
        .expect(200);
      expect(res.body.data.shared).toBeTruthy();
    });

    it("an editor can create a shared query", async () => {
      const res = await agentC
        .post(`${apiPath}/saved-queries`)
        .send({ name: "editor shared", shared: true, data: queryData })
        .expect(200);
      expect(res.body.data.shared).toBeTruthy();
    });

    it("rejects a malformed query tree", async () => {
      await agentA
        .post(`${apiPath}/saved-queries`)
        .send({
          name: "bad tree",
          shared: false,
          data: {
            query: {}, // no type/operator/params/edges
            includeEquivalents: false,
            includeSubordinates: false,
          },
        })
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });

    it("rejects a query tree with a malformed nested edge", async () => {
      await agentA
        .post(`${apiPath}/saved-queries`)
        .send({
          name: "bad edge",
          shared: false,
          data: {
            query: {
              ...queryData.query,
              edges: [{ type: "EP:T" }], // missing logic + node
            },
            includeEquivalents: false,
            includeSubordinates: false,
          },
        })
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });
  });

  describe("list", () => {
    beforeAll(async () => {
      await agentB
        .post(`${apiPath}/saved-queries`)
        .send({ name: "B private", shared: false, data: queryData })
        .expect(200);
      await adminAgent
        .post(`${apiPath}/saved-queries`)
        .send({ name: "admin shared list", shared: true, data: queryData })
        .expect(200);
    });

    it("returns own private + everyone's shared, not others' private", async () => {
      const res = await agentA.get(`${apiPath}/saved-queries`).expect(200);
      const items: ISavedQuery[] = res.body.data;
      const names = items.map((i) => i.name);
      expect(names).toContain("A private");
      expect(names).toContain("admin shared list");
      expect(names).not.toContain("B private");
    });
  });

  describe("delete", () => {
    const create = async (
      agent: AuthAgent,
      name: string,
      shared: boolean
    ): Promise<string> => {
      const res = await agent
        .post(`${apiPath}/saved-queries`)
        .send({ name, shared, data: queryData })
        .expect(200);
      return res.body.data.id;
    };

    it("returns NotFound for an unknown id", async () => {
      await agentA
        .delete(`${apiPath}/saved-queries/unknown-id-12345`)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new NotFound("")));
    });

    it("owner can delete own private query", async () => {
      const id = await create(agentA, "A to delete", false);
      await agentA
        .delete(`${apiPath}/saved-queries/${id}`)
        .expect(successfulGenericResponse)
        .expect(200);
      expect(await SavedQuery.findById(db.connection, id)).toBeNull();
    });

    it("a viewer cannot delete a shared query", async () => {
      const id = await create(adminAgent, "shared undeletable", true);
      await agentA
        .delete(`${apiPath}/saved-queries/${id}`)
        .expect(
          testErroneousResponse.bind(undefined, new PermissionDeniedError(""))
        );
      expect(await SavedQuery.findById(db.connection, id)).not.toBeNull();
    });

    it("an admin can delete a shared query", async () => {
      const id = await create(adminAgent, "shared admin-deletable", true);
      await adminAgent
        .delete(`${apiPath}/saved-queries/${id}`)
        .expect(successfulGenericResponse)
        .expect(200);
      expect(await SavedQuery.findById(db.connection, id)).toBeNull();
    });

    it("an editor can delete their own shared query", async () => {
      const id = await create(agentC, "editor shared deletable", true);
      await agentC
        .delete(`${apiPath}/saved-queries/${id}`)
        .expect(successfulGenericResponse)
        .expect(200);
      expect(await SavedQuery.findById(db.connection, id)).toBeNull();
    });

    it("an editor cannot delete another user's shared query", async () => {
      const id = await create(adminAgent, "admin shared undeletable", true);
      await agentC
        .delete(`${apiPath}/saved-queries/${id}`)
        .expect(
          testErroneousResponse.bind(undefined, new PermissionDeniedError(""))
        );
      expect(await SavedQuery.findById(db.connection, id)).not.toBeNull();
    });

    it("an admin cannot delete another user's private query", async () => {
      const id = await create(agentB, "B private admin-undeletable", false);
      await adminAgent
        .delete(`${apiPath}/saved-queries/${id}`)
        .expect(
          testErroneousResponse.bind(undefined, new PermissionDeniedError(""))
        );
      expect(await SavedQuery.findById(db.connection, id)).not.toBeNull();
    });
  });

  describe("update", () => {
    const create = async (
      agent: AuthAgent,
      name: string,
      shared: boolean
    ): Promise<string> => {
      const res = await agent
        .post(`${apiPath}/saved-queries`)
        .send({ name, shared, data: queryData })
        .expect(200);
      return res.body.data.id;
    };

    it("owner can rename own query", async () => {
      const id = await create(agentA, "A rename me", false);
      const res = await agentA
        .put(`${apiPath}/saved-queries/${id}`)
        .send({ name: "A renamed" })
        .expect(200);
      expect(res.body.data.name).toEqual("A renamed");
      expect((await SavedQuery.findById(db.connection, id))?.name).toEqual(
        "A renamed"
      );
    });

    it("rejects an empty name", async () => {
      const id = await create(agentA, "A empty-name", false);
      await agentA
        .put(`${apiPath}/saved-queries/${id}`)
        .send({ name: "   " })
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });

    it("a viewer cannot rename a shared query", async () => {
      const id = await create(adminAgent, "shared unrenamable", true);
      await agentA
        .put(`${apiPath}/saved-queries/${id}`)
        .send({ name: "hijacked" })
        .expect(
          testErroneousResponse.bind(undefined, new PermissionDeniedError(""))
        );
    });

    it("an admin can rename a shared query", async () => {
      const id = await create(adminAgent, "shared admin-renamable", true);
      const res = await adminAgent
        .put(`${apiPath}/saved-queries/${id}`)
        .send({ name: "admin renamed" })
        .expect(200);
      expect(res.body.data.name).toEqual("admin renamed");
    });

    it("an editor can rename their own shared query", async () => {
      const id = await create(agentC, "editor own shared", true);
      const res = await agentC
        .put(`${apiPath}/saved-queries/${id}`)
        .send({ name: "editor renamed" })
        .expect(200);
      expect(res.body.data.name).toEqual("editor renamed");
    });

    it("an editor cannot rename another user's shared query", async () => {
      const id = await create(adminAgent, "admin shared unrenamable", true);
      await agentC
        .put(`${apiPath}/saved-queries/${id}`)
        .send({ name: "hijacked" })
        .expect(
          testErroneousResponse.bind(undefined, new PermissionDeniedError(""))
        );
    });

    it("a viewer cannot share their own private query", async () => {
      const id = await create(agentA, "A stays private", false);
      await agentA
        .put(`${apiPath}/saved-queries/${id}`)
        .send({ shared: true })
        .expect(
          testErroneousResponse.bind(undefined, new PermissionDeniedError(""))
        );
      expect((await SavedQuery.findById(db.connection, id))?.shared).toBeFalsy();
    });
  });
});
