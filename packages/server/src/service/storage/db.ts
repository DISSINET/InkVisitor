import { Mutex } from "../mutex";
import { storage } from "./instance";
import { Conn } from "./types";

/**
 * A dedicated connection: opened once, used until closed. The request pool
 * hands these out; scripts and tests open their own.
 */
export class Db {
  // Global write mutex; owned here so DbHandle (per-request wrapper) can use it.
  static mutex = new Mutex();

  connection: Conn = {} as Conn;
  private opened = false;

  constructor() {
    storage.assertConfigured();
  }

  async initDb(): Promise<void> {
    this.connection = await storage.openConnection();
    this.opened = true;
  }

  async close(): Promise<void> {
    if (this.opened) {
      this.opened = false;
      await storage.closeConnection(this.connection, { noreplyWait: true });
    }
  }
}
