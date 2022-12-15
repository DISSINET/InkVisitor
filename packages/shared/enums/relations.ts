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
  // Used in detail relations section => Preserves order (excludes Action types)
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
  // Used in tooltip => Preserves order
  export const TooltipTypes: Type[] = [
    Type.Superclass,
    Type.SuperordinateLocation,
    Type.Synonym,
    Type.ActionEventEquivalent,
    Type.Classification,
    Type.Identification,
  ];
}
