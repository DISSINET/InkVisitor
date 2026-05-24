import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IResponseTerritory } from "@inkvisitor/shared/types";
import api from "api";
import { Button, Loader } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React from "react";
import { BsArrow90DegLeft, BsArrowRightShort } from "react-icons/bs";
import { useQuery } from "@tanstack/react-query";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { useAppDispatch } from "redux/hooks";
import { rootTerritoryId } from "Theme/constants";
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

  const { status, data, error, isFetching } = useQuery({
    queryKey: ["territory", territoryId],
    queryFn: async () => {
      const res = await api.entityGet(territoryId);
      return res.data;
    },
    enabled: !!territoryId && !territoryData && api.isLoggedIn(),
  });

  return (
    <>
      {(territoryData || data || (initialData && isFetching)) && (
        <>
          {territoryId !== rootTerritoryId && (
            <StyledItemBox>
              <BsArrowRightShort />
              <EntityTag
                showOnly="label"
                fullWidth={isSelected}
                isSelected={isSelected}
                entity={territoryData || data || initialData}
                isFavorited={isFavorited}
                button={
                  paramsTerritoryId !== territoryId && (
                    <Button
                      icon={<BsArrow90DegLeft />}
                      color="plain"
                      inverted
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
