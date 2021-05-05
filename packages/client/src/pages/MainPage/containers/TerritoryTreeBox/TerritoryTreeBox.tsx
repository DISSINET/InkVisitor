import React, { useEffect } from "react";
import { useQuery } from "react-query";
const queryString = require("query-string");

import api from "api";
import { TerritoryTreeNode } from "./TerritoryTreeNode/TerritoryTreeNode";
import { IResponseTree } from "@shared/types";
import { Loader } from "components";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { setSelectedTerritoryPath } from "redux/features/selectedTerritoryPathSlice";

export const TerritoryTreeBox: React.FC = () => {
  const { status, data, error, isFetching } = useQuery(
    ["tree"],
    async () => {
      // console.log("!!getting tree");
      const res = await api.treeGet();
      return res.data;
    },
    { enabled: api.isLoggedIn() }
  );
  var hashParams = queryString.parse(location.hash);
  const territoryId = hashParams.territory;
  const dispatch = useAppDispatch();
  const selectedTerritoryPath = useAppSelector(
    (state) => state.selectedTerritoryPath
  );

  const searchTree = (
    element: IResponseTree,
    matchingTitle: string
  ): IResponseTree | null => {
    if (element.territory.id === matchingTitle) {
      return element;
    } else if (element.children != null) {
      var i;
      var result = null;
      for (i = 0; result === null && i < element.children.length; i++) {
        result = searchTree(element.children[i], matchingTitle);
      }
      return result;
    }
    return null;
  };
  useEffect(() => {
    if (data) {
      const foundTerritory = searchTree(data, territoryId);
      if (foundTerritory) {
        dispatch(setSelectedTerritoryPath(foundTerritory.path));
      }
    }
  }, [data, territoryId]);

  return (
    <>
      {data && (
        <TerritoryTreeNode
          territory={data.territory}
          children={data.children}
          lvl={data.lvl}
          statementsCount={data.statementsCount}
          initExpandedNodes={selectedTerritoryPath}
        />
      )}
      <Loader show={isFetching} />
    </>
  );
};
