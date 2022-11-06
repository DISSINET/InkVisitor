import api from "api";
import { EntityTag } from "components/advanced";
import React from "react";
import { useQuery } from "react-query";
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
      {territoryData && <EntityTag entity={territoryData} />}
    </StyledRightItem>
  );
};
