import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { List } from "react-window";
import { v4 as uuidv4 } from "uuid";

import {
  IEntity,
  IProp,
  IReference,
  IResponseQuery,
  IResponseQueryEntity,
  Relation,
} from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import api from "api";
import { Loader } from "components";
import { CMetaProp } from "constructors";

import { useResizeObserver, useSearchParams, useTheme } from "hooks";
import { toast } from "react-toastify";
import { ExploreAction, ExploreActionType } from "../state";
import { ExplorerTableBatchActionModal } from "./ExplorerTableBatchActionModal/ExplorerTableBatchActionModal";
import ExplorerTableNewColumnPanel from "./ExplorerTableNewColumnPanel/ExplorerTableNewColumnPanel";
import { StyledBody, StyledTableWrapper } from "./ExplorerTableStyles";
import ExploreTableControl from "./ExploreTableControl";

import ExploreTableHeader from "./ExploreTableHeader";
import {
  BatchAction,
  batchOptions,
  HEIGHT_ROW_DEFAULT,
  WIDTH_COLUMN_DEFAULT,
  WIDTH_COLUMN_EUC,
  WIDTH_COLUMN_FIRST,
} from "./types";

const OVERSCAN_ROWS = 10;

/**
 * Debounce delay before dispatching offset/limit changes during scroll.
 */
const SCROLL_WINDOW_UPDATE_DEBOUNCE_MS = 150;

// light CSS classes (avoid dynamic styled props in hot path)
import { invalidateAllExplorerQueries, useInvalidateExplorerQuery } from "pages/Query/useQueryData";
import { computeWindowUpdate } from "pages/Query/utils";
import "../../styles.css";
import ExplorerTableRow from "./ExplorerTableRow";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";

