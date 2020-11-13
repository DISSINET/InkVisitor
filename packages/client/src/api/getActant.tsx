import store from "redux/store";

import { api } from "./api";
import { ActantI } from "@shared/types";

export const getActant = async (actantId: string) => {
  const authToken = store.getState().token;

  const config = {
    headers: { Authorization: `Bearer ${authToken}` },
  };

  try {
    const response = await api.get(`/actants/${actantId}`, config);
    return await response.data;
  } catch (err) {
    throw err;
  }
};
