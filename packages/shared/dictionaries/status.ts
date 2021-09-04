import { ActantStatus } from "../enums";

export const actantStatusDict: {
  value: string;
  label: string;
  info?: string;
}[] = [
  {
    value: ActantStatus.Status0,
    label: "pending",
    info: "",
  },
  {
    value: ActantStatus.Status1,
    label: "approved",
    info: "",
  },
  {
    value: ActantStatus.Status2,
    label: "discouraged",
    info: "",
  },
  {
    value: ActantStatus.Status3,
    label: "warning",
    info: "",
  },
];
