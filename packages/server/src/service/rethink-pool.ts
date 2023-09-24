import { createPool, Pool } from "generic-pool";
import { RConnectionOptions } from "rethinkdb-ts";
import { Db } from "./rethink";

export default class DbPool {
  options: RConnectionOptions;
  pool: Pool<Db>;

  constructor(options: RConnectionOptions) {
    this.options = options;

    const factory = {
      create: this.create.bind(this),
      destroy: this.destroy.bind(this),
      validate: this.validate.bind(this),
    };

    this.pool = createPool<Db>(factory, { ...options, max: 0 });
  }

  acquire(): Promise<Db> {
    return this.pool.acquire();
  }

  release(instance: Db): Promise<void> {
    if (instance.lockInstance) {
      Db.mutex.unlock(instance.lockInstance);
    }
    return this.pool.release(instance);
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
    return instance.connection.open;
  }
}
