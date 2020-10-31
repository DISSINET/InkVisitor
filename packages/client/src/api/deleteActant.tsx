import store from "redux/store";

import { api } from "./api";

export const deleteActant = async (actantId: string) => {
  const authToken = store.getState().token;
  const config = {
    headers: { Authorization: `Bearer ${authToken}` },
  };

  try {
    const response = await api.delete(
      `/actants/${actantId}`,
      authToken ? config : undefined
    );
    return await response.data;
  } catch (err) {
    throw err;
  }
};
