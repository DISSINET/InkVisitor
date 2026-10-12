import { rethinkConfigFromEnv } from "./config";

describe("storage config", () => {
  it("reads the RethinkDB settings from DB_*", () => {
    expect(
      rethinkConfigFromEnv({ DB_HOST: "h", DB_PORT: "1", DB_NAME: "n", DB_AUTH: "p" })
    ).toEqual({ host: "h", port: 1, db: "n", password: "p" });
    expect(rethinkConfigFromEnv({}).port).toBe(28015);
  });
});
