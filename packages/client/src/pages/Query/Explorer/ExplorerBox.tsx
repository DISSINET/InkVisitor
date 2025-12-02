import React from "react";

import { IResponseQueryEntity } from "@shared/types";
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
  getCachedEntity?: (rowIndex: number) => IResponseQueryEntity | undefined;
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
  getCachedEntity,
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
      getCachedEntity={getCachedEntity}
    />
  );
};

export const MemoizedExplorerBox = React.memo(ExplorerBox);
