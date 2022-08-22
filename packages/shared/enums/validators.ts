import { EntityClass, RelationType } from ".";

/**
 * Validates RelationType value
 * @param input 
 * @returns 
 */
 export function isValidRelationType(input: RelationType): boolean {
    return (
      [
        RelationType.Superclass,
        RelationType.SuperordinateLocation,
        RelationType.Synonym,
        RelationType.Antonym,
        RelationType.Troponym,
        RelationType.PropertyReciprocal,
        RelationType.SubjectActantReciprocal,
        RelationType.ActionEventEquivalent,
        RelationType.Related,
        RelationType.Classification,
        RelationType.Identification,
      ].indexOf(input) !== -1
    );
  }

  /**
   * Validates EntityClass value
   * @param input 
   * @returns 
   */
  export function isValidEntityClass(input: EntityClass): boolean {
    return (
      [
        EntityClass.Action,
        EntityClass.Territory,
        EntityClass.Statement,
        EntityClass.Resource,
        EntityClass.Person,
        EntityClass.Group,
        EntityClass.Object,
        EntityClass.Concept,
        EntityClass.Location,
        EntityClass.Value,
        EntityClass.Event,
      ].indexOf(input) !== -1
    );
  }
  