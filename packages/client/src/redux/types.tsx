export const SET_AUTH_TOKEN = "SET_AUTH_TOKEN";

export interface AuthTokenAction {
  type: typeof SET_AUTH_TOKEN;
  token: string;
}
