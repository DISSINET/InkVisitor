import { api } from "./api";
import { ActantI } from "@shared/types";

export const deleteActant = async (actantId: string) => {
  try {
    const response = await api.delete(`/actants/${actantId}`);
    return await response.data;
  } catch (err) {
    throw err;
  }
};
