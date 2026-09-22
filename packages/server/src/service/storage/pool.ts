import { createPool, Pool, Options } from "generic-pool";
import { Db } from "./db";
import { storage } from "./instance";

export interface DbPoolOptions {
  max: number;
  acquireTimeoutMillis?: number;
  idleTimeoutMillis?: number;
}

/** Pool sizing from the environment, shared by the request and session pools. */
export const poolOptions: DbPoolOptions = {
  max: parseInt(process.env.DB_POOL_CONNECTIONS || "10") || 10,
  acquireTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
};

export default class DbPool {
  options: DbPoolOptions;
  pool: Pool<Db>;

  constructor(options: DbPoolOptions) {
    this.options = options;
    const factory = {
      create: this.create.bind(this),
      destroy: this.destroy.bind(this),
      validate: this.validate.bind(this),
    };

    const opts: Options = {
      max: options.max,
      min: 0,
      acquireTimeoutMillis: options.acquireTimeoutMillis || 10000,
      idleTimeoutMillis: options.idleTimeoutMillis || 30000,
      autostart: true,
      evictionRunIntervalMillis: 1000,
      numTestsPerEvictionRun: 3,
      testOnBorrow: true,
      // testOnReturn would re-ping a conn we just used successfully -
      // a wasted round-trip per request. testOnBorrow keeps the
      // stale-conn-in-pool safety net.
      testOnReturn: false,
    };

    this.pool = createPool<Db>(factory, opts);
  }

  async acquire(): Promise<Db> {
    return this.pool.acquire();
  }

  async release(instance: Db): Promise<void> {
    await this.pool.release(instance);
  }

  async end(): Promise<void> {
    await this.pool.drain();
    await this.pool.clear();
  }

  async create(): Promise<Db> {
    const instance = new Db();
    await instance.initDb();
    return instance;
  }

  async destroy(instance: Db): Promise<void> {
    return instance.close();
  }

  async validate(instance: Db): Promise<boolean> {
    // the driver's open flag can lag behind reality when the server has closed
    // the socket; a cheap round-trip is the only way to confirm the conn is
    // actually usable before handing it out
    if (!storage.isOpen(instance.connection)) {
      return false;
    }
    try {
      await storage.ping(instance.connection);
      return true;
    } catch {
      return false;
    }
  }
}
