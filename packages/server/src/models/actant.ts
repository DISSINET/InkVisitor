import { IDbModel, UnknownObject, fillFlatObject } from "./common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IStatement } from "@shared/types";
import { ActantType, UserRoleMode } from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";
import User from "./user";
import Statement from "./statement";
import emitter from "./events/emitter";
import { EventTypes } from "./events/types";

export default class Actant implements IDbModel {
  static table = "actants";

  id?: string;
  language: string[] = ["eng"];

  async save(db: Connection | undefined): Promise<WriteResult> {
    const result = await rethink
      .table(Actant.table)
      .insert({ ...this, id: this.id || undefined })
      .run(db);

    if (result.generated_keys) {
      this.id = result.generated_keys[0];
    }

    return result;
  }

  update(
    db: Connection | undefined,
    updateData: Record<string, unknown>
  ): Promise<WriteResult> {
    return rethink.table(Actant.table).get(this.id).update(updateData).run(db);
  }

  async delete(db: Connection | undefined): Promise<WriteResult> {
    if (!this.id) {
      throw new InternalServerError(
        "delete called on actant with undefined id"
      );
    }

    if (db) {
      emitter.emit(EventTypes.BEFORE_ACTANT_DELETE, db, this.id);
    }

    const result = await rethink
      .table(Actant.table)
      .get(this.id)
      .delete()
      .run(db);

    if (db) {
      emitter.emit(EventTypes.AFTER_ACTANT_DELETE, db, this.id);
    }

    return result;
  }

  isValid(): boolean {
    return true;
  }

  canBeViewedByUser(user: User): boolean {
    return true;
  }

  canBeEditedByUser(user: User): boolean {
    return true;
  }

  canBeDeletedByUser(user: User): boolean {
    return true;
  }

  static determineOrder(want: number, sibl: Record<number, unknown>): number {
    const sortedOrders: number[] = Object.keys(sibl)
      .map((k) => parseFloat(k))
      .sort((a, b) => a - b);
    let out = -1;

    if (want === undefined) {
      out = sortedOrders.length ? sortedOrders[sortedOrders.length - 1] + 1 : 0;
    } else if (sibl[want]) {
      // if there is a conflict - order number already exist
      for (let i = 0; i < sortedOrders.length; i++) {
        if (sortedOrders[i] === want) {
          if (sortedOrders.length === i + 1) {
            // conflict occured on the biggest number - use closest bigger free integer
            const ceiled = Math.ceil(sortedOrders[i]);
            out = ceiled === sortedOrders[i] ? ceiled + 1 : ceiled;
            break;
          }
          // new number would be slightly bigger than conflicted and slightly lower than the bigger one
          out = sortedOrders[i] + (sortedOrders[i + 1] - sortedOrders[i]) / 2;
          break;
        }
      }
    } else {
      // all good
      out = want;
      // less than zero -> zero optional fix
      if (out < 0 && (sortedOrders.length === 0 || sortedOrders[0] > 0)) {
        out = 0;
      }
    }

    return out;
  }
}
