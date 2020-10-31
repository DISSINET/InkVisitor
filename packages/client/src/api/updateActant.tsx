import store from "redux/store";

import { api } from "./api";
import { ActantI } from "@shared/types";

export const updateActant = async (actant: ActantI) => {
  const authToken = store.getState().token;
  const config = {
    headers: {
      authorization: `Bearer ${authToken}`,
    },
  };

  try {
    const response = await api.put(
      `/actants/${actant.id}`,
      actant,
      authToken ? config : undefined
    );
    return await response.data;
  } catch (err) {
    throw err;
  }
};
