import React from "react";
import { useQuery } from "react-query";
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

  return (
    <>
      {data && (
        <TerritoryTreeNode
          territory={data.territory}
          children={data.children}
          lvl={data.lvl}
          statementsCount={data.statementsCount}
        />
      )}
    </>
  );
};
