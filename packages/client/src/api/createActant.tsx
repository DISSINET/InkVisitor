import { api } from "./api";
import { ActantI } from "@shared/types";

export const createActant = async (actant: ActantI) => {
  try {
    const response = await api.post(`/actants`, actant);
    return await response.data;
  } catch (err) {
    throw err;
  }
};
