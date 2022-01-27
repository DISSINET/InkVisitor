import { ActantType } from "@shared/enums";
import api from "api";
import React from "react";
import { useQuery } from "react-query";
import { EntityTag } from "../..";
import { StyledRightItem } from "./UserRightItemStyles";

interface UserRightItem {
  territoryId: string;
}
export const UserRightItem: React.FC<UserRightItem> = ({ territoryId }) => {
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
    <StyledRightItem>
      {territoryData && <EntityTag actant={territoryData} />}
    </StyledRightItem>
  );
};
