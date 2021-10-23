import Statement from "@models/statement";
import { Connection } from "rethinkdb-ts";
import { ConstraintableModel } from "./types";

class ConstraintsProvider {
  models: ConstraintableModel[] = [];

  constructor(models: ConstraintableModel[]) {
    this.models = models;
  }

  async check(db: Connection, actantId: string) {
    for (const model of this.models) {
      for (const constraint of model.constraints) {
        constraint.fetchAffected(db, actantId);
      }
    }
  }
}

export default new ConstraintsProvider([Statement]);
