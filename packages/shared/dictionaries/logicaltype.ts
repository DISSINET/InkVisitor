import { EntityEnums } from "../enums";

export const actantLogicalTypeDict: {
  value: string;
  label: string;
  info?: string;
}[] = [
    {
      value: EntityEnums.LogicalType.Definite,
      label: "definite",
      info: "",
    },
    {
      value: EntityEnums.LogicalType.Indefinite,
      label: "indefinite",
      info: "",
    },
    {
      value: EntityEnums.LogicalType.Hypothetical,
      label: "hypothetical",
      info: "",
    },
    {
      value: EntityEnums.LogicalType.Generic,
      label: "generic",
      info: "",
    },
  ];
