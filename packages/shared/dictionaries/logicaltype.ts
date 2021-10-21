import { EntityLogicalType } from "../enums";

export const actantLogicalTypeDict: {
  value: string;
  label: string;
  info?: string;
}[] = [
  {
    value: EntityLogicalType.Definite,
    label: "definite",
    info: "",
  },
  {
    value: EntityLogicalType.Indefinite,
    label: "indefinite",
    info: "",
  },
  {
    value: EntityLogicalType.Hypothetical,
    label: "hypothetical",
    info: "",
  },
  {
    value: EntityLogicalType.Generic,
    label: "generic",
    info: "",
  },
];
