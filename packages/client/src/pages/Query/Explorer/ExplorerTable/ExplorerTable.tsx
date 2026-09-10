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
import {
  StyledBody,
  StyledEmptyMessage,
  StyledRowNumber,
  StyledTableWrapper,
} from "./ExplorerTableStyles";

import ExploreTableHeader from "./Header/ExploreTableHeader";
import { CELL_DISPLAY_LIMIT } from "./Cell/ExplorerCellOverflow";
import { HEIGHT_ROW_DEFAULT, ROW_NUMBER_MIN_DIGITS, WIDTH_COLUMN_FIRST } from "./constants";
import { contentSizedColumnTypes } from "./types";
import { estimateColumnWidth, getColumnWidth } from "./utils";

const OVERSCAN_ROWS = 10;

const EMPTY_COLUMNS: Explore.IExploreColumn[] = [];

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

  const { limit, offset } = state;
  // Stable identity for the non-table branch: `columns` is an effect dependency,
  // and a fresh [] every render would re-fire it unconditionally.
  const columns = state.view.mode === Explore.EViewMode.Table ? state.view.columns : EMPTY_COLUMNS;

  // Content-estimated widths per column id, ratcheted: a column only ever
  // grows within one query (see estimateColumnWidth). Estimated from each
  // loaded data window, never DOM-measured — rows are virtualized, so the
  // viewport content varies with scroll position and measuring would jitter.
  // Only ever shrinks by resetting on a new query (stableSignature change).
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});

  useEffect(() => {
    if (data && typeof data.total === "number") {
      setLastData(data);
      setRenderWindow({ offset: state.offset, limit: state.limit });

      // Ratchet content-sized column widths from the arrived window.
      setColumnWidths((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const col of columns) {
          if (!contentSizedColumnTypes.has(col.type)) continue;
          const estimated = estimateColumnWidth(col, data.entities, CELL_DISPLAY_LIMIT);
          if (estimated > (next[col.id] ?? 0)) {
            next[col.id] = estimated;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }
  }, [data, state.offset, state.limit, columns]);

  const {
    entities,
    total: incomingTotal,
    entityIds,
  } = data ?? lastData ?? { entities: [], total: 0, entityIds: [] as string[] };

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
    // New query: restart the width ratchet so columns can size down again.
    setColumnWidths({});
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

          case Explore.EExploreColumnType.ERV: {
            const params =
              column.params as Explore.IExploreColumnParams<Explore.EExploreColumnType.ERV>;

            const newRef: IReference = {
              id: uuidv4(),
              resource: params.resource,
              value: newEntity.id,
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

  const { ref: contentRef, width: contentWidth } = useResizeObserver<HTMLDivElement>();

  // The rows fill the body, so the window of rows worth fetching is measured
  // from it. Zero until the first measurement lands, which computeWindowUpdate
  // reads as "one overscan's worth" - and it is only called once rows render.
  const { ref: bodyRef, height: heightTableBody = 0 } = useResizeObserver<HTMLDivElement>();

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
    return (
      WIDTH_COLUMN_FIRST +
      columns.reduce((sum, col) => sum + (columnWidths[col.id] ?? getColumnWidth(col.type)), 0)
    );
  }, [columns, columnWidths]);

  // The last row carries the longest ordinal, so the number slot is sized from
  // the result count and handed to the header, the rows and the placeholders as
  // a CSS variable - a re-render of every memoized row would be the alternative.
  const rowNumberDigits = useMemo(
    () => Math.max(ROW_NUMBER_MIN_DIGITS, String(Math.max(total, 1)).length),
    [total],
  );

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
      const placeholderLabel = rowItem?.entity?.labels?.[0] ?? index + 1;
      const isLastRow = index === total - 1;

      return (
        <div
          style={{
            ...style,
            width: widthTable,
            minWidth: "100%",
            height: HEIGHT_ROW_DEFAULT,
            ...(isLastRow
              ? {
                  borderBottomLeftRadius: themeContext.borderRadius.default,
                  borderBottomRightRadius: themeContext.borderRadius.default,
                }
              : {}),
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
              <StyledRowNumber>{index + 1}</StyledRowNumber>
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
              columnWidths={columnWidths}
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
      total,
      columnWidths,
    ],
  );

  const handleRowsRendered = ({ startIndex }: any) => {
    const visibleStart = startIndex ?? 0;

    const {
      shouldUpdate,
      offset: targetOffset,
      limit: targetLimit,
    } = computeWindowUpdate({
      visibleStart,
      total,
      currentOffset: offset,
      currentLimit: limit,
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

  return (
    <StyledTableWrapper ref={contentRef}>
      <div
        style={
          {
            "--qt-row-focused-bg": themeContext.color.tableOpened,
            "--qt-row-odd-bg": themeContext.color.tableOddRow,
            "--qt-row-bg": themeContext.color.tableEvenRow,
            "--qt-row-border": themeContext.color.gray[300],
            "--qt-row-number-digits": rowNumberDigits,
            width: contentWidth,
            minWidth: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflowX: "auto",
            overflowY: "hidden",
            boxSizing: "border-box",
            paddingLeft: themeContext.space[4],
            paddingRight: themeContext.space[4],
          } as React.CSSProperties
        }
      >
        {/* HEADER (sticky at top of vertical area, shared horizontal scroll) */}
        {/* The column the header and the body stack in. It has to be the flex
            container of both, since the body takes the height the header leaves
            and react-window sizes the rows to that. */}
        <div
          style={{
            width: widthTable,
            minWidth: "100%",
            display: "flex",
            flexDirection: "column",
            flex: "1 1 auto",
            minHeight: 0,
          }}
        >
          {/* Alternatively, use the memoized header component below to minimize re-renders */}
          <ExploreTableHeader
            columns={columns}
            columnWidths={columnWidths}
            onRemoveColumn={handleRemoveColumn}
            onMoveColumn={handleMoveColumn}
          />

          {/* BODY (List handles Y; shares X with header via parent Scrollbar) */}
          <StyledBody ref={bodyRef}>
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
