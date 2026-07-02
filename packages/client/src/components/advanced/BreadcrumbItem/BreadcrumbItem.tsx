import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IResponseTerritory, IResponseTree } from "@inkvisitor/shared/types";
import api from "api";
import { Button, Loader } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React from "react";
import { BsArrow90DegLeft, BsArrowRightShort } from "react-icons/bs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { useAppDispatch } from "redux/hooks";
import { rootTerritoryId } from "Theme/constants";
import { searchTree } from "utils/utils";
import { StyledItemBox } from "./BreadcrumbItemStyles";

// initalData is used in the moment of loading to show the tag with the loader
const initialData: IEntity = {
  id: "",
  class: EntityEnums.Class.Territory,
  data: {},
  labels: ["..."],
  detail: "",
  status: EntityEnums.Status.Approved,
  language: EntityEnums.Language.Empty,
  references: [],
  props: [],
  notes: [],
};

interface BreadcrumbItem {
  territoryId: string;
  // If the territory is in params (territory), territory data needs to be added to props!!!
  territoryData?: IResponseTerritory;
  isFavorited?: boolean;
  isSelected?: boolean;
}
export const BreadcrumbItem: React.FC<BreadcrumbItem> = ({
  territoryId,
  territoryData,
  isFavorited,
  isSelected = false,
}) => {
  const { setTerritoryId, territoryId: paramsTerritoryId } = useSearchParams();

  const dispatch = useAppDispatch();

  // Reuse the territory already held in the cached ["tree"] blob instead of
  // fetching it again. The breadcrumb path is always part of the tree, so this
  // avoids one GET /entities/:id per breadcrumb item.
  const queryClient = useQueryClient();
  const treeData = queryClient.getQueryData<IResponseTree>(["tree"]);
  const treeTerritory =
    !territoryData && treeData
      ? searchTree(treeData, territoryId)?.territory
      : undefined;

  const { status, data, error, isFetching } = useQuery({
    queryKey: ["territory", territoryId],
    queryFn: async () => {
      const res = await api.entityGet(territoryId);
      return res.data;
    },
    enabled:
      !!territoryId && !territoryData && !treeTerritory && api.isLoggedIn(),
  });

  return (
    <>
      {(territoryData || treeTerritory || data || (initialData && isFetching)) && (
        <>
          {territoryId !== rootTerritoryId && (
            <StyledItemBox>
              <BsArrowRightShort />
              <EntityTag
                showOnly="label"
                fullWidth={isSelected}
                isSelected={isSelected}
                entity={territoryData || treeTerritory || data || initialData}
                isFavorited={isFavorited}
                button={
                  paramsTerritoryId !== territoryId && (
                    <Button
                      icon={<BsArrow90DegLeft />}
                      color="plain"
                      inverted
                      shape="sharp"
                      tooltipLabel="go to territory"
                      onClick={() => {
                        dispatch(setTreeInitialized(false));
                        setTerritoryId(territoryId);
                      }}
                    />
                  )
                }
              />
              <Loader show={isFetching} size={18} />
            </StyledItemBox>
          )}
        </>
      )}
    </>
  );
};