interface ExplorerTable {
  state: Explore.IExplore;
  dispatch: React.Dispatch<ExploreAction>;
  data: IResponseQuery | undefined;
  isQueryFetching: boolean;
  queryError: Error | null;
  height: number;
  onExport: (rowsSelected: number[], selectedColumnIds?: string[]) => void;
  stableSignature?: string;
  getCachedEntity?: (rowIndex: number) => IResponseQueryEntity | undefined;
  onOpenEntityInDetail?: (entityId: string) => void;
  onOpenEntitiesInDetail?: (entityIds: string[]) => void;
}
export const ExplorerTable: React.FC<ExplorerTable> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  queryError,
  getCachedEntity,
  height: heightBox,
  onExport,
  stableSignature,
  onOpenEntityInDetail,
  onOpenEntitiesInDetail,
}) => {
  const themeContext = useTheme();
  const { detailIdArray, clearAllDetailIds, selectedDetailId } = useSearchParams();
  const [lastData, setLastData] = useState<IResponseQuery | undefined>(undefined);
  useEffect(() => {
    if (data && typeof data.total === "number") {
      setLastData(data);
      setRenderWindow({ offset: state.offset, limit: state.limit });
    }
  }, [data, state.offset, state.limit]);

  const {
    entities,
    total: incomingTotal,
    entityIds,
  } = data ?? lastData ?? { entities: [], total: 0, entityIds: [] as string[] };

  const { limit, offset, filters } = state;
  const columns =
    state.view.mode === Explore.EViewMode.Table ? state.view.columns : [];

  const [total, setTotal] = useState(0);

  const [rowLastClicked, setRowLastClicked] = useState<number>(-1);
  const [rowFocused, setRowFocused] = useState<number>(-1);
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const selectedEntityIdsSet = useMemo(() => new Set(selectedEntityIds), [selectedEntityIds]);
  const rowLastClickedRef = useRef<number>(-1);
  useEffect(() => {
    rowLastClickedRef.current = rowLastClicked;
  }, [rowLastClicked]);
  // Keep offset/limit for the data currently rendered to avoid flashing incorrect rows
  const [renderWindow, setRenderWindow] = useState<{
    offset: number;
    limit: number;
  }>({
    offset: 0,
    limit: 0,
  });

  // Compute the offset that matches the CURRENT data source (data or lastData)
  // This fixes the lag where renderWindow.offset is stale during the render cycle
  const dataSourceOffset = data && data.entities?.length > 0 ? offset : renderWindow.offset;

  const [batchActionSelected, setBatchActionSelected] = useState<BatchAction>(
    batchOptions[0].value,
  );
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  useEffect(() => {
    if (!isQueryFetching) {
      setTotal(incomingTotal);
    }
  }, [incomingTotal, isQueryFetching]);

  const queryClient = useQueryClient();
  const updateEntityMutation = useMutation({
    mutationFn: async (variables: { entityId: string; changes: Partial<IEntity> }) =>
      await api.entityUpdate(variables.entityId, variables.changes),

    onSuccess: () => {
      invalidateAllExplorerQueries(queryClient);
    },
  });

  const [isNewColumnOpen, setIsNewColumnOpen] = useState(false);

  const invalidateExplorerQuery = useInvalidateExplorerQuery(stableSignature);

  const handleCreateColumn = (column: Explore.IExploreColumn) => {
    dispatch({
      type: ExploreActionType.addColumn,
      payload: column,
    });
    setIsNewColumnOpen(false);
  };

  const relationCreateMutation = useMutation({
    mutationFn: async (newRelation: Relation.IRelation) => await api.relationCreate(newRelation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      invalidateAllExplorerQueries(queryClient);
    },
  });

  const handleEditColumn = useCallback(
    (rowEntity: IEntity, columnId: string, newEntity: IEntity) => {
      const column = columns.find((column) => column.id === columnId);

      if (column) {
        switch (column.type) {
          case Explore.EExploreColumnType.EPT: {
            const params =
              column.params as Explore.IExploreColumnParams<Explore.EExploreColumnType.EPT>;

            const newProp: IProp = CMetaProp({
              typeEntityId: newEntity.id,
              valueEntityId: "",
            });

            updateEntityMutation.mutate({
              entityId: rowEntity.id,
              changes: {
                props: [...rowEntity.props, newProp],
              },
            });
            break;
          }

          case Explore.EExploreColumnType.EPV: {
            const params =
              column.params as Explore.IExploreColumnParams<Explore.EExploreColumnType.EPV>;

            const newProp: IProp = CMetaProp({
              typeEntityId: params.propertyType,
              valueEntityId: newEntity.id,
            });

            updateEntityMutation.mutate({
              entityId: rowEntity.id,
              changes: {
                props: [...rowEntity.props, newProp],
              },
            });
            break;
          }

          case Explore.EExploreColumnType.ERR: {
            const newRef: IReference = {
              id: uuidv4(),
              resource: newEntity.id,
              value: "",
            };

            updateEntityMutation.mutate({
              entityId: rowEntity.id,
              changes: {
                references: [...rowEntity.references, newRef],
              },
            });
            break;
          }

          case Explore.EExploreColumnType.ER: {
            const params =
              column.params as Explore.IExploreColumnParams<Explore.EExploreColumnType.ER>;

            if (params.relationType === RelationEnums.Type.Identification) {
              const newRelation: Relation.IIdentification = {
                id: uuidv4(),
                type: params.relationType,
                entityIds: [rowEntity.id, newEntity.id],
                certainty: EntityEnums.Certainty.Certain,
              };

              relationCreateMutation.mutate(newRelation);
            } else {
              const newRelation: Relation.IRelation = {
                id: uuidv4(),
                type: params.relationType,
                entityIds: [rowEntity.id, newEntity.id],
              };

              relationCreateMutation.mutate(newRelation);
            }
          }
        }
      }
    },
    [columns],
  );

  const {
    ref: contentRef,
    width: contentWidth,
    height: contentHeight,
  } = useResizeObserver<HTMLDivElement>();

  const headerHeight = 100;
  const heightTableBody = heightBox - headerHeight;

  const getEntityIdAtRow = useCallback(
    (rowIndex: number): string | undefined => {
      const ids = entityIds ?? [];
      if (rowIndex >= 0 && rowIndex < ids.length) {
        return ids[rowIndex];
      }
      const cachedEntity = getCachedEntity?.(rowIndex);
      return cachedEntity?.entity?.id;
    },
    [entityIds, getCachedEntity],
  );

  const handleRowClick = useCallback((rowId: number) => {
    setRowFocused((current) => (current === rowId ? -1 : rowId));
  }, []);

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

  const handleAllRowsSelect = (isSelected: boolean) => {
    if (isSelected) {
      const allIds = entityIds ?? [];
      setSelectedEntityIds((prev) => [...new Set([...prev, ...allIds])]);
    } else {
      setSelectedEntityIds([]);
    }
  };

  const handleExport = (selectedColumnIds?: string[]) => {
    const ids = entityIds ?? [];
    const rowIndices = selectedEntityIds
      .map((entityId) => ids.indexOf(entityId))
      .filter((index) => index >= 0);
    onExport(rowIndices, selectedColumnIds);
  };

  const currentEntityIds = entityIds ?? [];
  const selectedInCurrentCount = useMemo(
    () => currentEntityIds.filter((id) => selectedEntityIdsSet.has(id)).length,
    [currentEntityIds, selectedEntityIdsSet],
  );
  const isAllCurrentSelected = total > 0 && selectedInCurrentCount === total;
  const hasPartialSelection = selectedInCurrentCount > 0 && !isAllCurrentSelected;

  const handleApplyBatchAction = async () => {
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
  };

  const handleRemoveColumn = useCallback(
    (id: string) => {
      dispatch({
        type: ExploreActionType.removeColumn,
        payload: { id },
      });
    },
    [dispatch],
  );

  // created by columns are smaller than the default columns, subtract the difference
  const widthTable = useMemo(() => {
    return (
      columns.length * WIDTH_COLUMN_DEFAULT +
      WIDTH_COLUMN_FIRST -
      columns.filter((column) => column.type === Explore.EExploreColumnType.EUC).length *
        (WIDTH_COLUMN_DEFAULT - WIDTH_COLUMN_EUC)
    );
  }, [columns]);

  const windowUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fixed row height - no dynamic measuring

  // Use server rows
  const items: Array<IResponseQueryEntity | null> = (entities as IResponseQueryEntity[]) || [];

  const stableEmptyRowProps = useMemo(() => ({}), []);

  const getRowHeight = useCallback(() => HEIGHT_ROW_DEFAULT, []);

  const renderRow = useCallback(
    (props: any) => {
      const { index, style } = props;
      const isOdd = Boolean(index % 2 === 0);

      const dataOffset = dataSourceOffset;
      const itemIndex = index - dataOffset;

      let rowItem: IResponseQueryEntity | null =
        itemIndex >= 0 && itemIndex < items.length
          ? (items[itemIndex] as IResponseQueryEntity)
          : null;

      // If not in current window, try direct cache lookup
      if (!rowItem && getCachedEntity) {
        const cachedEntity = getCachedEntity(index);
        if (cachedEntity) {
          rowItem = cachedEntity;
        }
      }

      const isPlaceholder = !rowItem;
      const rowEntityId = rowItem?.entity?.id ?? getEntityIdAtRow(index);
      const isSelected = rowEntityId ? selectedEntityIdsSet.has(rowEntityId) : false;
      const placeholderLabel = rowItem?.entity?.labels?.[0] ?? index;

      return (
        <div
          style={{
            ...style,
            width: widthTable,
            minWidth: "100%",
            height: HEIGHT_ROW_DEFAULT,
          }}
          className={`qt-row ${isOdd ? " qt-row-odd" : ""}${isSelected ? " qt-row-selected" : ""}${
            rowFocused === index ? " qt-row-focused" : ""
          }${isPlaceholder ? " qt-placeholder" : ""}`}
        >
          {isPlaceholder ? (
            <div
              style={{
                color: themeContext?.color.primary,
                display: "flex",
                fontSize: themeContext?.fontSize.sm,
                flexDirection: "row",
                gap: "0.25rem",
                alignItems: "center",
                paddingLeft: "1rem",
                width: "100%",
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  width: "4rem",
                }}
              >
                <Loader size={5} color={"primary"} show loaderStyle="beat" noBackground />
              </div>
              <div>loading row</div>
              <div style={{ fontWeight: "bold" }}>{placeholderLabel}</div>
            </div>
          ) : (
            <ExplorerTableRow
              rowId={index}
              rowItem={rowItem!}
              columns={columns}
              handleEditColumn={handleEditColumn}
              onRowSelect={handleRowSelect}
              onRowClick={handleRowClick}
              isSelected={isSelected}
              isLastClicked={rowLastClicked === index}
              onOpenEntityInDetail={onOpenEntityInDetail}
            />
          )}
        </div>
      );
    },
    [
      selectedEntityIdsSet,
      getEntityIdAtRow,
      dataSourceOffset,
      items,
      widthTable,
      columns,
      handleEditColumn,
      handleRowSelect,
      handleRowClick,
      rowLastClicked,
      rowFocused,
      getCachedEntity,
      onOpenEntityInDetail,
    ],
  );

  const handleRowsRendered = ({ startIndex, stopIndex }: any) => {
    const visibleStart = startIndex ?? 0;
    const visibleEnd = stopIndex ?? visibleStart;

    const {
      shouldUpdate,
      offset: targetOffset,
      limit: targetLimit,
    } = computeWindowUpdate({
      visibleStart,
      visibleEnd,
      total,
      currentOffset: offset,
      currentLimit: limit,
      loadedOffset: renderWindow.offset,
      loadedCount: items.length,
      viewportHeight: heightTableBody,
      rowHeight: HEIGHT_ROW_DEFAULT,
      overscan: OVERSCAN_ROWS,
    });

    if (windowUpdateTimeoutRef.current) {
      clearTimeout(windowUpdateTimeoutRef.current);
    }
    if (shouldUpdate) {
      windowUpdateTimeoutRef.current = setTimeout(() => {
        dispatch({
          type: ExploreActionType.setLimitAndOffset,
          payload: { offset: targetOffset, limit: targetLimit },
        });
      }, SCROLL_WINDOW_UPDATE_DEBOUNCE_MS);
    }
  };

  const handleCloseDetailsModal = () => {
    clearAllDetailIds();
  };

  return (
    <>
      <StyledTableWrapper
        style={{
          height: heightBox - 20,
        }}
        ref={contentRef}
      >
        <ExploreTableControl
          isQueryFetching={isQueryFetching}
          setIsNewColumnOpen={setIsNewColumnOpen}
          isNewColumnOpen={isNewColumnOpen}
          batchActionSelected={batchActionSelected}
          setBatchActionSelected={setBatchActionSelected}
          selectedCount={selectedEntityIds.length}
          isAllCurrentSelected={isAllCurrentSelected}
          hasPartialSelection={hasPartialSelection}
          setRowLastClicked={setRowLastClicked}
          rowsTotal={total}
          onAllRowsSelect={handleAllRowsSelect}
          onApplyBatchAction={handleApplyBatchAction}
          filters={filters}
          dispatch={dispatch}
        />

        <div
          style={
            {
              "--qt-row-focused-bg": themeContext.color.tableOpened,
              width: contentWidth,
              minWidth: "100%",
              height: heightBox - 70,
              overflowX: "auto",
              overflowY: "hidden",
            } as React.CSSProperties
          }
        >
          {/* HEADER (sticky at top of vertical area, shared horizontal scroll) */}
          <div style={{ width: widthTable, minWidth: "100%" }}>
            {/* Alternatively, use the memoized header component below to minimize re-renders */}
            <ExploreTableHeader columns={columns} onRemoveColumn={handleRemoveColumn} />

            {/* BODY (List handles Y; shares X with header via parent Scrollbar) */}
            <StyledBody
              style={{
                height: heightTableBody,
              }}
            >
              <List
                style={{
                  overflowX: "hidden",
                }}
                rowCount={total}
                rowHeight={getRowHeight}
                overscanCount={OVERSCAN_ROWS}
                onRowsRendered={handleRowsRendered}
                rowProps={stableEmptyRowProps}
                rowComponent={renderRow}
              />
            </StyledBody>
          </div>
        </div>
        <ExplorerTableNewColumnPanel
          open={isNewColumnOpen}
          onClose={() => setIsNewColumnOpen(false)}
          onCreateColumn={handleCreateColumn}
        />
      </StyledTableWrapper>

      {/* BATCH ACTION MODAL */}
      {isBatchModalOpen && (
        <ExplorerTableBatchActionModal
          batchAction={batchActionSelected}
          selectedEntityIds={selectedEntityIds}
          columns={columns}
          onClose={() => setIsBatchModalOpen(false)}
          onExport={(selectedColumnIds) => {
            handleExport(selectedColumnIds);
            setIsBatchModalOpen(false);
          }}
          onApplyAction={() => {
            setIsBatchModalOpen(false);
            invalidateExplorerQuery();
          }}
        />
      )}
    </>
  );
};
