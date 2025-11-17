import React from "react";

import { Explore } from "@shared/types/query";
import { ExplorerTable } from "./ExplorerTable/ExplorerTable";
import { ExploreAction } from "./state";

interface ExplorerBoxProps {
  state: Explore.IExplore;
  dispatch: React.Dispatch<ExploreAction>;
  data: any | undefined;
  isQueryFetching: boolean;
  queryError: Error | null;
  height: number;
  onExport: (rowsSelected: number[]) => void;
  invalidateActiveQuery?: () => void;
  stableSignature?: string;
  onPrefetchWindow?: (offset: number, limit: number) => void;
}
export const ExplorerBox: React.FC<ExplorerBoxProps> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  queryError,
  height,
  onExport,
  invalidateActiveQuery,
  stableSignature,
  onPrefetchWindow,
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
      invalidateActiveQuery={invalidateActiveQuery}
      stableSignature={stableSignature}
      onPrefetchWindow={onPrefetchWindow}
    />
  );
};

export const MemoizedExplorerBox = React.memo(ExplorerBox);
