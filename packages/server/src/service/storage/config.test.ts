import { adapterFromEnv, pgConfigFromEnv, rethinkConfigFromEnv } from "./config";

describe("storage config", () => {
  it("defaults to rethinkdb and accepts postgres", () => {
    expect(adapterFromEnv({})).toBe("rethinkdb");
    expect(adapterFromEnv({ DB_ADAPTER: "" })).toBe("rethinkdb");
    expect(adapterFromEnv({ DB_ADAPTER: "rethinkdb" })).toBe("rethinkdb");
    expect(adapterFromEnv({ DB_ADAPTER: "postgres" })).toBe("postgres");
  });

  it("rejects any other adapter name", () => {
    expect(() => adapterFromEnv({ DB_ADAPTER: "mysql" })).toThrow(/DB_ADAPTER/);
  });

  it("reads the RethinkDB settings from DB_*", () => {
    expect(
      rethinkConfigFromEnv({ DB_HOST: "h", DB_PORT: "1", DB_NAME: "n", DB_AUTH: "p" })
    ).toEqual({ host: "h", port: 1, db: "n", password: "p" });
    expect(rethinkConfigFromEnv({}).port).toBe(28015);
  });

  it("reads the PostgreSQL settings from PG_* and the database from DB_NAME", () => {
    expect(
      pgConfigFromEnv({ PG_HOST: "h", PG_PORT: "2", PG_USER: "u", PG_PASS: "p", DB_NAME: "n" })
    ).toEqual({ host: "h", port: 2, user: "u", password: "p", database: "n" });
    expect(pgConfigFromEnv({}).port).toBe(5432);
  });
});
