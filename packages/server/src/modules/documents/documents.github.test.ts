import "ts-jest";
import { clean } from "@modules/common.test";
import { apiPath } from "@common/constants";
import { AuthAgent, createAgentWithUserId, getAuthenticatedAgent } from "@modules/testAuth";
import { Db, storage } from "@service/storage";
import Document from "@models/document/document";
import Person from "@models/person/person";
import Resource from "@models/resource/resource";
import User from "@models/user/user";
import { pool } from "@middlewares/db";
import { sessionStore } from "@middlewares/session";
import { gitBlobSha } from "./github";
import { githubSignIns } from "./githubSignIns";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import { IDocument, IDocumentGithubSync } from "@inkvisitor/shared/types";
import { v4 as uuidv4 } from "uuid";
import defaultAcl from "../../../../database/datasets/default/acl_permissions.json";

// the acl_permissions keys of the five GitHub routes
const GITHUB_ROUTES = [
  ["GET", ":documentId/github"],
  ["PUT", ":documentId/repository"],
  ["POST", ":documentId/github/commit"],
  ["POST", "github/device"],
  ["POST", "github/device/poll"],
] as const;

type AclRow = { controller: string; method: string; route: string; roles?: string[]; public?: boolean };

const isGithubRow = (row: AclRow): boolean =>
  row.controller === "documents" &&
  GITHUB_ROUTES.some(([method, route]) => row.method === method && row.route === route);

// seeded straight from the shipped dataset, so a row whose key drifts from the
// route it names fails here
const shippedGithubRows = (defaultAcl as AclRow[]).filter(isGithubRow);

const REPOSITORY_URL = "https://github.com/acme/texts/blob/main/Some_text__[abc]/Some%20text.txt";

const storedSync: IDocumentGithubSync = {
  blobSha: "1111111111111111111111111111111111111111",
  commitSha: "2222222222222222222222222222222222222222",
  commitUrl: "https://github.com/acme/texts/commit/2222222",
  committedAt: "2026-01-02T03:04:05Z",
  userId: "1",
  userName: "admin",
  githubLogin: "octo",
};

