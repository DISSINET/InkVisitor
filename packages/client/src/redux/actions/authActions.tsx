import { Dispatch } from "redux";

import { AuthTokenAction, SET_AUTH_TOKEN } from "redux/types";

export const setAuthToken = (token: string) => (
  dispatch: Dispatch<AuthTokenAction>
): Promise<void> => {
  dispatch({
    type: SET_AUTH_TOKEN,
    token: token,
  });
  return Promise.resolve();
};
