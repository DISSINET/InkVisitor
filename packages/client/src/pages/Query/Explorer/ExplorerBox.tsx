import React from "react";

import { IResponseQueryEntity } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { ExplorerTable } from "./ExplorerTable/ExplorerTable";
import { ExploreAction } from "./state";
import { FloatingSearchContainer } from "../FloatingSearchContainer/FloatingSearchContainer";
import { COLLAPSED_PANEL_WIDTH } from "Theme/constants";

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

  isDetailOpen: boolean;
  queryDetailPanelExpanded: boolean;
  querySeparatorXPosition: number;
  layoutWidth: number;
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
  isDetailOpen,
  queryDetailPanelExpanded,
  querySeparatorXPosition,
  layoutWidth,
}) => {
  const floatingSearchRightInset = isDetailOpen
    ? queryDetailPanelExpanded
      ? layoutWidth - querySeparatorXPosition
      : COLLAPSED_PANEL_WIDTH
    : 0;

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
      />
      <FloatingSearchContainer
        rightInset={floatingSearchRightInset}
        filters={state.filters}
        exploreDispatch={dispatch}
      />
    </>
  );
};

export const MemoizedExplorerBox = React.memo(ExplorerBox);
