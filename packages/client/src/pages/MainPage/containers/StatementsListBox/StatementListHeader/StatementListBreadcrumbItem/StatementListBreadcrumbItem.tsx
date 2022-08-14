import { EntityClass, EntityStatus, Language } from "@shared/enums";
import { IEntity } from "@shared/types";
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
}
const initialData: IEntity = {
  id: "",
  class: EntityClass.Territory,
  data: {},
  label: "",
  detail: "",
  status: EntityStatus.Approved,
  language: Language.Empty,
  references: [],
  props: [],
  notes: [],
};
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
      {territoryId !== rootTerritoryId && (
        <StyledItemBox>
          <BsArrowRightShort />
          <EntityTag
            entity={territoryData ? territoryData : initialData}
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
