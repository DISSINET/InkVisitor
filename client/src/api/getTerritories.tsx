import { api } from "./api";
import { Territories } from "types";

export const getTerritories = async (): Promise<Territories> => {
  try {
    const response = await api.get("/territories");
    return await response.data;
  } catch (err) {
    throw err;
  }
};
