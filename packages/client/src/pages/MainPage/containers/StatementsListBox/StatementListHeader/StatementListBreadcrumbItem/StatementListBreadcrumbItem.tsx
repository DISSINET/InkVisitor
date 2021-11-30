import React from "react";
import { useQuery } from "react-query";

import { Button, Loader } from "components";
import api from "api";
import { StyledItemBox } from "./StatementListBreadcrumbItemStyles";
import { useAppDispatch } from "redux/hooks";
import { setTreeInitialized } from "redux/features/territoryTree/treeInitializeSlice";
import { rootTerritoryId } from "Theme/constants";
import { useSearchParams } from "hooks";
import { ActantTag } from "pages/MainPage/containers";
import { ActantStatus, ActantType, Language } from "@shared/enums";
import { BsArrow90DegLeft, BsArrowRightShort } from "react-icons/bs";

interface StatementListBreadcrumbItem {
  territoryId: string;
}
const initialData = {
  id: "",
  class: ActantType.Territory,
  data: {},
  label: "",
  detail: "",
  status: ActantStatus.Approved,
  language: Language.Empty,
  notes: [],
};
export const StatementListBreadcrumbItem: React.FC<StatementListBreadcrumbItem> = ({
  territoryId,
}) => {
  const { setTerritoryId } = useSearchParams();

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
          <ActantTag
            actant={territoryData ? territoryData : initialData}
            button={
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
            }
          />
          <Loader show={territoryIsFetching && !territoryData} size={18} />
        </StyledItemBox>
      )}
    </>
  );
};
