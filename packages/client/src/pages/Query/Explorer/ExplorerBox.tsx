import React, { useState } from "react";

import { IResponseQuery, IResponseQueryEntity } from "@shared/types";
import { Explore } from "@shared/types/query";
import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "redux/hooks";
import { ExplorerTable } from "./ExplorerTable/ExplorerTable";
import { ExploreAction } from "./state";

interface ExplorerBoxProps {
  state: Explore.IExplore;
  dispatch: React.Dispatch<ExploreAction>;
  entities: IResponseQueryEntity[];
  // data: IResponseQuery | undefined;
  isQueryFetching: boolean;
  queryError: Error | null;
}
export const ExplorerBox: React.FC<ExplorerBoxProps> = ({
  state,
  dispatch,
  entities,
  // data,
  isQueryFetching,
  queryError,
}) => {
  const queryClient = useQueryClient();

  const contentHeight: number = useAppSelector(
    (state) => state.layout.contentHeight
  );

  return (
    <div>
      {entities ? (
        <ExplorerTable
          state={state}
          dispatch={dispatch}
          entities={entities}
          isQueryFetching={isQueryFetching}
          queryError={queryError}
        />
      ) : (
        "no data yet"
      )}
    </div>
  );
};

export const MemoizedExplorerBox = React.memo(ExplorerBox);
