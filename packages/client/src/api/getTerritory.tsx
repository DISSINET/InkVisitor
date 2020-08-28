import { api } from "./api";
import { Territory } from "types";

export const getTerritory = async (id: string): Promise<Territory> => {
  try {
    const response = await api.get(`/territory/${id}`);
    return await response.data;
  } catch (err) {
    throw err;
  }
};
