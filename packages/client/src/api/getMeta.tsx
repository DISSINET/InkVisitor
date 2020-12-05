import store from "redux/store";

import { api } from "./api";
import { ResponseMetaI } from "@shared/types/response-meta";

export const getMeta = async () => {
  const authToken = store.getState().token;
  const config = {
    headers: { Authorization: `Bearer ${authToken}` },
  };
  try {
    const response = await api.get("/meta", config);
    return await response.data;
  } catch (err) {
    throw err;
  }
};
