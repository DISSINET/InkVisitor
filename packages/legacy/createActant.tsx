import store from "redux/store";

import { api } from "./api";
import { ActantI } from "@shared/types";

export const createActant = async (actant: ActantI) => {
  const authToken = store.getState().token;
  const config = {
    headers: { Authorization: `Bearer ${authToken}` },
  };
  try {
    const response = await api.post(
      `/actants`,
      actant,
      authToken ? config : undefined
    );
    return await response.data;
  } catch (err) {
    throw err;
  }
};
