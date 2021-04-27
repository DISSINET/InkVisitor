import { IDbModel } from "./common";
import { r as rethink, Connection, WriteResult } from "rethinkdb-ts";
import { IStatement } from "@shared/types";
import { ActantType } from "@shared/enums";

export default class Actant implements IDbModel {
  static table = "actants";

  id?: string;

  async save(db: Connection | undefined): Promise<WriteResult> {
    const result = await rethink
      .table(Actant.table)
      .insert({ ...this, id: undefined })
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
}
