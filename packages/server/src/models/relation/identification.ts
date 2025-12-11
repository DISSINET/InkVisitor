import { EntityEnums, EnumValidators, RelationEnums } from "@shared/enums";
import { Relation as RelationTypes } from "@shared/types";
import { Connection } from "rethinkdb-ts";
import Relation from "./relation";

export default class Identification
  extends Relation
  implements RelationTypes.IIdentification
{
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
    maxNestLvl: number,
    nestLvl: number,
    processedRelations: string[]
  ): Promise<RelationTypes.IConnection<RelationTypes.IIdentification>[]> {
    const out: RelationTypes.IConnection<RelationTypes.IIdentification>[] = [];

    if (nestLvl > maxNestLvl) {
      return out;
    }

    const relations: RelationTypes.IIdentification[] =
      await Relation.findForEntities(
        conn,
        [entityId],
        RelationEnums.Type.Identification
      );

    for (const relation of relations) {
      const relatedEntityId =
        relation.entityIds[entityId === relation.entityIds[0] ? 1 : 0];

      if (!processedRelations.includes(relation.id)) {
        const connection: RelationTypes.IConnection<RelationTypes.IIdentification> =
          {
            ...relation,
            subtrees: [],
          };
        processedRelations.push(relation.id);

        if (relation.certainty === EntityEnums.Certainty.Certain) {
          connection.subtrees =
            await Identification.getIdentificationForwardConnections(
              conn,
              relatedEntityId,
              maxNestLvl,
              nestLvl + 1,
              processedRelations
            );
        }

        out.push(connection);
      }
    }

    return out;
  }
}
