import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
const queryString = require("query-string");

import api from "api";
import { TerritoryTreeNode } from "./TerritoryTreeNode/TerritoryTreeNode";
import { IResponseTree } from "@shared/types";
import { DotLoader } from "react-spinners";

export const TerritoryTreeBox: React.FC = () => {
  const { status, data, error, isFetching } = useQuery(
    ["tree"],
    async () => {
      console.log("!!getting tree");
      const res = await api.treeGet();
      return res.data;
    },
    {}
  );
  var hashParams = queryString.parse(location.hash);
  const territoryId = hashParams.territory;
  const [selectedTerritory, setSelectedTerritory] = useState<IResponseTree>();

  // const searchTree = (
  //   element: IResponseTree,
  //   matchingTitle: string
  // ): IResponseTree | null => {
  //   if (element.territory.id === matchingTitle) {
  //     return element;
  //   } else if (element.children != null) {
  //     var i;
  //     var result = null;
  //     for (i = 0; result === null && i < element.children.length; i++) {
  //       result = searchTree(element.children[i], matchingTitle);
  //     }
  //     return result;
  //   }
  //   return null;
  // };
  // useEffect(() => {
  //   if (data) {
  //     const foundTerritory = searchTree(data, territoryId);
  //     if (foundTerritory) {
  //       setSelectedTerritory(foundTerritory);
  //     }
  //   }
  // }, [data]);

  if (isFetching) {
    return (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DotLoader />
      </div>
    );
  }
  return (
    <>
      {data && (
        <TerritoryTreeNode
          territory={data.territory}
          children={data.children}
          lvl={data.lvl}
          statementsCount={data.statementsCount}
          initExpandedNodes={["T0"]}
        />
      )}
    </>
  );
};
