import { EntityEnums, RelationEnums } from ".";

export namespace EnumValidators {
  /**
   * Validates RelationEnums.Type value
   * @param input
   * @returns
   */
  export function IsValidRelationType(input: RelationEnums.Type): boolean {
    return (
      [
        RelationEnums.Type.Superclass,
        RelationEnums.Type.SuperordinateLocation,
        RelationEnums.Type.Synonym,
        RelationEnums.Type.Antonym,
        RelationEnums.Type.PropertyReciprocal,
        RelationEnums.Type.SubjectActant1Reciprocal,
        RelationEnums.Type.ActionEventEquivalent,
        RelationEnums.Type.Related,
        RelationEnums.Type.Classification,
        RelationEnums.Type.Identification,
        RelationEnums.Type.Holonym,
        RelationEnums.Type.Implication,
        RelationEnums.Type.SubjectSemantics,
        RelationEnums.Type.Actant1Semantics,
        RelationEnums.Type.Actant2Semantics,
      ].indexOf(input) !== -1
    );
  }

  /**
   * Validates EntityEnums.Class value
   * @param input
   * @returns
   */
  export function IsValidEntityClass(input: EntityEnums.Class): boolean {
    return (
      [
        EntityEnums.Class.Action,
        EntityEnums.Class.Territory,
        EntityEnums.Class.Statement,
        EntityEnums.Class.Resource,
        EntityEnums.Class.Person,
        EntityEnums.Class.Being,
        EntityEnums.Class.Group,
        EntityEnums.Class.Object,
        EntityEnums.Class.Concept,
        EntityEnums.Class.Location,
        EntityEnums.Class.Value,
        EntityEnums.Class.Event,
      ].indexOf(input) !== -1
    );
  }

  /**
   * Validates EntityEnums.Certainty value
   * @param input
   * @returns
   */
  export function IsValidEntityCertainty(
    input: EntityEnums.Certainty
  ): boolean {
    return (
      [
        EntityEnums.Certainty.AlmostCertain,
        EntityEnums.Certainty.Certain,
        EntityEnums.Certainty.Dubious,
        EntityEnums.Certainty.Empty,
        EntityEnums.Certainty.False,
        EntityEnums.Certainty.Possible,
        EntityEnums.Certainty.Probable,
      ].indexOf(input) !== -1
    );
  }
}
