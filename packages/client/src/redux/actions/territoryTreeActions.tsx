import { Dispatch } from "redux";

import { TerritoryAction, FETCH_TERRITORY } from "redux/types";
import { getTerritory } from "api/getTerritory";
import { ResponseTerritoryI } from "@shared/types/response-territory";

export const fetchTerritory = (id: string, token?: string) => (
  dispatch: Dispatch<TerritoryAction>
): Promise<void> => {
  getTerritory(id, token && token).then((data: ResponseTerritoryI) =>
    dispatch({
      type: FETCH_TERRITORY,
      payload: data,
    })
  );
  return Promise.resolve();
};
