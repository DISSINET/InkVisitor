import { EntityEnums, RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";

import { nonenumerable } from "@common/decorators";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "../../custom_typings/request";

export default class Synonym
  extends Relation
  implements RelationTypes.ISynonym
{
  type: RelationEnums.Type.Synonym;
  entityIds: string[];

  @nonenumerable
  siblingRelations?: string[];

  constructor(data: Partial<RelationTypes.ISynonym>) {
    super(data);
    this.entityIds = data.entityIds as string[];
    this.type = RelationEnums.Type.Synonym;
  }

  async findSiblings(
    request: IRequest,
    type: RelationEnums.Type
  ): Promise<void> {
    let toInclude: string[] = this.entityIds;
    this.siblingRelations = [];

    for (const entityId of this.entityIds) {
      const relations = await Relation.findForEntity(
        request.db.connection,
        entityId,
        type
      );
      for (const relation of relations) {
        if (this.id !== relation.id) {
          toInclude = toInclude.concat(relation.entityIds);
          this.siblingRelations.push(relation.id);
        }
      }
    }

    // sibling relations will be removed in afterSave
    this.siblingRelations = [...new Set(this.siblingRelations)].sort();

    // new cloud should contain all entities from each sibling relation + this relation
    this.entityIds = [...new Set(toInclude)].sort();

    // list of entity ids could have changed, this cached field needs to be reset
    this.entities = undefined;
  }

  /**
   * called before save operation - in synonyms, that would cover transitive dependency if relations:
   * A + B => synonym 1
   * B + C => synonym 2
   * then
   * New relation will be created which covers all of these ids A + B + C
   * @param request
   */
  async beforeSave(request: IRequest): Promise<void> {
    await this.findSiblings(request, RelationEnums.Type.Synonym);
    await super.beforeSave(request);
  }

  /**
   * Takes care of identified sibling relations, see beforeSave for details
   * @param request
   */
  async afterSave(request: IRequest): Promise<void> {
    if (this.siblingRelations) {
      await Relation.deleteMany(request, this.siblingRelations);
    }
  }

  static async getSynonymForwardConnections(
    conn: Connection,
    entityId: string,
    asClass: EntityEnums.Class
  ): Promise<RelationTypes.IConnection<RelationTypes.ISynonym>[]> {
    let out: RelationTypes.IConnection<RelationTypes.ISynonym>[] = [];

    if (
      asClass === EntityEnums.Class.Concept ||
      asClass === EntityEnums.Class.Action
    ) {
      out = await Relation.findForEntity(
        conn,
        entityId,
        RelationEnums.Type.Synonym
      );
      const mapped: Record<
        string,
        RelationTypes.IConnection<RelationTypes.ISynonym>
      > = {};
      for (const relation of out) {
        mapped[relation.id] = relation;
      }
      out = Object.values(mapped);
    }

    return out;
  }
}
