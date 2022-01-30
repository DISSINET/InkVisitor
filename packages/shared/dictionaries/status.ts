import { EntityStatus } from "../enums";

export const entityStatusDict: {
  value: string;
  label: string;
  info?: string;
}[] = [
  {
    value: EntityStatus.Pending,
    label: "pending",
    info: "",
  },
  {
    value: EntityStatus.Approved,
    label: "approved",
    info: "",
  },
  {
    value: EntityStatus.Discouraged,
    label: "discouraged",
    info: "",
  },
  {
    value: EntityStatus.Warning,
    label: "warning",
    info: "",
  },
];