describe("modules/documents github", () => {
  const db = new Db();

  const personId = uuidv4();
  const linked = new Document({
    title: "Linked",
    content: `<${personId}>Petrus</${personId}> příliš žluťoučký`,
    entityIds: { [EntityEnums.Class.Person]: [personId] },
  } as any);

  const curatorId = uuidv4();
  const editorId = uuidv4();
  const viewerId = uuidv4();
  const resourceId = uuidv4();

  const curatorSid = "curator-session-" + uuidv4();

  let adminAgent: AuthAgent;
  let curatorAgent: AuthAgent;
  let editorAgent: AuthAgent;
  let viewerAgent: AuthAgent;

  const stored = async (): Promise<IDocument> =>
    (await storage.documents.get(db.connection, linked.id)) as IDocument;

  const link = (): Promise<unknown> =>
    storage.documents.update(db.connection, linked.id, {
      repositoryUrl: REPOSITORY_URL,
      githubSync: storedSync,
    });

  const setGithubAcl = async (rows: AclRow[]): Promise<void> => {
    const current = (await storage.acl.all(db.connection)).filter(isGithubRow);
    await storage.acl.deleteMany(
      db.connection,
      current.map((row) => row.id)
    );
    if (rows.length) {
      await storage.acl.insert(db.connection, rows as any);
    }
  };

  beforeAll(async () => {
    await db.initDb();
    await setGithubAcl(shippedGithubRows);
    // a real entity: every document save rebuilds entityIds from the entities
    // that exist
    await new Person({ id: personId } as any).save(db.connection);
    await linked.save(db.connection);

    await new Resource({
      id: resourceId,
      class: EntityEnums.Class.Resource,
      data: { documentId: linked.id },
    } as any).save(db.connection);

    await new User({
      id: curatorId,
      name: "curator",
      role: UserEnums.Role.Editor,
      active: true,
      verified: true,
      // the right's `territory` field carries the Resource id for Annotate
      rights: [{ territory: resourceId, mode: UserEnums.RoleMode.Annotate }],
    } as any).save(db.connection);
    await new User({
      id: editorId,
      name: "editor",
      role: UserEnums.Role.Editor,
      active: true,
      verified: true,
    } as any).save(db.connection);
    await new User({
      id: viewerId,
      name: "viewer",
      role: UserEnums.Role.Viewer,
      active: true,
      verified: true,
    } as any).save(db.connection);

    adminAgent = await getAuthenticatedAgent();
    curatorAgent = await createAgentWithUserId(curatorId, curatorSid);
    editorAgent = await createAgentWithUserId(editorId);
    viewerAgent = await createAgentWithUserId(viewerId);
  });

  afterAll(async () => {
    await clean(db);
    await pool.end();
  });

  describe("stored GitHub fields", () => {
    beforeEach(link);

    it("are not writable through a document save", async () => {
      await adminAgent
        .put(`${apiPath}/documents/${linked.id}`)
        .send({ title: "Renamed", repositoryUrl: "https://evil.example/x", githubSync: null })
        .expect(200);

      const after = await stored();
      expect(after.title).toBe("Renamed");
      expect(after.repositoryUrl).toBe(REPOSITORY_URL);
      expect(after.githubSync).toEqual(storedSync);
    });

    it("are not settable when a document is created", async () => {
      await adminAgent
        .post(`${apiPath}/documents`)
        .send({ title: "Created with fields", content: "text", repositoryUrl: REPOSITORY_URL, githubSync: storedSync })
        .expect(200);

      const created = (await storage.documents.allByCreatedAt(db.connection)).find(
        (d) => d.title === "Created with fields"
      );
      expect(created).toBeDefined();
      expect(created?.repositoryUrl).toBeUndefined();
      expect(created?.githubSync).toBeUndefined();
    });

    it("survive a content save", async () => {
      await adminAgent
        .put(`${apiPath}/documents/${linked.id}`)
        .send({ content: `<${personId}>Petrus</${personId}> saved again` })
        .expect(200);

      const after = await stored();
      expect(after.content).toContain("saved again");
      expect(after.repositoryUrl).toBe(REPOSITORY_URL);
      expect(after.githubSync).toEqual(storedSync);
    });

    it.each([
      ["an admin", () => adminAgent, true],
      ["an unassigned editor", () => editorAgent, true],
      ["a viewer", () => viewerAgent, false],
    ] as const)("the list shows them to %s", async (_who, agent, visible) => {
      const res = await agent().get(`${apiPath}/documents`).expect(200);
      const row = (res.body as IDocument[]).find((d) => d.id === linked.id);
      expect(row).toBeDefined();
      expect(row?.repositoryUrl).toBe(visible ? REPOSITORY_URL : undefined);
      expect(row?.githubSync ?? undefined).toEqual(visible ? storedSync : undefined);
    });

    it.each([
      ["an admin", () => adminAgent, true],
      ["an unassigned editor", () => editorAgent, true],
      ["a viewer", () => viewerAgent, false],
    ] as const)("the detail shows them to %s", async (_who, agent, visible) => {
      const res = await agent().get(`${apiPath}/documents/${linked.id}`).expect(200);
      expect(res.body.id).toBe(linked.id);
      expect(res.body.repositoryUrl).toBe(visible ? REPOSITORY_URL : undefined);
      expect(res.body.githubSync ?? undefined).toEqual(visible ? storedSync : undefined);
    });

    it("are left out of the documents listed for an entity", async () => {
      const rows = await Document.findByEntityId(db.connection, personId);
      expect(rows.map((d) => d.id)).toEqual([linked.id]);
      expect(rows[0].repositoryUrl).toBeUndefined();
      expect(rows[0].githubSync).toBeUndefined();
    });
  });

  describe("routes", () => {
    const TOKEN = "ghu_stub_token_0123456789";
    const DEVICE_CODE = "stub_device_code_0123456789";
    const CONTENTS = "/repos/acme/texts/contents/Some_text__%5Babc%5D/Some%20text.txt";
    const OTHER_SHA = "9999999999999999999999999999999999999999";
    const COMMIT_SHA = "c0ffee0000000000000000000000000000000000";

    interface ISeenCall {
      method: string;
      url: URL;
      headers: Record<string, string>;
      body?: any;
    }

    // what the fake GitHub holds for the linked file
    let remote: {
      file: "missing" | "folder" | { sha: string };
      repositoryReachable: boolean;
      unauthorized: boolean;
      putStatus: number;
      putMessage: string;
      poll: Record<string, unknown>;
      // status of the device code request, when GitHub is to refuse it
      deviceStatus?: number;
      // runs while GitHub handles the write
      onPut?: () => Promise<unknown>;
    };
    let seen: ISeenCall[] = [];
    // every response body the API sent in this block, to prove no secret leaves
    const sentBodies: string[] = [];

    const realFetch = global.fetch;

    const reply = (status: number, body?: unknown): Response =>
      new Response(body === undefined ? null : JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      });

    const fakeGithub = async (call: ISeenCall): Promise<Response> => {
      const { host, pathname } = call.url;
      if (host === "github.com" && pathname === "/login/device/code") {
        if (remote.deviceStatus === 404) {
          // a client id GitHub does not know
          return reply(404, { error: "Not Found" });
        }
        if (remote.deviceStatus) {
          return reply(remote.deviceStatus, {
            error: "incorrect_client_credentials",
            error_description: "The client_id is not valid.",
          });
        }
        return reply(200, {
          device_code: DEVICE_CODE,
          user_code: "ABCD-1234",
          verification_uri: "https://github.com/login/device",
          expires_in: 900,
          interval: 5,
        });
      }
      if (host === "github.com" && pathname === "/login/oauth/access_token") {
        return reply(200, remote.poll);
      }
      if (host !== "api.github.com") {
        throw new Error(`the server called an unexpected host: ${host}`);
      }
      if (remote.unauthorized) {
        return reply(401, { message: "Bad credentials" });
      }
      if (pathname === "/user") {
        return reply(200, { login: "octo" });
      }
      if (call.method === "GET" && pathname === CONTENTS) {
        if (remote.file === "missing") {
          return reply(404, { message: "Not Found" });
        }
        if (remote.file === "folder") {
          return reply(200, { type: "dir", entries: [] });
        }
        return reply(200, { type: "file", sha: remote.file.sha, content: "", encoding: "none" });
      }
      if (call.method === "GET" && pathname === "/repos/acme/texts") {
        return remote.repositoryReachable ? reply(200, { private: true }) : reply(404, { message: "Not Found" });
      }
      if (call.method === "GET" && pathname === "/repos/acme/texts/commits") {
        return reply(200, [
          {
            html_url: "https://github.com/acme/texts/commit/abc",
            commit: {
              author: { name: "Octo Cat", date: "2026-01-05T00:00:00Z" },
              message: "Update the file\n\nlonger body",
            },
            author: { login: "octo" },
          },
        ]);
      }
      if (call.method === "PUT" && pathname === CONTENTS) {
        await remote.onPut?.();
        if (remote.putStatus >= 300) {
          return reply(remote.putStatus, { message: remote.putMessage });
        }
        const written = Buffer.from(call.body.content, "base64").toString("utf8");
        return reply(remote.putStatus, {
          content: { sha: gitBlobSha(written) },
          commit: {
            sha: COMMIT_SHA,
            html_url: "https://github.com/acme/texts/commit/c0ffee",
            committer: { date: "2026-01-06T00:00:00Z" },
          },
        });
      }
      throw new Error(`the server made an unexpected GitHub call: ${call.method} ${call.url}`);
    };

    const call = async (
      agent: AuthAgent,
      method: "get" | "post" | "put",
      path: string,
      body?: object
    ): Promise<{ status: number; body: any }> => {
      const req = agent[method](`${apiPath}/documents${path}`);
      const res = await (body ? req.send(body) : req);
      sentBodies.push(JSON.stringify(res.body));
      return { status: res.status, body: res.body };
    };

    const signIn = async (agent: AuthAgent): Promise<void> => {
      const device = await call(agent, "post", "/github/device");
      expect(device.status).toBe(200);
      const poll = await call(agent, "post", "/github/device/poll");
      expect(poll.body).toEqual({ status: "authorized" });
    };

    const status = (agent: AuthAgent = curatorAgent) => call(agent, "get", `/${linked.id}/github`);

    const localSha = async (): Promise<string> => gitBlobSha((await stored()).content);

    const setSync = (sync: Partial<IDocumentGithubSync> | null): Promise<unknown> =>
      storage.documents.update(db.connection, linked.id, {
        repositoryUrl: REPOSITORY_URL,
        githubSync: sync === null ? null : { ...storedSync, ...sync },
      });

    beforeAll(() => {
      global.fetch = (async (input: any, init: any = {}) => {
        const seenCall: ISeenCall = {
          method: (init.method || "GET").toUpperCase(),
          url: new URL(String(input)),
          headers: { ...(init.headers || {}) },
          body: typeof init.body === "string" ? JSON.parse(init.body) : undefined,
        };
        seen.push(seenCall);
        return fakeGithub(seenCall);
      }) as typeof fetch;
    });

    afterAll(() => {
      global.fetch = realFetch;
      delete process.env.GITHUB_APP_CLIENT_ID;
    });

    beforeEach(async () => {
      process.env.GITHUB_APP_CLIENT_ID = "Iv1.stubclient";
      githubSignIns.clear();
      remote = {
        file: { sha: OTHER_SHA },
        repositoryReachable: true,
        unauthorized: false,
        putStatus: 200,
        putMessage: "",
        poll: { access_token: TOKEN, token_type: "bearer", expires_in: 28800, refresh_token: "ghr_stub_refresh" },
      };
      await setSync(null);
      seen = [];
    });

    describe("permissions", () => {
      // read inside a test: the document gets its id when it is saved
      const everyRoute = () =>
        [
          ["get", `/${linked.id}/github`, undefined],
          ["put", `/${linked.id}/repository`, { repositoryUrl: REPOSITORY_URL }],
          ["post", `/${linked.id}/github/commit`, { message: "m", expectedRemoteSha: null }],
          ["post", "/github/device", undefined],
          ["post", "/github/device/poll", undefined],
        ] as const;

      it("ships an ACL row that names the editor alone for each of the five routes", () => {
        expect(shippedGithubRows.map((row) => [row.method, row.route, row.roles]).sort()).toEqual(
          GITHUB_ROUTES.map(([method, route]) => [method, route, ["editor"]]).sort()
        );
      });

      it("refuses a viewer at the ACL on every route", async () => {
        for (const [method, path, body] of everyRoute()) {
          const res = await call(viewerAgent, method, path, body);
          expect([path, res.status, res.body.error, res.body.message]).toEqual([
            path,
            403,
            "PermissionDeniedError",
            "Endpoint not allowed",
          ]);
        }
        expect(seen).toEqual([]);
      });

      describe("while the ACL rows name no role", () => {
        beforeAll(() => setGithubAcl(shippedGithubRows.map((row) => ({ ...row, roles: [] }))));
        afterAll(() => setGithubAcl(shippedGithubRows));

        it("refuses an assigned editor on every route", async () => {
          for (const [method, path, body] of everyRoute()) {
            const res = await call(curatorAgent, method, path, body);
            expect([path, res.status, res.body.message]).toEqual([path, 403, "Endpoint not allowed"]);
          }
          expect(seen).toEqual([]);
        });

        it("still lets an admin through", async () => {
          expect((await status(adminAgent)).status).toBe(200);
          expect((await call(adminAgent, "post", "/github/device")).status).toBe(200);
        });
      });

      it("refuses an unassigned editor on the three document routes", async () => {
        for (const [method, path, body] of everyRoute().slice(0, 3)) {
          const res = await call(editorAgent, method, path, body);
          expect([path, res.status, res.body.error, res.body.message]).toEqual([
            path,
            403,
            "PermissionDeniedError",
            "document cannot be committed",
          ]);
        }
        expect(seen).toEqual([]);
      });

      it("lets an unassigned editor sign in", async () => {
        await signIn(editorAgent);
      });
    });

    describe("repository URL", () => {
      it("refuses an address outside github.com", async () => {
        const res = await call(curatorAgent, "put", `/${linked.id}/repository`, {
          repositoryUrl: "https://gitlab.com/a/b/blob/main/f.txt",
        });
        expect([res.status, res.body.error]).toEqual([400, "BadParams"]);
        expect((await stored()).repositoryUrl).toBe(REPOSITORY_URL);
      });

      it("stores a valid address, forgets the last commit and leaves updatedAt alone", async () => {
        await setSync({});
        const before = await stored();
        const next = "https://github.com/acme/texts/blob/main/other/Other.txt";

        const res = await call(curatorAgent, "put", `/${linked.id}/repository`, { repositoryUrl: next });
        expect(res.status).toBe(200);

        const after = await stored();
        expect(after.repositoryUrl).toBe(next);
        expect(after.githubSync).toBeNull();
        expect(after.updatedAt).toEqual(before.updatedAt);
      });

      it("clears the address with an empty string", async () => {
        await setSync({});
        const res = await call(curatorAgent, "put", `/${linked.id}/repository`, { repositoryUrl: "" });
        expect(res.status).toBe(200);
        const after = await stored();
        expect(after.repositoryUrl).toBe("");
        expect(after.githubSync).toBeNull();
      });
    });

    describe("sign-in", () => {
      it("hands the browser the user code and never the device code", async () => {
        const res = await call(curatorAgent, "post", "/github/device");
        expect(res.body).toEqual({
          userCode: "ABCD-1234",
          verificationUri: "https://github.com/login/device",
          expiresIn: 900,
          interval: 5,
        });
        expect(seen[0].body).toEqual({ client_id: "Iv1.stubclient" });
      });

      it.each([
        ["authorization_pending", "pending"],
        ["slow_down", "slow-down"],
        ["expired_token", "expired"],
        ["token_expired", "expired"],
        ["access_denied", "denied"],
      ])("answers GitHub's %s as %s", async (error, expected) => {
        await call(curatorAgent, "post", "/github/device");
        remote.poll = { error };
        const res = await call(curatorAgent, "post", "/github/device/poll");
        expect(res.body).toEqual({ status: expected });
        expect((await status()).body.authorized).toBe(false);
      });

      it("answers a poll with no sign-in under way as expired", async () => {
        const res = await call(curatorAgent, "post", "/github/device/poll");
        expect(res.body).toEqual({ status: "expired" });
        expect(seen).toEqual([]);
      });

      it("refuses to start when the deployment has no client id", async () => {
        delete process.env.GITHUB_APP_CLIENT_ID;
        const res = await call(curatorAgent, "post", "/github/device");
        expect([res.status, res.body.error]).toEqual([400, "BadParams"]);
        expect(seen).toEqual([]);
      });

      it("passes on GitHub's refusal of the client id, even as a 401", async () => {
        remote.deviceStatus = 401;
        const res = await call(curatorAgent, "post", "/github/device");
        expect([res.status, res.body.error]).toEqual([502, "GithubRequestError"]);
        expect(res.body.message).toContain("The client_id is not valid.");
      });

      it("names GitHub's status when a refusal comes without a reason, as for an unknown client id", async () => {
        remote.deviceStatus = 404;
        const res = await call(curatorAgent, "post", "/github/device");
        expect([res.status, res.body.error]).toEqual([502, "GithubRequestError"]);
        expect(res.body.message).toBe("GitHub did not start the sign-in (404)");
      });

      it("is not handed to another user who arrives on the same session id", async () => {
        const sharedSid = "shared-session-" + uuidv4();
        await signIn(await createAgentWithUserId(curatorId, sharedSid));
        expect(githubSignIns.size()).toBe(1);

        const res = await status(await createAgentWithUserId("1", sharedSid));
        expect(res.body).toMatchObject({ state: "not-authorized", authorized: false });
        expect(githubSignIns.size()).toBe(0);
      });

      it("is forgotten when the user signs out of InkVisitor", async () => {
        const agent = await createAgentWithUserId(curatorId);
        await signIn(agent);
        expect(githubSignIns.size()).toBe(1);
        await agent.post(`${apiPath}/users/signout`).expect(200);
        expect(githubSignIns.size()).toBe(0);
      });
    });

    describe("status", () => {
      it("is not-configured without a client id", async () => {
        delete process.env.GITHUB_APP_CLIENT_ID;
        const res = await status();
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ state: "not-configured", configured: false, authorized: false });
        expect(seen).toEqual([]);
      });

      it("is not-linked for a document with no repository address", async () => {
        await storage.documents.update(db.connection, linked.id, { repositoryUrl: "", githubSync: null });
        await signIn(curatorAgent);
        seen = [];
        expect((await status()).body).toMatchObject({ state: "not-linked", configured: true, authorized: true });
        expect(seen).toEqual([]);
      });

      it("is not-authorized before the GitHub sign-in", async () => {
        const res = await status();
        expect(res.body).toMatchObject({
          state: "not-authorized",
          authorized: false,
          repositoryUrl: REPOSITORY_URL,
          target: { owner: "acme", repo: "texts", branch: "main", path: "Some_text__[abc]/Some text.txt" },
        });
        expect(seen).toEqual([]);
      });

      it("shows both sides once signed in", async () => {
        await adminAgent.put(`${apiPath}/documents/${linked.id}`).send({ title: "Saved by the admin" }).expect(200);
        await signIn(curatorAgent);
        const res = await status();
        const document = await stored();
        expect(res.body).toMatchObject({
          state: "never-synced",
          configured: true,
          authorized: true,
          githubLogin: "octo",
          lastSync: null,
          github: {
            exists: true,
            blobSha: OTHER_SHA,
            lastCommit: {
              date: "2026-01-05T00:00:00Z",
              authorName: "Octo Cat",
              authorLogin: "octo",
              message: "Update the file",
              url: "https://github.com/acme/texts/commit/abc",
            },
          },
        });
        expect(new Date(res.body.inkvisitor.updatedAt).getTime()).toBe(
          new Date((document.updatedAt ?? document.createdAt) as Date).getTime()
        );
        expect(res.body.inkvisitor.userName).toBe("admin");
      });

      it("names nobody for a save that left no audit entry", async () => {
        await adminAgent.put(`${apiPath}/documents/${linked.id}`).send({ title: "Audited save" }).expect(200);
        // what removing an anchor does: the document moves, no audit is written
        await storage.documents.update(db.connection, linked.id, { updatedAt: new Date(Date.now() + 60_000) });
        await signIn(curatorAgent);

        const res = await status();
        expect(res.body.inkvisitor.updatedAt).toBeDefined();
        expect(res.body.inkvisitor.userName).toBeUndefined();
        expect(res.body.inkvisitor.auditType).toBeUndefined();
      });

      it("asks GitHub with the user's token, for the encoded path on the branch", async () => {
        await signIn(curatorAgent);
        seen = [];
        await status();
        const read = seen.find((c) => c.url.pathname === CONTENTS);
        expect(read).toBeDefined();
        expect(read?.url.searchParams.get("ref")).toBe("main");
        expect(read?.headers.Authorization).toBe(`Bearer ${TOKEN}`);
        expect(read?.headers.Accept).toBe("application/vnd.github.object+json");
        expect(seen.every((c) => c.url.host === "api.github.com")).toBe(true);
      });

      it("is not-found when the file is missing but the repository answers", async () => {
        await signIn(curatorAgent);
        remote.file = "missing";
        const res = await status();
        expect(res.body).toMatchObject({ state: "not-found", github: { exists: false } });
      });

      it("is no-access when the repository does not answer either", async () => {
        await signIn(curatorAgent);
        remote.file = "missing";
        remote.repositoryReachable = false;
        expect((await status()).body.state).toBe("no-access");
      });

      it("is is-folder when the address names a folder", async () => {
        await signIn(curatorAgent);
        remote.file = "folder";
        expect((await status()).body.state).toBe("is-folder");
      });

      it("is identical when GitHub holds the document's content", async () => {
        await signIn(curatorAgent);
        remote.file = { sha: await localSha() };
        expect((await status()).body.state).toBe("identical");
      });

      it("is inkvisitor-changed when GitHub still holds the last commit", async () => {
        await signIn(curatorAgent);
        await setSync({ blobSha: OTHER_SHA });
        expect((await status()).body.state).toBe("inkvisitor-changed");
      });

      it("is github-changed when only the GitHub file moved", async () => {
        await signIn(curatorAgent);
        await setSync({ blobSha: await localSha() });
        expect((await status()).body.state).toBe("github-changed");
      });

      it("is both-changed when both moved", async () => {
        await signIn(curatorAgent);
        await setSync({ blobSha: "8888888888888888888888888888888888888888" });
        expect((await status()).body.state).toBe("both-changed");
      });

      it("drops a sign-in GitHub no longer accepts, without answering 401", async () => {
        await signIn(curatorAgent);
        remote.unauthorized = true;
        const res = await status();
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ state: "not-authorized", authorized: false });

        seen = [];
        expect((await status()).body.state).toBe("not-authorized");
        expect(seen).toEqual([]);
      });
    });

    describe("commit", () => {
      // the dialog sends the repository URL it showed along with every commit
      const commit = (body: object, agent: AuthAgent = curatorAgent) =>
        call(agent, "post", `/${linked.id}/github/commit`, { repositoryUrl: REPOSITORY_URL, ...body });

      it("writes the document's bytes over the file the user was shown", async () => {
        await signIn(curatorAgent);
        await storage.documents.update(db.connection, linked.id, {
          content: `<${personId}>Petrus</${personId}> příliš žluťoučký kůň\n`,
        });
        const before = await stored();
        seen = [];

        const res = await commit({ message: "  Update from InkVisitor  ", expectedRemoteSha: OTHER_SHA });
        expect(res.status).toBe(200);

        const put = seen.find((c) => c.method === "PUT");
        expect(put?.url.pathname).toBe(CONTENTS);
        expect(put?.headers.Authorization).toBe(`Bearer ${TOKEN}`);
        expect(put?.body.message).toBe("Update from InkVisitor");
        expect(put?.body.branch).toBe("main");
        expect(put?.body.sha).toBe(OTHER_SHA);
        expect(put?.body).not.toHaveProperty("author");
        expect(put?.body).not.toHaveProperty("committer");
        expect(Buffer.from(put?.body.content, "base64").equals(Buffer.from(before.content, "utf8"))).toBe(true);
        expect(before.content).toContain("žluťoučký");

        const sync: IDocumentGithubSync = {
          blobSha: gitBlobSha(before.content),
          commitSha: COMMIT_SHA,
          commitUrl: "https://github.com/acme/texts/commit/c0ffee",
          committedAt: "2026-01-06T00:00:00Z",
          userId: curatorId,
          userName: "curator",
          githubLogin: "octo",
          documentUpdatedAt: new Date((before.updatedAt ?? before.createdAt) as Date).toISOString(),
        };
        expect(res.body).toEqual(sync);

        const after = await stored();
        expect(after.githubSync).toEqual(sync);
        expect(after.updatedAt).toEqual(before.updatedAt);
        expect(after.content).toBe(before.content);
      });

      it("creates the file when none was shown, sending no sha", async () => {
        await signIn(curatorAgent);
        remote.file = "missing";
        remote.putStatus = 201;
        seen = [];
        const res = await commit({ message: "Add", expectedRemoteSha: null });
        expect(res.status).toBe(200);
        expect(seen.find((c) => c.method === "PUT")?.body).not.toHaveProperty("sha");
      });

      it.each([
        [
          "replaced",
          409,
          `Some_text__[abc]/Some text.txt does not match ${OTHER_SHA}`,
          { sha: "7777777777777777777777777777777777777777" },
          OTHER_SHA,
        ],
        ["created where none was shown", 422, 'Invalid request.\n\n"sha" wasn\'t supplied.', { sha: OTHER_SHA }, null],
      ] as const)(
        "answers a conflict and stores nothing when the file was %s meanwhile",
        async (_what, putStatus, putMessage, fileNow, expectedRemoteSha) => {
          await signIn(curatorAgent);
          remote.putStatus = putStatus;
          remote.putMessage = putMessage;
          remote.file = fileNow;
          const res = await commit({ message: "Update", expectedRemoteSha });
          expect([res.status, res.body.error]).toEqual([409, "GithubConflictError"]);
          expect((await stored()).githubSync).toBeNull();
        }
      );

      it("answers a conflict without writing when the file shown is no longer there", async () => {
        await signIn(curatorAgent);
        // GitHub checks the expected sha only against a file that exists: with
        // none at the path it creates one and answers 201
        remote.file = "missing";
        remote.putStatus = 201;
        seen = [];
        const res = await commit({ message: "Update", expectedRemoteSha: OTHER_SHA });
        expect([res.status, res.body.error]).toEqual([409, "GithubConflictError"]);
        expect(seen.some((c) => c.method === "PUT")).toBe(false);
        expect((await stored()).githubSync).toBeNull();
      });

      it("does not call a refusal a conflict while the file is still the one shown", async () => {
        await signIn(curatorAgent);
        remote.putStatus = 409;
        remote.putMessage = "Repository rule violations found. Changes must be made through a pull request.";
        const res = await commit({ message: "Update", expectedRemoteSha: OTHER_SHA });
        expect([res.status, res.body.error]).toEqual([502, "GithubRequestError"]);
        expect(res.body.message).toContain("Changes must be made through a pull request");
        expect((await stored()).githubSync).toBeNull();
      });

      it("refuses to commit to another address than the one the dialog showed", async () => {
        await signIn(curatorAgent);
        seen = [];
        const res = await commit({
          message: "Update",
          expectedRemoteSha: null,
          repositoryUrl: "https://github.com/acme/texts/blob/main/other/Other.txt",
        });
        expect([res.status, res.body.error]).toEqual([409, "GithubConflictError"]);
        expect(seen).toEqual([]);
      });

      it("keeps no record of a commit when the address was changed while GitHub wrote it", async () => {
        await signIn(curatorAgent);
        const next = "https://github.com/acme/texts/blob/main/other/Other.txt";
        remote.onPut = () =>
          storage.documents.update(db.connection, linked.id, { repositoryUrl: next, githubSync: null });

        const res = await commit({ message: "Update", expectedRemoteSha: OTHER_SHA });
        expect(res.status).toBe(200);

        const after = await stored();
        expect(after.repositoryUrl).toBe(next);
        expect(after.githubSync).toBeNull();
      });

      it("passes on another refusal with GitHub's own words", async () => {
        await signIn(curatorAgent);
        remote.putStatus = 404;
        remote.putMessage = "Branch main not found";
        const res = await commit({ message: "Update", expectedRemoteSha: OTHER_SHA });
        expect([res.status, res.body.error]).toEqual([502, "GithubRequestError"]);
        expect(res.body.message).toContain("Branch main not found");
        expect((await stored()).githubSync).toBeNull();
      });

      it("asks for the GitHub sign-in first", async () => {
        const res = await commit({ message: "Update", expectedRemoteSha: OTHER_SHA });
        expect([res.status, res.body.error]).toEqual([403, "GithubSignInRequiredError"]);
        expect(seen).toEqual([]);
      });

      it("asks for the sign-in again when GitHub no longer accepts it", async () => {
        await signIn(curatorAgent);
        remote.unauthorized = true;
        const res = await commit({ message: "Update", expectedRemoteSha: OTHER_SHA });
        expect([res.status, res.body.error]).toEqual([403, "GithubSignInRequiredError"]);
        expect((await status()).body.authorized).toBe(false);
      });

      it.each([
        ["an empty message", { message: "   ", expectedRemoteSha: OTHER_SHA }],
        ["no expected sha at all", { message: "Update" }],
        ["a sha that is no sha", { message: "Update", expectedRemoteSha: "../../x" }],
        ["no repository address", { message: "Update", expectedRemoteSha: OTHER_SHA, repositoryUrl: undefined }],
      ])("refuses %s", async (_name, body) => {
        await signIn(curatorAgent);
        seen = [];
        const res = await commit(body);
        expect([res.status, res.body.error]).toEqual([400, "BadParams"]);
        expect(seen).toEqual([]);
      });

      it("refuses a document with no repository address", async () => {
        await signIn(curatorAgent);
        await storage.documents.update(db.connection, linked.id, { repositoryUrl: "" });
        seen = [];
        const res = await commit({ message: "Update", expectedRemoteSha: null });
        expect([res.status, res.body.error]).toEqual([400, "BadParams"]);
        expect(seen).toEqual([]);
      });
    });

    describe("secrets", () => {
      it("never leave the server: not in a response, not in the session row", async () => {
        await signIn(curatorAgent);
        await status();

        const session = await new Promise<unknown>((resolve, reject) =>
          sessionStore.get(curatorSid, (err, data) => (err ? reject(err) : resolve(data)))
        );
        expect(session).toBeTruthy();

        const everything = sentBodies.join("\n") + JSON.stringify(session);
        expect(sentBodies.length).toBeGreaterThan(30);
        for (const secret of [TOKEN, DEVICE_CODE, "ghr_stub_refresh"]) {
          expect(everything).not.toContain(secret);
        }
      });
    });
  });
});
