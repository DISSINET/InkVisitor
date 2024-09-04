import React from "react";

import { IResponseQuery } from "@shared/types";
import { Explore, Query } from "@shared/types/query";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "redux/hooks";

interface ExplorerBoxProps {
  state: Explore.IExplore;
  dispatch: React.Dispatch<any>;
  data: IResponseQuery | undefined;
  isQueryFetching: boolean;
  queryError: Error | null;
}

export const ExplorerBox: React.FC<ExplorerBoxProps> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  queryError,
}) => {
  const queryClient = useQueryClient();

  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  return <div>Here comes the explorer</div>;
};

export const MemoizedExplorerBox = React.memo(ExplorerBox);
