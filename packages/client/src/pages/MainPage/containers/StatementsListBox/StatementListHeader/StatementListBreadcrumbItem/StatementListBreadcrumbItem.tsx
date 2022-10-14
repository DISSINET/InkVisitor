import { EntityEnums } from "@shared/enums";
import { IEntity, IResponseTerritory } from "@shared/types";
import api from "api";
import { Button, Loader } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React from "react";
import { BsArrow90DegLeft, BsArrowRightShort } from "react-icons/bs";
import { useQuery } from "react-query";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { useAppDispatch } from "redux/hooks";
import { rootTerritoryId } from "Theme/constants";
import { StyledItemBox } from "./StatementListBreadcrumbItemStyles";

interface StatementListBreadcrumbItem {
  territoryId: string;
  territoryData?: IResponseTerritory;
}
const initialData: IEntity = {
  id: "",
  class: EntityEnums.Class.Territory,
  data: {},
  label: "",
  detail: "",
  status: EntityEnums.Status.Approved,
  language: EntityEnums.Language.Empty,
  references: [],
  props: [],
  notes: [],
};
export const StatementListBreadcrumbItem: React.FC<
  StatementListBreadcrumbItem
> = ({ territoryId, territoryData }) => {
  const { setTerritoryId, territoryId: paramsTerritoryId } = useSearchParams();

  const dispatch = useAppDispatch();

  const {
    status: territoryStatus,
    data,
    error: territoryError,
    isFetching,
  } = useQuery(
    ["territory", territoryId],
    async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    {
      enabled:
        !!territoryId && api.isLoggedIn() && paramsTerritoryId !== territoryId,
    }
  );

  return (
    <>
      {territoryId !== rootTerritoryId && (
        <StyledItemBox>
          <BsArrowRightShort />
          <EntityTag
            entity={territoryData || data || initialData}
            button={
              paramsTerritoryId !== territoryId && (
                <Button
                  icon={<BsArrow90DegLeft />}
                  color="plain"
                  inverted
                  tooltip="go to territory"
                  onClick={() => {
                    dispatch(setTreeInitialized(false));
                    setTerritoryId(territoryId);
                  }}
                />
              )
            }
          />
          <Loader show={isFetching && !(data || territoryData)} size={18} />
        </StyledItemBox>
      )}
    </>
  );
};
