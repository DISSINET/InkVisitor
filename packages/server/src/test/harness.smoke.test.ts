import request from "supertest";
import { r } from "rethinkdb-ts";
import app from "../server";
import { apiPath } from "@common/constants";
import { Db } from "@service/rethink";
import { getAuthenticatedAgent } from "@modules/testAuth";
import { pool } from "@middlewares/db";

/**
 * Smoke test for the test harness itself (globalSetup/globalTeardown).
 * Proves the suite runs against the provisioned ephemeral DB, that the schema
 * and admin user are in place, and that an authenticated (cookie-session) HTTP
 * request reaches the app.
 */
describe("test harness (db + auth)", () => {
  it("targets a disposable test database, never the real one", () => {
    expect(process.env.DB_NAME).toMatch(/(^iv_test_)|(_test$)|(^test_)/i);
  });

  it("provisioned tables with their secondary indexes", async () => {
    const db = new Db();
    await db.initDb();
    try {
      const entityIndexes = await r
        .table("entities")
        .indexList()
        .run(db.connection);
      expect(entityIndexes).toContain("class");
      const relationIndexes = await r
        .table("relations")
        .indexList()
        .run(db.connection);
      expect(relationIndexes).toContain("entityIds");
    } finally {
      await db.close();
    }
  });

  it("seeded the admin user", async () => {
    const db = new Db();
    await db.initDb();
    try {
      const admin = (await r.table("users").get("1").run(db.connection)) as {
        name: string;
      } | null;
      expect(admin).toBeTruthy();
      expect(admin?.name).toBe("admin");
    } finally {
      await db.close();
    }
  });
});

describe("test harness (http)", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("rejects an unauthenticated request on a protected route", async () => {
    await request(app).get(`${apiPath}/users/me`).expect(401);
  });

  it("authenticates the seeded admin via a cookie session", async () => {
    const agent = await getAuthenticatedAgent();
    const res = await agent.get(`${apiPath}/users/me`).expect(200);
    expect(res.body.id).toBe("1");
  });
});
