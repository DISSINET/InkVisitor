import { api } from "./api";
import { ActantI } from "@shared/types";

export const updateActant = async (actant: ActantI, token?: string) => {
  const config = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };

  try {
    const response = await api.put(
      `/actants/${actant.id}`,
      actant,
      token ? config : undefined
    );
    return await response.data;
  } catch (err) {
    throw err;
  }
};
