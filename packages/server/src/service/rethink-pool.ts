import { createPool, Pool } from "generic-pool";
import { RConnectionOptions } from "rethinkdb-ts";
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

    this.pool = createPool<Db>(factory, { ...options });
  }

  async acquire(): Promise<Db> {
    console.log(
      `Acquiring db connection, available=${this.pool.available}, size=${this.pool.size}`
    );
    const db = this.pool.acquire();
    console.log(
      `Acquired db connection, available=${this.pool.available}, size=${this.pool.size}`
    );
    return db;
  }

  async release(instance: Db): Promise<void> {
    if (instance.lockAwaiter) {
      Db.mutex.unlock(instance.lockAwaiter);
    }
    console.log(
      `Releasing db connection, available=${this.pool.available}, size=${this.pool.size}`
    );
    await this.pool.release(instance);
    console.log(
      `Released db connection, available=${this.pool.available}, size=${this.pool.size}`
    );
  }

  async end(): Promise<void> {
    await this.pool.drain();
    await this.pool.clear();
  }

  async create(): Promise<Db> {
    console.log(
      `Creating db connection, available=${this.pool.available}, size=${this.pool.size}`
    );
    const instance = new Db();
    await instance.initDb();
    return instance;
  }

  async destroy(instance: Db): Promise<void> {
    console.log(
      `Destroying db connection, used=${this.pool.size}/${this.pool.max}`
    );
    return instance.close();
  }

  async validate(instance: Db): Promise<boolean> {
    return instance.connection.open;
  }
}
