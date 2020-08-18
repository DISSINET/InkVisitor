import { api } from "./api";
import { Node } from "types";

export const getTerritories = async (): Promise<Node> => {
  try {
    const response = await api.get("/territories");
    return await response.data;
  } catch (err) {
    throw err;
  }
};
