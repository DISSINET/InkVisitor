import { AuthTokenAction, SET_AUTH_TOKEN } from "redux/types";

const token = (state: string = "", action: AuthTokenAction): string => {
  switch (action.type) {
    case SET_AUTH_TOKEN:
      return action.token;
    default:
      return state;
  }
};

export default token;
