import { ActantStatus } from "../enums";

export const actantStatusDict: {
  value: string;
  label: string;
  info?: string;
}[] = [
  {
    value: ActantStatus.Pending,
    label: "pending",
    info: "",
  },
  {
    value: ActantStatus.Approved,
    label: "approved",
    info: "",
  },
  {
    value: ActantStatus.Discouraged,
    label: "discouraged",
    info: "",
  },
  {
    value: ActantStatus.Warning,
    label: "warning",
    info: "",
  },
];
