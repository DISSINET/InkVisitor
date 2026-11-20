import { EntityEnums, EnumValidators, RelationEnums } from "@inkvisitor/shared/enums";
import { Relation as RelationTypes } from "@inkvisitor/shared/types";
import { Conn } from "@service/storage";
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

  /**
   * Builds the identification tree of an entity, following only Certain
   * relations deeper. Identifications can form cycles (A=B, B=C, C=A), so a
   * branch stops at an entity already on its own path; sibling branches are
   * independent, so every direct identification stays a top-level connection.
   * @param ancestorIds entities on the path from the root down to entityId
   */
  static async getIdentificationForwardConnections(
    conn: Conn,
    entityId: string,
    maxNestLvl: number,
    nestLvl: number,
    ancestorIds: string[]
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
    const path = [...ancestorIds, entityId];

    for (const relation of relations) {
      const relatedEntityId =
        relation.entityIds[entityId === relation.entityIds[0] ? 1 : 0];

      if (path.includes(relatedEntityId)) {
        continue;
      }

      const connection: RelationTypes.IConnection<RelationTypes.IIdentification> =
        {
          ...relation,
          subtrees: [],
        };

      if (relation.certainty === EntityEnums.Certainty.Certain) {
        connection.subtrees =
          await Identification.getIdentificationForwardConnections(
            conn,
            relatedEntityId,
            maxNestLvl,
            nestLvl + 1,
            path
          );
      }

      out.push(connection);
    }

    return out;
  }
}
