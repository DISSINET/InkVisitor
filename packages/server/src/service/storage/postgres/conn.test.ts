import { Conn, storage } from "@service/storage";
import { closeTestDb, openTestDb } from "../../../test/db";
import { query } from "./conn";

const describePg = storage.kind === "postgres" ? describe : describe.skip;

describePg("openConnection", () => {
  let conn: Conn;
  beforeAll(async () => {
    conn = await openTestDb();
  });
  afterAll(async () => {
    await closeTestDb(conn);
  });

  it("gives up waiting for a lock before the request times out", async () => {
    const { rows } = await query(conn, "SHOW lock_timeout");
    expect(rows[0].lock_timeout).toBe("10s");
  });
});
