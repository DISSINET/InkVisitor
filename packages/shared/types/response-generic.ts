import * as errors from "./errors";

const errorKeys = Object.keys(errors);
export type errorTypes = keyof typeof errors;

export interface IResponseGeneric {
  result: boolean;

  error?: errorTypes;
}

const t: IResponseGeneric = {
  result: false,
  error: "ActantDoesNotExits",
};
