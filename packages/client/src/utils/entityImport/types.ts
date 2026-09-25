import { RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation } from "@inkvisitor/shared/types";

export const MAX_IMPORT_ENTITIES = 10;

/**
 * One line of feedback on the input. As an error it blocks the import; as a
 * note it reports what the import changed on its own (a dropped edge, a merged
 * duplicate, an ignored field), so nothing is altered without the user seeing it.
 */
export interface ImportIssue {
  // 1-based position of the entity in the input
  entityIndex?: number;
  label?: string;
  // field path inside the entity, e.g. "props[1].type.entityId"
  path?: string;
  message: string;
}

/** An entity of the input, filled with defaults and ready to be created. */
export interface ImportEntity {
  // 1-based position in the input
  index: number;
  entity: IEntity;
  // the "relations" list as written, checked by the relation validators
  rawRelations: unknown[];
}

/** A relation of the input that passed the shape checks. */
export interface ImportRelationItem {
  ownerIndex: number;
  // "relations[0]" inside the owning entity
  path: string;
  relation: Relation.IRelation;
}

/** Read access to the database the validators need. */
export interface ImportDataSource {
  getEntities: (entityIds: string[]) => Promise<IEntity[]>;
  // for asymmetrical types only the relations where the entity is entityIds[0]
  getForwardRelations: (
    entityId: string,
    type: RelationEnums.Type
  ) => Promise<Relation.IRelation[]>;
}

export interface ImportPlan {
  // creation order: every territory comes after its parent territory
  entities: IEntity[];
  relations: Relation.IRelation[];
  // database entities the input refers to, for showing them in the preview
  existingEntities: Record<string, IEntity>;
}

export interface ImportValidation {
  errors: ImportIssue[];
  notes: ImportIssue[];
  // set only when there are no errors
  plan: ImportPlan | null;
}
