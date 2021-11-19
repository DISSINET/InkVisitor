import { IDbModel, UnknownObject, fillFlatObject, fillArray } from "./common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IStatement, IActant } from "@shared/types";
import {
  ActantStatus,
  ActantType,
  Language,
  UserRole,
  UserRoleMode,
} from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";
import User from "./user";
import emitter from "./events/emitter";
import { EventTypes } from "./events/types";

export default class Actant implements IActant, IDbModel {
  static table = "actants";

  id: string = "";
  class: ActantType = ActantType.Unknown;
  data: any = undefined;
  label: string = "";
  detail: string = "";
  status: ActantStatus = ActantStatus.Pending;
  language: string[] = [Language.Latin];
  notes: string[] = [];

  constructor(data: UnknownObject) {
    if (!data) {
      return;
    }

    fillFlatObject(this, { ...data, data: undefined });
    fillArray(this.language, String, data.language);
    fillArray(this.notes, String, data.notes);
  }

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
      await emitter.emit(EventTypes.BEFORE_ACTANT_DELETE, db, this.id);
    }

    const result = await rethink
      .table(Actant.table)
      .get(this.id)
      .delete()
      .run(db);

    if (result.deleted && db) {
      await emitter.emit(EventTypes.AFTER_ACTANT_DELETE, db, this.id);
    }

    return result;
  }

  isValid(): boolean {
    return true;
  }

  canBeViewedByUser(user: User): boolean {
    return true;
  }

  canBeCreatedByUser(user: User): boolean {
    return true;
  }

  canBeEditedByUser(user: User): boolean {
    return true;
  }

  canBeDeletedByUser(user: User): boolean {
    return true;
  }

  /**
   * getUserRoleMode returns derived user role mode for this instance.
   * By default this method counts with default right to view - helps with performance.
   * @param user
   * @returns
   */
  getUserRoleMode(user: User): UserRoleMode {
    if (user.role === UserRole.Admin) {
      return UserRoleMode.Admin;
    }

    if (this.canBeEditedByUser(user)) {
      return UserRoleMode.Write;
    }

    return UserRoleMode.Read;
  }

  getDependentStatements(db: Connection | undefined): Promise<IStatement[]> {
    return rethink
      .table(Actant.table)
      .filter({ class: ActantType.Statement })
      .filter((row: any) => {
        return rethink.or(
          row("data")("actants").contains((actantElement: any) =>
            actantElement("actant").eq(this.id)
          ),
          row("data")("props").contains((actantElement: any) =>
            actantElement("origin").eq(this.id)
          )
        );
      })
      .run(db);
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
          // conflict occured on the biggest number - use closest bigger free integer
          if (sortedOrders.length === i + 1) {
            const ceiled = Math.ceil(sortedOrders[i]);
            out = ceiled === sortedOrders[i] ? ceiled + 1 : ceiled;
            break;
          }

          // new number would be somewhere behind the wanted one(i) and before the next one(i+1)
          out = sortedOrders[i] + (sortedOrders[i + 1] - sortedOrders[i]) / 2;
          if (!sibl[Math.round(out)]) {
            out = Math.round(out);
          }

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
