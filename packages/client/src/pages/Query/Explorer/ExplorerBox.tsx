import React from "react";

import { IResponseQueryEntity } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { ExplorerTable } from "./ExplorerTable/ExplorerTable";
import ExplorerTableIdsFilter from "./ExplorerTable/ExplorerTableIdsFilter";
import { ExploreAction } from "./state";
import { FloatingSearchContainer } from "../FloatingSearchContainer/FloatingSearchContainer";

interface ExplorerBoxProps {
  state: Explore.IExplore;
  dispatch: React.Dispatch<ExploreAction>;
  data: any | undefined;
  isQueryFetching: boolean;
  queryError: Error | null;
  height: number;
  onExport: (rowsSelected: number[], selectedColumnIds?: string[]) => void;
  stableSignature?: string;
  getCachedEntity?: (rowIndex: number) => IResponseQueryEntity | undefined;
  onOpenEntityInDetail?: (entityId: string) => void;
  onOpenEntitiesInDetail?: (entityIds: string[]) => void;

  isDetailOpen: boolean;
  detailPanelWidth: number;
}
export const ExplorerBox: React.FC<ExplorerBoxProps> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  queryError,
  height,
  onExport,
  stableSignature,
  getCachedEntity,
  onOpenEntityInDetail,
  onOpenEntitiesInDetail,
  isDetailOpen,
  detailPanelWidth,
}) => {
  const floatingSearchRightInset = isDetailOpen ? detailPanelWidth : 0;

  return (
    <>
      <ExplorerTable
        state={state}
        dispatch={dispatch}
        data={data}
        isQueryFetching={isQueryFetching}
        queryError={queryError}
        height={height}
        onExport={onExport}
        stableSignature={stableSignature}
        getCachedEntity={getCachedEntity}
        onOpenEntityInDetail={onOpenEntityInDetail}
        onOpenEntitiesInDetail={onOpenEntitiesInDetail}
      />
      <ExplorerTableIdsFilter filters={state.filters} dispatch={dispatch} />
      <FloatingSearchContainer
        rightInset={floatingSearchRightInset}
        filters={state.filters}
        exploreDispatch={dispatch}
      />
    </>
  );
};

export const MemoizedExplorerBox = React.memo(ExplorerBox);
