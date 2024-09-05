import { Query } from "@shared/types";
import { useQueryClient } from "@tanstack/react-query";
import React, { useMemo } from "react";
import { useAppSelector } from "redux/hooks";
import { INodeItem } from "../types";

interface QueryGridNodeProps {
  item: INodeItem;
}

export const QueryGridNode: React.FC<QueryGridNodeProps> = ({ item }) => {
  const queryClient = useQueryClient();

  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  return (
    <div
      style={{
        gridColumn: item.gridX,
        gridRow: item.gridY,
        backgroundColor: "red",
        borderColor: "white",
        borderWidth: 2,
      }}
    >
      {`${item.gridX},${item.gridY}`}
    </div>
  );
};
