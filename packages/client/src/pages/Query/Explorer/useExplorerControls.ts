import { IResponseQuery, IResponseQueryEntity } from "@inkvisitor/shared/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { BatchAction, batchOptions } from "./ExplorerTable/types";

interface UseExplorerControlsParams {
  data: IResponseQuery | undefined;
  getCachedEntity?: (rowIndex: number) => IResponseQueryEntity | undefined;
  onExport: (rowsSelected: number[], selectedColumnIds?: string[]) => void;
  onOpenEntitiesInDetail?: (entityIds: string[]) => void;
  /**
   * Identity of the current query (excludes offset/limit). Changes on a new
   * search/filter/sort/view but not on scroll pagination — used to drop the
   * sticky result below once the results it describes become irrelevant.
   */
  stableSignature?: string;
}

/**
 * Owns the explorer's row-selection / batch-action / new-column state at a level
 * above the individual view modes, so the shared ExplorerControlBar (rendered in
 * ExplorerBox) can drive it and the table reads it as controlled props.
 *
 * Selection is only produced/consumed by the table view; the stats view simply
 * ignores it (no row selection there yet).
 */
export const useExplorerControls = ({
  data,
  getCachedEntity,
  onExport,
  onOpenEntitiesInDetail,
  stableSignature,
}: UseExplorerControlsParams) => {
  // `data` is undefined while a scroll-pagination window is fetching (the new
  // offset/limit is a cache key react-query has no entry for yet). Reading the
  // total straight off it made the row counter drop to 0 on every such fetch, so
  // keep the last result until either a new one arrives or the query identity
  // changes — the latter means the old totals no longer describe the search.
  const lastResultRef = useRef<{ entityIds: string[]; total: number }>({
    entityIds: [],
    total: 0,
  });
  const prevStableSignatureRef = useRef(stableSignature);
  if (prevStableSignatureRef.current !== stableSignature) {
    prevStableSignatureRef.current = stableSignature;
    lastResultRef.current = { entityIds: [], total: 0 };
  }
  if (data) {
    lastResultRef.current = {
      entityIds: data.entityIds ?? [],
      total: data.total ?? 0,
    };
  }
  const { entityIds, total } = lastResultRef.current;

  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const selectedEntityIdsSet = useMemo(
    () => new Set(selectedEntityIds),
    [selectedEntityIds],
  );

  const [rowLastClicked, setRowLastClicked] = useState<number>(-1);
  const rowLastClickedRef = useRef<number>(-1);
  useEffect(() => {
    rowLastClickedRef.current = rowLastClicked;
  }, [rowLastClicked]);

  const [batchActionSelected, setBatchActionSelected] = useState<BatchAction>(
    batchOptions[0].value,
  );
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isNewColumnOpen, setIsNewColumnOpen] = useState(false);

  const getEntityIdAtRow = useCallback(
    (rowIndex: number): string | undefined => {
      if (rowIndex >= 0 && rowIndex < entityIds.length) {
        return entityIds[rowIndex];
      }
      return getCachedEntity?.(rowIndex)?.entity?.id;
    },
    [entityIds, getCachedEntity],
  );

  const handleRowSelect = useCallback(
    (rowId: number, isWithShift: boolean = false) => {
      const entityId = getEntityIdAtRow(rowId);
      if (!entityId) {
        return;
      }

      setRowLastClicked(rowId);

      setSelectedEntityIds((prev) => {
        const isAlreadySelected = prev.includes(entityId);
        if (isAlreadySelected) {
          return prev.filter((id) => id !== entityId);
        }

        let idsToAdd = [entityId];
        if (
          isWithShift &&
          rowLastClickedRef.current !== -1 &&
          rowLastClickedRef.current !== rowId
        ) {
          const start = Math.min(rowLastClickedRef.current, rowId);
          const end = Math.max(rowLastClickedRef.current, rowId);
          idsToAdd = Array.from({ length: end - start + 1 }, (_, i) =>
            getEntityIdAtRow(start + i),
          ).filter((id): id is string => Boolean(id));
        }

        return [...new Set([...prev, ...idsToAdd])];
      });
    },
    [getEntityIdAtRow],
  );

  const handleAllRowsSelect = useCallback(
    (isSelected: boolean) => {
      if (isSelected) {
        setSelectedEntityIds((prev) => [...new Set([...prev, ...entityIds])]);
      } else {
        setSelectedEntityIds([]);
      }
    },
    [entityIds],
  );

  const selectedInCurrentCount = useMemo(
    () => entityIds.filter((id) => selectedEntityIdsSet.has(id)).length,
    [entityIds, selectedEntityIdsSet],
  );
  const isAllCurrentSelected = total > 0 && selectedInCurrentCount === total;
  const hasPartialSelection = selectedInCurrentCount > 0 && !isAllCurrentSelected;

  const handleExport = useCallback(
    (selectedColumnIds?: string[]) => {
      const rowIndices = selectedEntityIds
        .map((entityId) => entityIds.indexOf(entityId))
        .filter((index) => index >= 0);
      onExport(rowIndices, selectedColumnIds);
    },
    [selectedEntityIds, entityIds, onExport],
  );

  const handleApplyBatchAction = useCallback(async () => {
    if (batchActionSelected === BatchAction.open_in_detail) {
      if (selectedEntityIds.length === 0) {
        return;
      }
      onOpenEntitiesInDetail?.(selectedEntityIds);
      return;
    }
    if (batchActionSelected === BatchAction.copy_uuids) {
      if (selectedEntityIds.length === 0) {
        return;
      }
      await navigator.clipboard.writeText(selectedEntityIds.join(" "));
      toast.info("UUIDs copied to clipboard");
      return;
    }
    setIsBatchModalOpen(true);
  }, [batchActionSelected, selectedEntityIds, onOpenEntitiesInDetail]);

  return {
    selectedEntityIds,
    setSelectedEntityIds,
    selectedEntityIdsSet,
    rowLastClicked,
    setRowLastClicked,
    batchActionSelected,
    setBatchActionSelected,
    isBatchModalOpen,
    setIsBatchModalOpen,
    isNewColumnOpen,
    setIsNewColumnOpen,
    total,
    isAllCurrentSelected,
    hasPartialSelection,
    getEntityIdAtRow,
    handleRowSelect,
    handleAllRowsSelect,
    handleApplyBatchAction,
    handleExport,
  };
};

export type ExplorerControls = ReturnType<typeof useExplorerControls>;
