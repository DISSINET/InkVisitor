import React from "react";
import { useHistory, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "react-query";
const queryString = require("query-string");

import { Button, Loader } from "components";
import api from "api";
import { StyledItemBox } from "./StatementListBreadcrumbItemStyles";

interface StatementListBreadcrumbItem {
  territoryId: string;
}
export const StatementListBreadcrumbItem: React.FC<StatementListBreadcrumbItem> = ({
  territoryId,
}) => {
  const queryClient = useQueryClient();
  let history = useHistory();
  let location = useLocation();
  var hashParams = queryString.parse(location.hash);

  const { status, data, error, isFetching } = useQuery(
    ["territory", territoryId],
    async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    { enabled: !!territoryId && api.isLoggedIn() }
  );

  return (
    <>
      <StyledItemBox>
        <Button
          label={data ? data.label : territoryId}
          color="info"
          inverted
          onClick={() => {
            hashParams["territory"] = territoryId;
            history.push({
              hash: queryString.stringify(hashParams),
            });
          }}
        />
        <Loader show={isFetching && !data} size={18} />
      </StyledItemBox>
    </>
  );
};
