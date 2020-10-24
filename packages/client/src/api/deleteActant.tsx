import { api } from "./api";
import { ActantI } from "@shared/types";

export const deleteActant = async (actantId: string) => {
  try {
    const response = await api.delete(`/actants/${actantId}`);
    console.log("delete", response);
    return await response.data;
  } catch (err) {
    throw err;
  }
};
