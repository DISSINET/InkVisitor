import { Dispatch } from "redux";

import {
  SET_TREE_EXPAND,
  SET_TREE_SELECT,
  ExpandTreeAction,
  SelectTreeAction,
  FetchTerritoriesAction,
  FETCH_TERRITORIES,
} from "redux/types";
import { Territories } from "types";
import { getTerritories } from "api/getTerritories";

export const fetchTerritories = () => (
  dispatch: Dispatch<FetchTerritoriesAction>
): Promise<void> => {
  getTerritories().then((data: Territories) =>
    dispatch({
      type: FETCH_TERRITORIES,
      payload: data,
    })
  );
  return Promise.resolve();
};

export const setTreeExpand = (id: string) => (
  dispatch: Dispatch<ExpandTreeAction>
): Promise<void> => {
  dispatch({
    type: SET_TREE_EXPAND,
    expandTreeId: id,
  });
  return Promise.resolve();
};

export const setTreeSelect = (id: string) => (
  dispatch: Dispatch<SelectTreeAction>
): Promise<void> => {
  dispatch({
    type: SET_TREE_SELECT,
    selectTreeId: id,
  });
  return Promise.resolve();
};
