import { IDbModel } from "./common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IStatement } from "@shared/types";
import { ActantType, UserRole, UserRoleMode } from "@shared/enums";
import { InternalServerError } from "@shared/types/errors";
import User from "./user";

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
      throw new Error("delete called on actant with undefined id");
    }

    for (const st of await this.getDependentStatements(db)) {
      const actant = new Actant();
      actant.id = st.id;

      let indexToRemove = st.data.actants.findIndex(
        (a) => a.actant === this.id
      );

      if (indexToRemove !== -1) {
        st.data.actants.splice(indexToRemove, 1);
      } else {
        indexToRemove = st.data.props.findIndex((a) => a.origin === this.id);
        if (indexToRemove !== -1) {
          st.data.props.splice(indexToRemove, 1);
        }
      }

      // if neither works
      if (indexToRemove === -1) {
        throw new Error(
          "getDependentStatements returned non-dependent statement"
        );
      }

      await actant.update(db, { data: st.data });
    }

    return rethink.table(Actant.table).get(this.id).delete().run(db);
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
