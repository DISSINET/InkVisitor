import { IResponseQuery, IResponseQueryEntity } from "@inkvisitor/shared/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { BatchAction, batchOptions } from "./ExplorerTable/types";

interface UseExplorerControlsParams {
  data: IResponseQuery | undefined;
  getCachedEntity?: (rowIndex: number) => IResponseQueryEntity | undefined;
  onOpenEntitiesInDetail?: (entityIds: string[]) => void;
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
  onOpenEntitiesInDetail,
}: UseExplorerControlsParams) => {
  const entityIds = data?.entityIds ?? [];
  const total = data?.total ?? 0;

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
  };
};

export type ExplorerControls = ReturnType<typeof useExplorerControls>;
