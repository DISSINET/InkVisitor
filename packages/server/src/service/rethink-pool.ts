import { createPool, Pool, Options } from "generic-pool";
import { r as rethink, RConnectionOptions } from "rethinkdb-ts";
import { Db } from "./rethink";

export default class DbPool {
  options: RConnectionOptions;
  pool: Pool<Db>;

  constructor(options: RConnectionOptions & { max: number }) {
    this.options = options;
    const factory = {
      create: this.create.bind(this),
      destroy: this.destroy.bind(this),
      validate: this.validate.bind(this),
    };

    const poolOptions: Options = {
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

    this.pool = createPool<Db>(factory, poolOptions);
  }

  async acquire(): Promise<Db> {
    //console.log(
    //  `Acquiring db connection, available=${this.pool.available}, size=${this.pool.size}`
    //);
    const db = await this.pool.acquire();
    //console.log(
    //  `Acquired db connection, available=${this.pool.available}, size=${this.pool.size}`
    //);
    return db;
  }

  async release(instance: Db): Promise<void> {
    await this.pool.release(instance);
  }

  async end(): Promise<void> {
    await this.pool.drain();
    await this.pool.clear();
  }

  async create(): Promise<Db> {
    //console.log(
    //  `Creating db connection, available=${this.pool.available}, size=${this.pool.size}`
    //);
    const instance = new Db();
    await instance.initDb();
    return instance;
  }

  async destroy(instance: Db): Promise<void> {
    //console.log(
    //  `Destroying db connection, used=${this.pool.size}/${this.pool.max}`
    //);
    return instance.close();
  }

  async validate(instance: Db): Promise<boolean> {
    // `connection.open` is a driver-side flag that can lag behind reality when
    // the server has closed the socket. A cheap round-trip is the only way to
    // confirm the conn is actually usable before handing it out.
    if (!instance.connection.open) {
      return false;
    }
    try {
      await rethink.expr(1).run(instance.connection);
      return true;
    } catch {
      return false;
    }
  }
}
