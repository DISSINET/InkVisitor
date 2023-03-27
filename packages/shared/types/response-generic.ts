import * as errors from "./errors";

export type errorTypes = keyof typeof errors;

/**
 * IResponseGeneric is fallback response, when you have nothing better to return
 * Its also used for errors - result will be false. Optional 'error' attribute takes name of customized error
 * and optional message is just for informative purposed - description of the error in readable form
 *
 * ie:
 * {
 *   result: false,
 *   error: "BadParams",
 *   message: "Label is required"
 * }
 */
export interface IResponseGeneric<T = any> {
  result: boolean;
  error?: errorTypes;
  message?: string;
  data?: T;
}
