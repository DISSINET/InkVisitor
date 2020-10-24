import { api } from "./api";
import { ActantI } from "@shared/types";

export const updateActant = async (actant: ActantI) => {
  try {
    const response = await api.put(`/actants/${actant.id}`, actant);
    console.log("update", response);
    return await response.data;
  } catch (err) {
    throw err;
  }
};
