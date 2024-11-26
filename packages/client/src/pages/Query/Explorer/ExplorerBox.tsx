import React from "react";

import { IResponseQuery } from "@shared/types";
import { Explore } from "@shared/types/query";
import { ExplorerTable } from "./ExplorerTable/ExplorerTable";
import { ExploreAction } from "./state";

interface ExplorerBoxProps {
  state: Explore.IExplore;
  dispatch: React.Dispatch<ExploreAction>;
  data: IResponseQuery | undefined;
  isQueryFetching: boolean;
  queryError: Error | null;
  height: number;
  onExport: (rowsSelected: number[]) => void;
}
export const ExplorerBox: React.FC<ExplorerBoxProps> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  queryError,
  height,
  onExport,
}) => {
  return (
    <ExplorerTable
      state={state}
      dispatch={dispatch}
      data={data}
      isQueryFetching={isQueryFetching}
      queryError={queryError}
      height={height}
      onExport={onExport}
    />
  );
};

export const MemoizedExplorerBox = React.memo(ExplorerBox);
