import store from "redux/store";

import { api } from "./api";
import { ActantI } from "@shared/types";

export const getActants = async (entity: string, label: string) => {
  const authToken = store.getState().token;

  const config = {
    headers: { Authorization: `Bearer ${authToken}` },
  };

  try {
    const response = await api.get(
      `/actants/query?class=${entity}&label=${label}`,
      config
    );
    return await response.data;
  } catch (err) {
    throw err;
  }
};
