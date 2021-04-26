import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
const queryString = require("query-string");

import api from "api";
import { TerritoryTreeNode } from "./TerritoryTreeNode/TerritoryTreeNode";
import { IResponseTree } from "@shared/types";

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
  const [selectedTerritoryPath, setSelectedTerritoryPath] = useState<string[]>([
    "T0",
  ]);

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
      console.log(foundTerritory?.path);
      if (foundTerritory) {
        setSelectedTerritoryPath(foundTerritory.path);
      }
    }
  }, [data]);
  // useEffect(() => {
  //   if (selectedTerritoryPath.length > 0) {
  //     setSelectedTerritoryPath([]);
  //   }
  // }, [selectedTerritoryPath]);

  return (
    <>
      {/* <DotLoader loading={isFetching} color={theme.color["primary"]} /> */}

      {data && (
        <TerritoryTreeNode
          territory={data.territory}
          children={data.children}
          lvl={data.lvl}
          statementsCount={data.statementsCount}
          initExpandedNodes={selectedTerritoryPath}
        />
      )}
    </>
  );
};
