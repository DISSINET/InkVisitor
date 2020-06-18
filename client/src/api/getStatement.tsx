import { api } from "./api";
import { Statement } from "types";

export const getStatement = async (id: string): Promise<Statement> => {
  try {
    const response = await api.get(`/statements/${id}`);
    return await response.data;
  } catch (err) {
    throw err;
  }
};
