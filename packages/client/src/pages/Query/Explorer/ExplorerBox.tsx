import React from "react";

import { IResponseQuery } from "@shared/types";
import { Explore } from "@shared/types/query";
import { useAppSelector } from "redux/hooks";
import { ExplorerTable } from "./ExplorerTable/ExplorerTable";
import { ExploreAction } from "./state";

interface ExplorerBoxProps {
  state: Explore.IExplore;
  dispatch: React.Dispatch<ExploreAction>;
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
  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  return (
    <div>
      <ExplorerTable
        state={state}
        dispatch={dispatch}
        data={data}
        isQueryFetching={isQueryFetching}
        queryError={queryError}
      />
    </div>
  );
};

export const MemoizedExplorerBox = React.memo(ExplorerBox);
