import { r } from "rethinkdb-ts";
import { Db } from "@service/rethink";
import { generateAccessToken, verifyJwtToken } from "@common/auth";
import { adminSeed } from "./fixtures";

/**
 * Smoke test for the test harness itself (globalSetup/globalTeardown + setup.ts).
 * Proves the suite runs against the provisioned ephemeral DB, that the schema
 * and admin user are in place, and that a minted token round-trips through the
 * real auth verifier. HTTP-level auth is covered by harness.http.smoke.test.ts.
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
    const decoded = verifyJwtToken(process.env.TEST_JWT_TOKEN as string);
    expect(decoded).toBeTruthy();
    expect(decoded?.id).toBe("1");

    // and a freshly minted one round-trips too
    const fresh = generateAccessToken(adminSeed, 1);
    expect(verifyJwtToken(fresh)?.id).toBe("1");
  });
});
