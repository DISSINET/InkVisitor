import { storage } from "../service/storage";
import { getTestDbName } from "./db";

/**
 * Jest globalTeardown. Drops the ephemeral test database created in
 * globalSetup. Tolerant of a missing DB / unreachable server (the run may have
 * skipped provisioning), so teardown never turns a green run red.
 */
export default async function globalTeardown(): Promise<void> {
  let dbName: string;
  try {
    dbName = getTestDbName();
  } catch {
    return;
  }

  try {
    await storage.dropDatabase(dbName);
  } catch {
    return;
  }
}
