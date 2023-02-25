import { EntityEnums } from "../enums";

export const entityStatusDict: {
  value: string;
  label: string;
  info?: string;
}[] = [
    {
      value: EntityEnums.Status.Pending,
      label: "pending",
      info: "",
    },
    {
      value: EntityEnums.Status.Approved,
      label: "approved",
      info: "",
    },
    {
      value: EntityEnums.Status.Discouraged,
      label: "discouraged",
      info: "",
    },
    {
      value: EntityEnums.Status.Warning,
      label: "warning",
      info: "",
    },
    {
      value: EntityEnums.Status.Unfinished,
      label: "unfinished",
      info: "",
    },
  ];
