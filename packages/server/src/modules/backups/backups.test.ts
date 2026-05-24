import { testErroneousResponse } from "@modules/common.test";
import { BadParams, NotFound, UnauthorizedError } from "@inkvisitor/shared/types/errors";
import request from "supertest";
import { supertestConfig } from "..";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { Db } from "@service/rethink";
import { pool } from "@middlewares/db";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

describe("modules/backups", function () {
  const db = new Db();
  let backupDir: string;

  beforeAll(async () => {
    await db.initDb();

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
    await db.close();
    await pool.end();
  });

  describe("auth - backups are not publicly accessible", () => {
    it("rejects listing without a token", async () => {
      await request(app)
        .get(`${apiPath}/backups`)
        .expect(401)
        .expect(testErroneousResponse.bind(undefined, new UnauthorizedError("")));
    });

    it("rejects download without a token", async () => {
      await request(app)
        .get(`${apiPath}/backups/download?file=20240101/inkvisitor_backup.tar.gz`)
        .expect(401)
        .expect(testErroneousResponse.bind(undefined, new UnauthorizedError("")));
    });
  });

  // Note: backups are owner-only - supertestConfig.token must belong to an owner
  // for the cases below to pass (a non-owner, incl. admin, gets 403).
  describe("GET /backups (owner)", () => {
    it("lists available backup archives", async () => {
      const response = await request(app)
        .get(`${apiPath}/backups`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200);

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
      const response = await request(app)
        .get(`${apiPath}/backups/download?file=20240101/inkvisitor_backup.tar.gz`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(200);

      expect(response.headers["content-type"]).toContain("application/gzip");
      expect(response.headers["content-disposition"]).toContain(
        'attachment; filename="inkvisitor_backup.tar.gz"'
      );
    });

    it("returns BadParams when no file is provided", async () => {
      await request(app)
        .get(`${apiPath}/backups/download`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(400)
        .expect(testErroneousResponse.bind(undefined, new BadParams("")));
    });

    it("returns NotFound for a path-traversal attempt", async () => {
      await request(app)
        .get(`${apiPath}/backups/download?file=../../etc/passwd`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(404)
        .expect(testErroneousResponse.bind(undefined, new NotFound("")));
    });

    it("returns NotFound for a missing archive", async () => {
      await request(app)
        .get(`${apiPath}/backups/download?file=20990101/inkvisitor_backup.tar.gz`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect(404)
        .expect(testErroneousResponse.bind(undefined, new NotFound("")));
    });
  });
});
