import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "components";
import { BiRefresh } from "react-icons/bi";

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
      onClick={async () => {
        const uid = localStorage.getItem("userid");
        for (const queryToRefresh of queriesToRefresh) {
          if (queryToRefresh === "user" && uid) {
            await queryClient.invalidateQueries({ queryKey: ["user", uid] });
            await queryClient.refetchQueries({
              queryKey: ["user", uid],
              type: "active",
            });
          } else {
            await queryClient.invalidateQueries({
              queryKey: [queryToRefresh],
            });
            await queryClient.refetchQueries({
              queryKey: [queryToRefresh],
              type: "active",
            });
          }
        }
      }}
    />
  );
};
