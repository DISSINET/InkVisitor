import { Conn, storage } from "@service/storage";
import { userCacheKey } from "@models/user/user";
import { SETTINGS_ALL_CACHE_KEY } from "@models/setting/setting";
import { closeTestDb, openTestDb } from "../test/db";
import { startCacheInvalidators } from "./changefeedInvalidator";
import { cache } from "./ttlCache";
import { TABLE } from "./storage/names";
import { query } from "./storage/postgres/conn";
import { LISTENER_NAME, resetWatchers } from "./storage/postgres/invalidation";

/**
 * The PostgreSQL changefeed end to end: raw SQL on a session of its own stands
 * in for a job, a script or another API instance, and the triggers have to
 * carry its writes to the cache. Notifications arrive asynchronously, so every
 * expectation polls.
 */
const describePg = storage.kind === "postgres" ? describe : describe.skip;

const eventually = async (check: () => boolean): Promise<void> => {
  for (let i = 0; i < 100 && !check(); i++) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  expect(check()).toBe(true);
};

describePg("changefeed on postgres", () => {
  let conn: Conn;
  beforeAll(async () => {
    conn = await openTestDb();
  });
  afterAll(async () => {
    await closeTestDb(conn);
  });
  afterEach(async () => {
    await resetWatchers();
    cache.clear();
  });

  /** watches `table` and records "clear" or the id of each event */
  const probe = (table: string): string[] => {
    const events: string[] = [];
    storage.watch("probe", table, {
      onClear: () => events.push("clear"),
      onChange: (newVal, oldVal) => events.push(newVal?.id ?? oldVal?.id ?? "?"),
    });
    return events;
  };

  it("drops the cache entries a write from another session touches", async () => {
    const events = probe(TABLE.settings);
    startCacheInvalidators();
    await eventually(() => events.length === 1);
    cache.set(userCacheKey("1"), { id: "1" });
    cache.set(userCacheKey("2"), { id: "2" });
    cache.set(SETTINGS_ALL_CACHE_KEY, []);

    await query(conn, "UPDATE users SET doc = doc WHERE id = '1'");
    await eventually(() => cache.get(userCacheKey("1")) === undefined);
    expect(cache.get(userCacheKey("2"))).toEqual({ id: "2" });
    expect(cache.get(SETTINGS_ALL_CACHE_KEY)).toEqual([]);

    await query(conn, `INSERT INTO settings (doc) VALUES ('{"id": "feed-1", "value": 1}')`);
    await eventually(() => cache.get(SETTINGS_ALL_CACHE_KEY) === undefined);
    await query(conn, "TRUNCATE settings");
    await eventually(() => events.length === 3);
    expect(events).toEqual(["clear", "feed-1", "clear"]);
  });

  it("calls onClear after the listener reconnects and keeps following writes", async () => {
    const events = probe(TABLE.users);
    await eventually(() => events.length === 1);
    const killed = await query(
      conn,
      "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name = $1 AND datname = current_database()",
      [LISTENER_NAME]
    );
    expect(killed.rowCount).toBeGreaterThan(0);
    await eventually(() => events.length === 2);
    expect(events).toEqual(["clear", "clear"]);

    await query(conn, "UPDATE users SET doc = doc WHERE id = '1'");
    await eventually(() => events.length === 3);
    expect(events[2]).toBe("1");
  });

  it("does not follow a table without a change trigger", async () => {
    const events = probe(TABLE.entities);
    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(events).toEqual([]);
  });
});
