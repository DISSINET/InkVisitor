import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IDbModel } from "./common";

export default class Aco implements IDbModel {
  id?: string;
  controller: string;
  method: string;

  static table = "acl_acos";

  constructor(data: Record<string, any>) {
    this.controller = data.controller;
    this.method = data.method;
  }

  async save(dbInstance: Connection | undefined): Promise<WriteResult> {
    const result = await rethink
      .table(Aco.table)
      .insert({ ...this, id: this.id || undefined })
      .run(dbInstance);

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result;
  }

  update(
    dbInstance: Connection | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    return rethink
      .table(Aco.table)
      .get(this.id)
      .update(updateData)
      .run(dbInstance);
  }

  delete(dbInstance: Connection | undefined): Promise<WriteResult> {
    return rethink.table(Aco.table).get(this.id).delete().run(dbInstance);
  }

  isValid(): boolean {
    return true;
  }

  static async FindByPath(
    dbInstance: Connection | undefined,
    ctrlName: string,
    method: string
  ): Promise<Aco> {
    const data = await rethink
      .table("actants")
      .filter({
        controller: ctrlName,
        method: method,
      })
      .run(dbInstance);

    return new Aco(data);
  }
}
