import React, { useEffect } from "react";
import { useQuery } from "react-query";
const queryString = require("query-string");

import api from "api";
import { TerritoryTreeNode } from "./..";

export const TerritoryTreeBox: React.FC = () => {
  const { status, data, error, isFetching } = useQuery(
    ["statement", "territory", "tree"],
    async () => {
      const res = await api.treeGet();
      return res.data;
    },
    {}
  );
  var hashParams = queryString.parse(location.hash);
  const territoryId = hashParams.territory;

  // useEffect(() => {
  //   const selectedNode = data?.children.find((child) =>
  //     child.children.some((item) => item.territory.id === territoryId)
  //   );
  //   console.log(selectedNode);
  // }, [data]);

  return (
    <>
      {data && (
        <TerritoryTreeNode
          territory={data.territory}
          children={data.children}
          lvl={data.lvl}
          statementsCount={data.statementsCount}
          initExpandedNodes={["T0", "T1", "T1-1"]}
        />
      )}
    </>
  );
};
