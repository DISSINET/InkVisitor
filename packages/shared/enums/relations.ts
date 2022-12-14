export namespace RelationEnums {
  export enum Type {
    Superclass = "SCL",
    SuperordinateLocation = "SOL",
    Synonym = "SYN",
    Antonym = "ANT",
    Holonym = "HOL",
    PropertyReciprocal = "PRR",
    SubjectActant1Reciprocal = "SAR",
    ActionEventEquivalent = "AEE",
    Classification = "CLA",
    Identification = "IDE",
    Implication = "IMP",
    SubjectSemantics = "SUS",
    Actant1Semantics = "A1S",
    Actant2Semantics = "A2S",
    Related = "REL",
  }
  // All types to filter by entityClass, also preserves order
  export const AllTypes: Type[] = [
    Type.Superclass,
    Type.SuperordinateLocation,
    Type.Synonym,
    Type.Antonym,
    Type.Holonym,
    Type.PropertyReciprocal,
    Type.SubjectActant1Reciprocal,
    Type.ActionEventEquivalent,
    Type.Classification,
    Type.Identification,
    Type.Implication,
    Type.SubjectSemantics,
    Type.Actant1Semantics,
    Type.Actant2Semantics,
    Type.Related,
  ];
  export const EntityDetailTypes: Type[] = [
    Type.Superclass,
    Type.SuperordinateLocation,
    Type.Synonym,
    Type.Antonym,
    Type.Holonym,
    Type.PropertyReciprocal,
    Type.SubjectActant1Reciprocal,
    Type.ActionEventEquivalent,
    Type.Classification,
    Type.Identification,
    Type.Implication,
    Type.Related,
  ];
  export const ActionTypes: Type[] = [
    Type.SubjectSemantics,
    Type.Actant1Semantics,
    Type.Actant2Semantics,
  ];
  // Tooltip types to filter by entityClass, also preserves order
  export const TooltipTypes: Type[] = [
    Type.Superclass,
    Type.SuperordinateLocation,
    Type.Synonym,
    Type.ActionEventEquivalent,
    Type.Classification,
    Type.Identification,
  ];
}
