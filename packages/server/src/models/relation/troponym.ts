import { RelationEnums } from "@shared/enums";
import Relation from "./relation";
import { Relation as RelationTypes } from "@shared/types";
import { IRequest } from "src/custom_typings/request";
import { nonenumerable } from "@common/decorators";
import Synonym from "./synonym";

export default class Troponym extends Relation implements RelationTypes.ITroponym {
  type: RelationEnums.Type.Troponym;
  entityIds: string[];

  @nonenumerable
  siblingRelations?: string[];

  constructor(data: Partial<RelationTypes.ITroponym>) {
    super(data);
    this.entityIds = data.entityIds as string[];
    this.type = RelationEnums.Type.Troponym;
  }

  /**
   * Test validity of the model
   * @returns 
   */
  isValid(): boolean {
    if (!super.isValid()) {
      return false;
    }

    return true;
  }

  /**
   * called before save operation - in troponyms, that would cover transitive dependency if relations:
   * A + B => troponym 1
   * B + C => troponym 2
   * then
   * New relation will be created which covers all of these ids
   * @param request 
   */
  async beforeSave(request: IRequest): Promise<void> {
    await new Synonym({}).findSiblings.call(this, request, RelationEnums.Type.Troponym)
  }

  /**
   * Takes care of identified sibling relations, see beforeSave for details
   * @param request 
   */
  async afterSave(request: IRequest): Promise<void> {
    if (this.siblingRelations && this.siblingRelations.length) {
      await Relation.deleteMany(request, this.siblingRelations)
    }
  }
}
