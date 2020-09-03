import { api } from "./api";
import { ResponseMetaI } from "@shared/types/response-meta";

export const getMeta = async (): Promise<ResponseMetaI> => {
  try {
    const response = await api.get("/meta");
    return await response.data;
  } catch (err) {
    throw err;
  }
};
