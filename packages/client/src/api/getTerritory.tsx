import { api } from "./api";
import { ResponseTerritoryI } from "@shared/types/response-territory";

export const getTerritory = async (id: string): Promise<ResponseTerritoryI> => {
  try {
    const response = await api.get(`/territory/${id}`);
    return await response.data;
  } catch (err) {
    throw err;
  }
};
