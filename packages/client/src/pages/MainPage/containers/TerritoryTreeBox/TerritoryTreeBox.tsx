import React from "react";
import { useQuery } from "react-query";
import api from "api";
const queryString = require("query-string");

import { useLocation, useHistory } from "react-router";
import {
  ITerritory,
  IResponseTreeTerritoryComponent,
  IActant,
} from "@shared/types";
import { Arrow, Button, ButtonGroup, Tag } from "components";

import { ActantTag } from "./../";
import { FaCaretRight, FaCircle, FaDotCircle } from "react-icons/fa";
import {
  StyledChildrenWrap,
  StyledIconWrap,
  StyledTerritoryTagWrap,
} from "./TerritoryTreeBoxStyle";
import theme from "Theme/theme";
import { TerritoryTreeNode } from "./TerritoryTreeNode";

export const TerritoryTreeBox: React.FC = () => {
  // let history = useHistory();
  // let location = useLocation();

  // var hashParams = queryString.parse(location.hash);
  // const territoryId = hashParams.territory;
  // const statementId = hashParams.statement;

  const { status, data, error, isFetching } = useQuery(
    ["statement", "territory", "tree"],
    async () => {
      const res = await api.treeGet();
      return res.data;
    },
    {}
  );

  return (
    <div>
      {data && (
        <TerritoryTreeNode
          territory={data.territory}
          children={data.children}
          lvl={data.lvl}
        />
      )}
    </div>
  );
};
