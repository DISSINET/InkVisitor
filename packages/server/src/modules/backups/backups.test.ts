import { testErroneousResponse } from "@modules/common.test";
import { BadParams, NotFound, UnauthorizedError } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { createAgentWithUserId, AuthAgent } from "@modules/testAuth";
import { apiPath } from "@common/constants";
import app from "../../server";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";
import User from "@models/user/user";
import { UserEnums } from "@inkvisitor/shared/enums";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

describe("modules/backups", function () {
  const db = new Db();
  let backupDir: string;
  // Backups are owner-only; the seeded admin user is an admin (not an owner), so
  // we seed a dedicated owner and open a cookie session for it. The request
  // pipeline re-fetches the user by id from the db, so the role must live in the
  // db row.
  const owner = new User({
    id: `owner-${Math.random()}`,
    name: `owner-${Math.random()}`,
    email: `owner-${Math.random()}@test.com`,
    password: "owner",
    active: true,
    verified: true,
    role: UserEnums.Role.Owner,
  });
  let ownerAgent: AuthAgent;

  beforeAll(async () => {
    await db.initDb();
    await owner.save(db.connection);
    ownerAgent = await createAgentWithUserId(owner.id);

    backupDir = fs.mkdtempSync(path.join(os.tmpdir(), "ink-backups-test-"));
    fs.mkdirSync(path.join(backupDir, "20240101"), { recursive: true });
    fs.writeFileSync(
      path.join(backupDir, "20240101", "inkvisitor_backup.tar.gz"),
      "backup-bytes"
    );
    process.env.BACKUP_DIR = backupDir;
  });

  afterAll(async () => {
    delete process.env.BACKUP_DIR;
    fs.rmSync(backupDir, { recursive: true, force: true });
    await owner.delete(db.connection);
    await db.close();
    await pool.end();
  });

  describe("auth - backups are not publicly accessible", () => {
    it("rejects listing without authentication", async () => {
      await request(app)
        .get(`${apiPath}/backups`)
        .expect(401)
        .expect(testErroneousResponse.bind(undefined, new UnauthorizedError("")));
    });

    it("rejects download without authentication", async () => {
      await request(app)
        .get(`${apiPath}/backups/download?file=20240101/inkvisitor_backup.tar.gz`)
        .expect(401)
        .expect(testErroneousResponse.bind(undefined, new UnauthorizedError("")));
    });
  });

  describe("GET /backups (owner)", () => {
    it("lists available backup archives", async () => {
      const response = await ownerAgent.get(`${apiPath}/backups`).expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      const entry = (response.body as any[]).find(
        (b) => b.id === "20240101/inkvisitor_backup.tar.gz"
      );
      expect(entry).toBeTruthy();
      expect(entry.filename).toBe("inkvisitor_backup.tar.gz");
      expect(entry.sizeBytes).toBe("backup-bytes".length);
    });
  });

  describe("GET /backups/download (owner)", () => {
    it("streams a backup archive as an attachment", async () => {
      const response = await ownerAgent
        .get(`${apiPath}/backups/download?file=20240101/inkvisitor_backup.tar.gz`)
        .expect(200);

      expect(response.headers["content-type"]).toContain("application/gzip");
      expect(response.headers["content-disposition"]).toContain(
        'attachment; filename="inkvisitor_backup.tar.gz"'
      );
    });

    it("returns BadParams when no file is provided", async () => {
      await ownerAgent
        .get(`${apiPath}/backups/download`)
        .expect(400)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });

    it("returns NotFound for a path-traversal attempt", async () => {
      await ownerAgent
        .get(`${apiPath}/backups/download?file=../../etc/passwd`)
        .expect(404)
        .expect(testErroneousResponse.bind(undefined, new NotFound("")));
    });

    it("returns NotFound for a missing archive", async () => {
      await ownerAgent
        .get(`${apiPath}/backups/download?file=20990101/inkvisitor_backup.tar.gz`)
        .expect(404)
        .expect(testErroneousResponse.bind(undefined, new NotFound("")));
    });
  });
});
