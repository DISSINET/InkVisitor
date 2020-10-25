import { api } from "./api";

export const deleteActant = async (actantId: string, token?: string) => {
  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  try {
    const response = await api.delete(
      `/actants/${actantId}`,
      token ? config : undefined
    );
    return await response.data;
  } catch (err) {
    throw err;
  }
};
