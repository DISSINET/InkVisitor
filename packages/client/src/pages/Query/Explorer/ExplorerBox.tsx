import React from "react";

import { IResponseQueryEntity } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { ExplorerTable } from "./ExplorerTable/ExplorerTable";
import { ExplorerStats } from "./ExplorerStats/ExplorerStats";
import ExplorerControlBar from "./ExplorerControlBar";
import { ExplorerTableBatchActionModal } from "./ExplorerTable/ExplorerTableBatchActionModal/ExplorerTableBatchActionModal";
import { ExploreAction } from "./state";
import { useExplorerControls } from "./useExplorerControls";
import { useInvalidateExplorerQuery } from "../useQueryData";

/** Height reserved for the shared control bar above the view content. */
const CONTROL_BAR_HEIGHT = 50;

interface ExplorerBoxProps {
  state: Explore.IExplore;
  dispatch: React.Dispatch<ExploreAction>;
  data: any | undefined;
  isQueryFetching: boolean;
  /** True when no search criteria are set, so no query is fired. */
  isRequestEmpty?: boolean;
  /** True when criteria are set but the search has not been run yet. */
  isSearchPending?: boolean;
  queryError: Error | null;
  height: number;
  onExport: (rowsSelected: number[], selectedColumnIds?: string[]) => void;
  stableSignature?: string;
  getCachedEntity?: (rowIndex: number) => IResponseQueryEntity | undefined;
  onOpenEntityInDetail?: (entityId: string) => void;
  onOpenEntitiesInDetail?: (entityIds: string[]) => void;

  /** When false only read-only batch actions (open, copy, export) are offered. */
  canBatchEdit?: boolean;
}
export const ExplorerBox: React.FC<ExplorerBoxProps> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  isRequestEmpty = false,
  isSearchPending = false,
  queryError,
  height,
  onExport,
  stableSignature,
  getCachedEntity,
  onOpenEntityInDetail,
  onOpenEntitiesInDetail,
  canBatchEdit = false,
}) => {
  const isStats = state.view.mode === Explore.EViewMode.Stats;
  // Stats view with no search criteria: show only the prompt, hiding the control
  // bar (label / uuid filters) so nothing competes with the message.
  const isStatsEmpty = isStats && isRequestEmpty;
  const columns = state.view.mode === Explore.EViewMode.Table ? state.view.columns : [];

  const controls = useExplorerControls({
    data,
    getCachedEntity,
    onExport,
    onOpenEntitiesInDetail,
    stableSignature,
  });
  const invalidateExplorerQuery = useInvalidateExplorerQuery(stableSignature);

  const contentHeight = Math.max(0, height - CONTROL_BAR_HEIGHT);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", height }}>
        {!isStatsEmpty && (
          <ExplorerControlBar
            mode={state.view.mode}
            filters={state.filters}
            dispatch={dispatch}
            isQueryFetching={isQueryFetching}
            selection={
              isStats
                ? undefined
                : {
                    selectedCount: controls.selectedEntityIds.length,
                    isAllCurrentSelected: controls.isAllCurrentSelected,
                    hasPartialSelection: controls.hasPartialSelection,
                    rowsTotal: controls.total,
                    onAllRowsSelect: controls.handleAllRowsSelect,
                    setRowLastClicked: controls.setRowLastClicked,
                    batchActionSelected: controls.batchActionSelected,
                    setBatchActionSelected: controls.setBatchActionSelected,
                    onApplyBatchAction: controls.handleApplyBatchAction,
                    canBatchEdit,
                  }
            }
            newColumn={
              isStats
                ? undefined
                : {
                    isNewColumnOpen: controls.isNewColumnOpen,
                    setIsNewColumnOpen: controls.setIsNewColumnOpen,
                  }
            }
          />
        )}

        <div style={{ flex: 1, minHeight: 0 }}>
          {state.view.mode === Explore.EViewMode.Stats ? (
            <ExplorerStats
              stats={state.view.stats}
              dispatch={dispatch}
              values={data?.stats}
              total={data?.total}
              statsEntityLimit={data?.statsEntityLimit}
              isRequestEmpty={isRequestEmpty}
              isSearchPending={isSearchPending}
              isFetching={isQueryFetching}
              height={isStatsEmpty ? height : contentHeight}
            />
          ) : (
            <ExplorerTable
              state={state}
              dispatch={dispatch}
              data={data}
              isQueryFetching={isQueryFetching}
              isRequestEmpty={isRequestEmpty}
              isSearchPending={isSearchPending}
              stableSignature={stableSignature}
              queryError={queryError}
              height={contentHeight}
              getCachedEntity={getCachedEntity}
              onOpenEntityInDetail={onOpenEntityInDetail}
              selectedEntityIdsSet={controls.selectedEntityIdsSet}
              rowLastClicked={controls.rowLastClicked}
              getEntityIdAtRow={controls.getEntityIdAtRow}
              onRowSelect={controls.handleRowSelect}
              isNewColumnOpen={controls.isNewColumnOpen}
              setIsNewColumnOpen={controls.setIsNewColumnOpen}
            />
          )}
        </div>
      </div>

      {controls.isBatchModalOpen && (
        <ExplorerTableBatchActionModal
          batchAction={controls.batchActionSelected}
          selectedEntityIds={controls.selectedEntityIds}
          columns={columns}
          onClose={() => controls.setIsBatchModalOpen(false)}
          onExport={(selectedColumnIds) => {
            controls.handleExport(selectedColumnIds);
            controls.setIsBatchModalOpen(false);
          }}
          onApplyAction={() => {
            controls.setIsBatchModalOpen(false);
            invalidateExplorerQuery();
          }}
        />
      )}
    </>
  );
};

export const MemoizedExplorerBox = React.memo(ExplorerBox);
