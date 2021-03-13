import React from "react";
import { useQuery } from "react-query";
const queryString = require("query-string");

import api from "api";
import { useLocation, useHistory } from "react-router";

export const StatementListBox: React.FC = () => {
  var hashParams = queryString.parse(location.hash);
  const territoryId = hashParams.territory;

  const { status, data, error, isFetching } = useQuery(
    ["statements-list", territoryId],
    async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    {}
  );

  return <div>{JSON.stringify(data)}</div>;
};
