import { Dispatch } from "redux";

import {
  SET_TREE_EXPAND,
  SET_TREE_SELECT,
  ExpandTreeAction,
  SelectTreeAction,
  TerritoryAction,
  FETCH_TERRITORY,
} from "redux/types";
import { getTerritory } from "api/getTerritory";
import { ResponseTerritoryI } from "@shared/types/response-territory";

export const fetchTerritory = (id: string) => (
  dispatch: Dispatch<TerritoryAction>
): Promise<void> => {
  getTerritory(id).then((data: ResponseTerritoryI) =>
    dispatch({
      type: FETCH_TERRITORY,
      payload: data,
    })
  );
  return Promise.resolve();
};

export const setTreeExpandId = (id: string) => (
  dispatch: Dispatch<ExpandTreeAction>
): Promise<void> => {
  dispatch({
    type: SET_TREE_EXPAND,
    expandedTreeId: id,
  });
  return Promise.resolve();
};

export const setTreeSelectId = (id: string) => (
  dispatch: Dispatch<SelectTreeAction>
): Promise<void> => {
  dispatch({
    type: SET_TREE_SELECT,
    selectedTreeId: id,
  });
  return Promise.resolve();
};
