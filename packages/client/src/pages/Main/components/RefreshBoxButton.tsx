import { useQueryClient } from "@tanstack/react-query";
import { Button } from "components";
import React from "react";
import { BiRefresh } from "react-icons/bi";
import { getStoredUserId } from "utils/userStorage";

interface RefreshBoxButton {
  queriesToRefresh: string[];
  isHidden: boolean;
}

export const RefreshBoxButton: React.FC<RefreshBoxButton> = ({ queriesToRefresh, isHidden }) => {
  const queryClient = useQueryClient();

  if (isHidden || queriesToRefresh.length === 0) {
    return null;
  }

  return (
    <Button
      key="refresh queries"
      tooltipLabel="refresh data"
      inverted
      icon={<BiRefresh />}
      shape="square"
      onClick={async () => {
        const uid = getStoredUserId();
        await Promise.all(
          queriesToRefresh.map(async (queryToRefresh) => {
            const queryKey = queryToRefresh === "user" && uid ? ["user", uid] : [queryToRefresh];
            await queryClient.invalidateQueries({ queryKey });
          }),
        );
      }}
    />
  );
};
