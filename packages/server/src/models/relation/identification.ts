import { EntityEnums, RelationEnums } from "@shared/enums";
import { EnumValidators } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { ModelNotValidError } from "@shared/types/errors";
import { Connection } from "rethinkdb-ts";

export default class Identification extends Relation implements RelationTypes.IIdentification {
  certainty: EntityEnums.Certainty;
  type: RelationEnums.Type.Identification;
  entityIds: [string, string];

  constructor(data: Partial<RelationTypes.IIdentification>) {
    super(data);
    this.certainty = data.certainty as EntityEnums.Certainty;
    this.entityIds = data.entityIds as [string, string];
    this.type = RelationEnums.Type.Identification;
  }

  /**
   * Test validity of the model
   * @returns 
   */
  isValid(): boolean {
    if (!super.isValid()) {
      return false;
    }

    if (!EnumValidators.IsValidEntityCertainty(this.certainty)) {
      return false;
    }

    return true;
  }

  static async getIdentificationForwardConnections(
    conn: Connection,
    entityId: string,
    requiredCertainty: EntityEnums.Certainty,
    maxNestLvl: number,
    nestLvl: number
  ): Promise<RelationTypes.IConnection<RelationTypes.IIdentification>[]> {
    const out: RelationTypes.IConnection<RelationTypes.IIdentification>[] = [];

    if (nestLvl > maxNestLvl) {
      return out;
    }

    let relations: RelationTypes.IIdentification[] = await Relation.getForEntity(
      conn,
      entityId,
      RelationEnums.Type.Identification,
    );
    let thresholdReached = false;

    if (requiredCertainty !== EntityEnums.Certainty.Empty) {
      // if non-empty certainty, then some lvl of certainty needs to be respected
      relations = relations.filter(
        (r) => r.certainty === EntityEnums.Certainty.Certain
      );
    } else {
      // empty certainty will end the search below
      thresholdReached = true;
    }

    for (const relation of relations) {
      const subparentId = relation.entityIds[1];
      const connection: RelationTypes.IConnection<RelationTypes.IIdentification> =
      {
        ...relation,
        subtrees: [],
      };

      if (!thresholdReached) {
        // either continue with Certain or use Empty
        const nextThreshold =
          relation.certainty === EntityEnums.Certainty.Certain
            ? EntityEnums.Certainty.Certain
            : EntityEnums.Certainty.Empty;
        connection.subtrees = await Identification.getIdentificationForwardConnections(
          conn,
          subparentId,
          nextThreshold,
          maxNestLvl,
          nestLvl + 1
        );
      }

      out.push(connection);
    }

    return out;
  };

}
