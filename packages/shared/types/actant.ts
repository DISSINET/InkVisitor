export enum ActantType {
  Territory = "T",
  Statement = "S",
  Resource = "R",
  Person = "P",
  Group = "G",
  Object = "O",
  Concept = "C",
  Location = "L",
  Value = "V",
  Event = "E",
}

export interface IActant {
  id: string;
  class: ActantType;
  label: string;
  data: object;
}
