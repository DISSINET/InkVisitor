import Actant from "@models/actant";
import { Connection } from "rethinkdb-ts";

export interface Constraint {
  name: string;
  fetchAffected: (db: Connection, actantId: string) => Promise<Actant[]>;
  handleChange: (
    db: Connection,
    actantIdToUnlink: string,
    actant: Actant
  ) => Promise<boolean>;
}

export interface ConstraintableModel {
  constraints: Constraint[];
}
