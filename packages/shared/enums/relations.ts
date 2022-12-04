export namespace RelationEnums {
  export enum Type {
    Unknown = "",
    Superclass = "SCL",
    SuperordinateLocation = "SOL",
    Synonym = "SYN",
    Antonym = "ANT",
    Holonym = "HOL",
    PropertyReciprocal = "PRR",
    SubjectActant1Reciprocal = "SAR",
    ActionEventEquivalent = "AEE",
    Related = "REL",
    Classification = "CLA",
    Identification = "IDE",
    Implication = "IMP",
    SubjectSemantics = "SUS",
    Actant1Semantics = "A1S",
    Actant2Semantics = "A2S",
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
    Type.Related, 
    Type.Classification, 
    Type.Identification, 
    Type.Implication,
    Type.SubjectSemantics, 
    Type.Actant1Semantics, 
    Type.Actant2Semantics
  ]
}
