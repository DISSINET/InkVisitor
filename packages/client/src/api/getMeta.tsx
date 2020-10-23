import { api } from "./api";
import { ResponseMetaI } from "@shared/types/response-meta";

export const getMeta = async (token?: string): Promise<ResponseMetaI> => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  try {
    const response = await api.get("/meta", token ? config : undefined);
    return await response.data;
  } catch (err) {
    throw err;
  }
};
