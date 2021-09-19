import React from "react";
import { useQuery } from "react-query";

import { Button, Loader } from "components";
import api from "api";
import { StyledItemBox } from "./StatementListBreadcrumbItemStyles";
import { useAppDispatch } from "redux/hooks";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { rootTerritoryId } from "Theme/constants";
import { useSearchParams } from "hooks";

interface StatementListBreadcrumbItem {
  territoryId: string;
}
export const StatementListBreadcrumbItem: React.FC<StatementListBreadcrumbItem> = ({
  territoryId,
}) => {
  const { setTerritory: setTerritoryId } = useSearchParams();

  const dispatch = useAppDispatch();

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
      {territoryId !== rootTerritoryId && (
        <StyledItemBox>
          <Button
            label={data ? data.label : territoryId}
            color="info"
            inverted
            onClick={() => {
              dispatch(setTreeInitialized(false));
              setTerritoryId(territoryId);
            }}
          />
          <Loader show={isFetching && !data} size={18} />
        </StyledItemBox>
      )}
    </>
  );
};
