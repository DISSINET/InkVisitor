import request from "supertest";
import { r } from "rethinkdb-ts";
import app from "../server";
import { apiPath } from "@common/constants";
import { supertestConfig } from "@modules/index";
import { Db } from "@service/rethink";
import { generateAccessToken, verifyJwtToken } from "@common/auth";
import { pool } from "@middlewares/db";
import { adminSeed } from "./fixtures";

/**
 * Smoke test for the test harness itself (globalSetup/globalTeardown + setup.ts).
 * Proves the suite runs against the provisioned ephemeral DB, that the schema
 * and admin user are in place, that a minted token round-trips through the real
 * auth verifier, and that an authenticated HTTP request reaches the app.
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

  it("mints a TEST_JWT_TOKEN that the real verifier accepts", () => {
    expect(process.env.TEST_JWT_TOKEN).toBeTruthy();
    expect(verifyJwtToken(process.env.TEST_JWT_TOKEN as string)?.id).toBe("1");
    // and a freshly minted one round-trips too
    expect(verifyJwtToken(generateAccessToken(adminSeed, 1))?.id).toBe("1");
  });
});

describe("test harness (http)", () => {
  afterAll(async () => {
    await pool.end();
  });

  it("rejects an invalid token on a protected route", async () => {
    // Note: a request with no Authorization header would still pass because
    // getToken falls back to process.env.TEST_JWT_TOKEN (a dev convenience),
    // so we assert that a present-but-bogus bearer token is rejected.
    await request(app)
      .get(`${apiPath}/users/me`)
      .set("authorization", "Bearer not-a-real-token")
      .expect(401);
  });

  it("authenticates the seeded admin with TEST_JWT_TOKEN", async () => {
    expect(supertestConfig.token).toBeTruthy();
    const res = await request(app)
      .get(`${apiPath}/users/me`)
      .set("authorization", "Bearer " + supertestConfig.token)
      .expect(200);
    expect(res.body.id).toBe("1");
  });
});
