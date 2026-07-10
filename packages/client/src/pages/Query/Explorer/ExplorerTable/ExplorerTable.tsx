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
import { ExploreAction, ExploreActionType } from "../state";
import ExplorerTableNewColumnPanel from "./ExplorerTableNewColumnPanel/ExplorerTableNewColumnPanel";
import { StyledBody, StyledEmptyMessage, StyledTableWrapper } from "./ExplorerTableStyles";

import ExploreTableHeader from "./Header/ExploreTableHeader";
import { HEIGHT_ROW_DEFAULT, WIDTH_COLUMN_FIRST } from "./constants";
import { getColumnWidth } from "./utils";

const OVERSCAN_ROWS = 10;

/**
 * Debounce delay before dispatching offset/limit changes during scroll.
 */
const SCROLL_WINDOW_UPDATE_DEBOUNCE_MS = 150;

// light CSS classes (avoid dynamic styled props in hot path)
import { invalidateAllExplorerQueries } from "pages/Query/useQueryData";
import { computeWindowUpdate } from "pages/Query/utils";
import "../../styles.css";
import ExplorerTableRow from "./ExplorerTableRow";
import { EntityEnums, RelationEnums } from "@inkvisitor/shared/enums";

interface ExplorerTable {
  state: Explore.IExplore;
  dispatch: React.Dispatch<ExploreAction>;
  data: IResponseQuery | undefined;
  isQueryFetching: boolean;
  /** True when no search criteria are set, so no query is fired. */
  isRequestEmpty: boolean;
  /** True when criteria are set but the search has not been run yet. */
  isSearchPending?: boolean;
  queryError: Error | null;
  /**
   * Identity of the current query (excludes offset/limit). Changes on a new
   * search/filter/sort/view but not on scroll pagination — used to drop stale
   * results instead of flashing them while the new query is fetching.
   */
  stableSignature?: string;
  height: number;
  getCachedEntity?: (rowIndex: number) => IResponseQueryEntity | undefined;
  onOpenEntityInDetail?: (entityId: string) => void;

  // Row selection + new-column state is owned above (ExplorerBox) so the shared
  // control bar can drive it; the table consumes it as controlled props.
  selectedEntityIdsSet: Set<string>;
  rowLastClicked: number;
  getEntityIdAtRow: (rowIndex: number) => string | undefined;
  onRowSelect: (rowId: number, isWithShift?: boolean) => void;
  isNewColumnOpen: boolean;
  setIsNewColumnOpen: (value: boolean) => void;
}
export const ExplorerTable: React.FC<ExplorerTable> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  isRequestEmpty,
  isSearchPending = false,
  stableSignature,
  getCachedEntity,
  height: heightBox,
  onOpenEntityInDetail,
  selectedEntityIdsSet,
  rowLastClicked,
  getEntityIdAtRow,
  onRowSelect,
  isNewColumnOpen,
  setIsNewColumnOpen,
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

  const { limit, offset } = state;
  const columns = state.view.mode === Explore.EViewMode.Table ? state.view.columns : [];

  const [total, setTotal] = useState(0);

  // Drop stale results the moment the query identity changes (new search /
  // filter / sort / view). Without this, `data` is undefined while the new query
  // fetches and the render falls back to `lastData` — the old, now-irrelevant
  // rows would flash until the fetch resolves. Scroll pagination keeps the same
  // stableSignature, so it still reuses lastData to avoid flicker.
  //
  // Done during render (not in an effect) so the clear happens before paint:
  // an effect fires after commit, letting the stale rows flash for one frame.
  // Setting state during render makes React discard this render and re-render
  // synchronously with the cleared state, so nothing stale is ever committed.
  const prevStableSignatureRef = useRef(stableSignature);
  if (prevStableSignatureRef.current !== stableSignature) {
    prevStableSignatureRef.current = stableSignature;
    setLastData(undefined);
    setTotal(0);
  }

  const [rowFocused, setRowFocused] = useState<number>(-1);
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

  const headerHeight = 50;
  const heightTableBody = heightBox - headerHeight;

  const handleRowClick = useCallback((rowId: number) => {
    setRowFocused((current) => (current === rowId ? -1 : rowId));
  }, []);

  const handleRemoveColumn = useCallback(
    (id: string) => {
      dispatch({
        type: ExploreActionType.removeColumn,
        payload: { id },
      });
    },
    [dispatch],
  );

  const handleMoveColumn = useCallback(
    (fromIndex: number, toIndex: number) => {
      dispatch({
        type: ExploreActionType.moveColumn,
        payload: { fromIndex, toIndex },
      });
    },
    [dispatch],
  );

  const widthTable = useMemo(() => {
    return WIDTH_COLUMN_FIRST + columns.reduce((sum, col) => sum + getColumnWidth(col.type), 0);
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
              onRowSelect={onRowSelect}
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
      onRowSelect,
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
    <StyledTableWrapper
      style={{
        height: heightBox - 20,
      }}
      ref={contentRef}
    >
      <div
        style={
          {
            "--qt-row-focused-bg": themeContext.color.tableOpened,
            "--qt-row-odd-bg": themeContext.color.tableOddRow,
            "--qt-row-bg": themeContext.color.tableEvenRow,
            "--qt-row-border": themeContext.color.gray[300],
            width: contentWidth,
            minWidth: "100%",
            height: heightBox - 20,
            overflowX: "auto",
            overflowY: "hidden",
          } as React.CSSProperties
        }
      >
        {/* HEADER (sticky at top of vertical area, shared horizontal scroll) */}
        <div style={{ width: widthTable, minWidth: "100%" }}>
          {/* Alternatively, use the memoized header component below to minimize re-renders */}
          <ExploreTableHeader
            columns={columns}
            onRemoveColumn={handleRemoveColumn}
            onMoveColumn={handleMoveColumn}
          />

          {/* BODY (List handles Y; shares X with header via parent Scrollbar) */}
          <StyledBody
            style={{
              height: heightTableBody,
            }}
          >
            {isRequestEmpty ? (
              <StyledEmptyMessage>
                Create a query or add a search filter first to see the matching entities.
              </StyledEmptyMessage>
            ) : isSearchPending ? (
              <StyledEmptyMessage>
                Run the search to see matching entities. (Enter)
              </StyledEmptyMessage>
            ) : !isQueryFetching && total === 0 ? (
              <StyledEmptyMessage>No results found.</StyledEmptyMessage>
            ) : (
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
            )}
          </StyledBody>
        </div>
      </div>
      <ExplorerTableNewColumnPanel
        open={isNewColumnOpen}
        onClose={() => setIsNewColumnOpen(false)}
        onCreateColumn={handleCreateColumn}
      />
    </StyledTableWrapper>
  );
};
