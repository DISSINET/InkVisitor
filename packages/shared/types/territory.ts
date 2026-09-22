import { EntityEnums } from "../enums";
import { IEntity } from "./entity";

export interface ITerritory extends IEntity {
  class: EntityEnums.Class.Territory;
  data: ITerritoryData;
}

export interface ITerritoryData {
  protocol?: ITerritoryProtocol;
  parent: IParentTerritory | false; // TODO should be optional instead of false
  validations?: ITerritoryValidation[];
}

export interface IParentTerritory {
  territoryId: string;
  order: number;
}

export interface ITerritoryProtocol {
  project: string;
  dataCollectionMethods: string[]; // C class entities
  description: string;
  guidelines: string[]; // R class entities
  detailedProtocols: string[]; // R class entities
  startDate: string; // V class entity
  endDate: string; // V class entity
  relatedDataPublications: string[]; // R class entities
}

/**
 * Rule fields whose entities can stand for more than themselves. Each one
 * follows one downward path: entityClassifications, propType and (under a
 * Classification tie) allowedEntities follow subclasses, entitySOEs and (under
 * a Reference tie) allowedEntities follow subordinate entities.
 */
export type EValidationExpansionField =
  | "entityClassifications"
  | "entitySOEs"
  | "propType"
  | "allowedEntities";

/**
 * Whether a rule field accepts entities beyond the ones picked in it:
 * equivalents are synonyms, identifications and action-event equivalents;
 * subordinates are everything below on the field's own path, all levels.
 */
export interface ITerritoryValidationExpansion {
  equivalents?: boolean;
  subordinates?: boolean;
}

/**
 * The downward path a rule field stands for. Subclasses is the inverse
 * Superclass path, Subordinates the inverse SuperordinateEntity path (plus, for
 * a Territory, its child Territories).
 */
export enum EValidationExpansionKind {
  Equivalents = "EQ",
  Subclasses = "SCL",
  Subordinates = "SOE",
}

/**
 * Which downward path a field follows. A Concept-valued field follows
 * subclasses, an entity-valued field subordinates; allowedEntities is the one
 * field whose targets change with the tie - Concepts under Classification,
 * Resources under Reference. Null where the field takes no expansion, which is
 * the property value list: it holds entities of any class and carries no
 * checkboxes.
 *
 * Shared so that the check, the rule's sentence and the warning text all read
 * the same table.
 */
export const validationExpansionKind = (
  field: EValidationExpansionField,
  tieType: EProtocolTieType
): EValidationExpansionKind | null => {
  if (field === "entitySOEs") {
    return EValidationExpansionKind.Subordinates;
  }
  if (field === "allowedEntities") {
    if (tieType === EProtocolTieType.Reference) {
      return EValidationExpansionKind.Subordinates;
    }
    if (tieType === EProtocolTieType.Property) {
      return null;
    }
  }
  return EValidationExpansionKind.Subclasses;
};

export interface ITerritoryValidation {
  active?: boolean;
  territoryId?: string;
  entityClasses?: EntityEnums.Class[];
  entityClassifications?: string[];
  entitySOEs?: string[];
  entityLanguages?: EntityEnums.Language[];
  entityStatuses?: EntityEnums.Status[];

  tieType: EProtocolTieType; // default is property
  propType?: string[]; // relevant only in case of Property is selected as a tie
  allowedClasses?: EntityEnums.Class[]; // not relevant if allowedEntities is set
  allowedEntities?: string[]; //
  detail: string;

  // absent on a rule that accepts only the entities picked in it
  expansions?: Partial<
    Record<EValidationExpansionField, ITerritoryValidationExpansion>
  >;
}

export enum EProtocolTieType {
  Property = "Property",
  Classification = "Classification",
  Reference = "Reference",
}
