import api from "api";
import { Button, Loader } from "components";
import { useSearchParams } from "hooks";
import { EntityTag } from "pages/MainPage/containers";
import React from "react";
import { BsArrow90DegLeft, BsArrowRightShort } from "react-icons/bs";
import { useQuery } from "react-query";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { useAppDispatch } from "redux/hooks";
import { rootTerritoryId } from "Theme/constants";
import { StyledItemBox } from "./StatementListBreadcrumbItemStyles";

interface StatementListBreadcrumbItem {
  territoryId: string;
}

export const StatementListBreadcrumbItem: React.FC<
  StatementListBreadcrumbItem
> = ({ territoryId }) => {
  const { setTerritoryId, territoryId: paramsTerritoryId } = useSearchParams();

  const dispatch = useAppDispatch();

  const {
    status: territoryStatus,
    data: territoryData,
    error: territoryError,
    isFetching: territoryIsFetching,
  } = useQuery(
    ["territory", territoryId],
    async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    { enabled: !!territoryId && api.isLoggedIn() }
  );

  return (
    <>
      {territoryId !== rootTerritoryId && territoryData && (
        <StyledItemBox>
          <BsArrowRightShort />
          <EntityTag
            actant={territoryData}
            button={
              paramsTerritoryId !== territoryId && (
                <Button
                  icon={<BsArrow90DegLeft />}
                  color="plain"
                  inverted={true}
                  tooltip="go to territory"
                  onClick={() => {
                    dispatch(setTreeInitialized(false));
                    setTerritoryId(territoryId);
                  }}
                />
              )
            }
          />
          <Loader show={territoryIsFetching && !territoryData} size={18} />
        </StyledItemBox>
      )}
    </>
  );
};
