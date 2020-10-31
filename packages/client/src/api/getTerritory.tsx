import store from "redux/store";

import { api } from "./api";
import { ResponseTerritoryI } from "@shared/types/response-territory";

export const getTerritory = async (id: string): Promise<ResponseTerritoryI> => {
  const authToken = store.getState().token;
  const config = {
    headers: { Authorization: `Bearer ${authToken}` },
  };
  try {
    const response = await api.get(`/territory/${id}`, config);
    return await response.data;
  } catch (err) {
    throw err;
  }
};
