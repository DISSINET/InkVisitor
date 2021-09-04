import { EntityLogicalType } from "../enums";

export const actantLogicalTypeDict: {
  value: string;
  label: string;
  info?: string;
}[] = [
  {
    value: EntityLogicalType.Type1,
    label: "definite",
    info: "",
  },
  {
    value: EntityLogicalType.Type2,
    label: "indefinite",
    info: "",
  },
  {
    value: EntityLogicalType.Type3,
    label: "hypothetical",
    info: "",
  },
];
