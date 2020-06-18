import { api } from "./api";
import { Statement } from "types";

export const getStatements = async (): Promise<Statement[]> => {
  try {
    const response = await api.get("/statements");
    return await response.data;
  } catch (err) {
    throw err;
  }
};
