import { api } from "./api";
import { ResponseTerritoryI } from "@shared/types/response-territory";

export const getTerritory = async (
  id: string,
  token?: string
): Promise<ResponseTerritoryI> => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };
  try {
    const response = await api.get(
      `/territory/${id}`,
      token ? config : undefined
    );
    return await response.data;
  } catch (err) {
    throw err;
  }
};
