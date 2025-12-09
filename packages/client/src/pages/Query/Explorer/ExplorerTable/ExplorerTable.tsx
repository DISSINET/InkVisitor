import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaEyeSlash } from "react-icons/fa";
import { MdOutlineEdit } from "react-icons/md";
import { List } from "react-window";
import { v4 as uuidv4 } from "uuid";

import {
  IEntity,
  IProp,
  IReference,
  IResponseQuery,
  IResponseQueryEntity,
} from "@shared/types";
import { Explore } from "@shared/types/query";
import api from "api";
import {
  Button,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { CMetaProp } from "constructors";

import { useResizeObserver, useTheme } from "hooks";
import { ExploreAction, ExploreActionType } from "../state";
import { ExplorerTableDetail } from "./ExplorerTableDetail/ExplorerTableDetail";
import ExplorerTableNewColumnPanel from "./ExplorerTableNewColumnPanel/ExplorerTableNewColumnPanel";
import {
  StyledBody,
  StyledHeader,
  StyledTableWrapper,
} from "./ExplorerTableStyles";
import ExploreTableControl from "./ExploreTableControl";
import {
  BatchAction,
  batchOptions,
  HEIGHT_ROW_DEFAULT,
  WIDTH_COLUMN_DEFAULT,
  WIDTH_COLUMN_FIRST,
} from "./types";

const OVERSCAN_ROWS = 10;

/**
 * Debounce delay before dispatching offset/limit changes during scroll.
 */
const SCROLL_WINDOW_UPDATE_DEBOUNCE_MS = 150;

// light CSS classes (avoid dynamic styled props in hot path)
import "../../styles.css";
import ExplorerTableRow from "./ExplorerTableRow";

// Memoized header to avoid unnecessary re-renders during scroll
const MemoizedTableHeader: React.FC<{
  columns: Explore.IExploreColumn[];
  onRemoveColumn: (id: string) => void;
}> = React.memo(({ columns, onRemoveColumn }) => {
  const theme = useTheme();
  return (
    <StyledHeader>
      <div
        className="qt-col qt-col-header"
        style={{
          width: WIDTH_COLUMN_FIRST,
          minWidth: WIDTH_COLUMN_FIRST,
          maxWidth: WIDTH_COLUMN_FIRST,
        }}
      >
        Entity
      </div>
      {columns.map((column, key) => {
        return (
          <div
            key={key}
            className="qt-col qt-col-header"
            style={{
              width: WIDTH_COLUMN_DEFAULT,
              minWidth: WIDTH_COLUMN_DEFAULT,
              maxWidth: WIDTH_COLUMN_DEFAULT,
              display: "flex",
              alignItems: "center",
            }}
          >
            {column.editable && (
              <MdOutlineEdit size={14} style={{ marginRight: "0.3rem" }} />
            )}
            {column.name}
            <span style={{ marginLeft: "0.5rem" }}>
              <Button
                noBorder
                noBackground
                inverted
                icon={<FaEyeSlash color={theme.color.white} />}
                onClick={() => onRemoveColumn(column.id)}
                tooltipLabel="remove column"
              />
            </span>
          </div>
        );
      })}
    </StyledHeader>
  );
});

const initialNewColumn: Explore.IExploreColumn = {
  id: uuidv4(),
  name: "",
  type: Explore.EExploreColumnType.EPV,
  editable: false,
  params: {},
};
interface ExplorerTable {
  state: Explore.IExplore;
  dispatch: React.Dispatch<ExploreAction>;
  data: IResponseQuery | undefined;
  isQueryFetching: boolean;
  queryError: Error | null;
  height: number;
  onExport: (rowsSelected: number[]) => void;
  invalidateActiveQuery?: () => void;
  stableSignature?: string;
  getCachedEntity?: (rowIndex: number) => IResponseQueryEntity | undefined;
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
  invalidateActiveQuery,
  stableSignature,
}) => {
  const themeContext = useTheme();
  const [lastData, setLastData] = useState<IResponseQuery | undefined>(
    undefined
  );
  useEffect(() => {
    if (data && typeof data.total === "number") {
      setLastData(data);
      setRenderWindow({ offset: state.offset, limit: state.limit });
    }
  }, [data, state.offset, state.limit]);

  const { entities, total: incomingTotal } = data ??
    lastData ?? { entities: [], total: 0 };

  // console.log(
  //   "entities",
  //   entities?.map((e) => e.entity.labels[0])
  // );

  const { columns, limit, offset } = state;

  const [total, setTotal] = useState(0);

  const [rowLastClicked, setRowLastClicked] = useState<number>(-1);
  const [rowsSelected, setRowsSelected] = useState<number[]>([]);
  const rowsSelectedSet = useMemo(() => new Set(rowsSelected), [rowsSelected]);
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
  const dataSourceOffset =
    data && data.entities?.length > 0 ? offset : renderWindow.offset;

  const [batchActionSelected, setBatchActionSelected] = useState<BatchAction>(
    batchOptions[0].value
  );
  const [detailsRowIndex, setDetailsRowIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isQueryFetching) {
      setTotal(incomingTotal);
    }
  }, [incomingTotal, isQueryFetching]);

  const queryClient = useQueryClient();
  const updateEntityMutation = useMutation({
    mutationFn: async (variables: {
      entityId: string;
      changes: Partial<IEntity>;
    }) => await api.entityUpdate(variables.entityId, variables.changes),

    onSuccess: (_data, _variables) => {
      if (stableSignature) {
        queryClient.setQueriesData(
          { queryKey: ["query", stableSignature] },
          (old: IResponseQuery | undefined) => old
        );
      }
      if (invalidateActiveQuery) {
        invalidateActiveQuery();
      } else {
        queryClient.invalidateQueries({
          queryKey: ["query"],
        });
      }
    },
  });

  const [columnName, setColumnName] = useState(initialNewColumn.name);
  const [columnType, setColumnType] = useState(initialNewColumn.type);
  const [editable, setEditable] = useState<boolean>(initialNewColumn?.editable);

  const [propertyType, setPropertyType] = useState<IEntity | undefined>(
    undefined
  );
  const propertyTypeId = useMemo<string>(() => {
    return propertyType?.id || "";
  }, [propertyType]);

  const [isNewColumnOpen, setIsNewColumnOpen] = useState(false);

  const getNewColumn = (): Explore.IExploreColumn => {
    return {
      id: uuidv4(),
      name: columnName.length
        ? columnName
        : Explore.EExploreColumnTypeLabels[columnType],
      type: columnType,
      editable: editable,
      params: { propertyType: propertyTypeId },
    };
  };

  const handleClearLocalState = () => {
    setColumnName(initialNewColumn.name);
    setColumnType(initialNewColumn.type);
    setEditable(initialNewColumn.editable);
    setPropertyType(undefined);
  };

  const handleCreateColumn = () => {
    dispatch({
      type: ExploreActionType.addColumn,
      payload: getNewColumn(),
    });
    handleClearLocalState();
    setIsNewColumnOpen(false);
  };

  const handleFirstPage = () => {
    dispatch({ type: ExploreActionType.setOffset, payload: 0 });
  };

  const handleLastPage = () => {
    const lastPageOffset = Math.floor((total - 1) / limit) * limit;
    dispatch({ type: ExploreActionType.setOffset, payload: lastPageOffset });
  };

  const handleNextPage = () => {
    if (offset + limit < total) {
      dispatch({ type: ExploreActionType.setOffset, payload: offset + limit });
    }
  };

  const handlePreviousPage = () => {
    if (offset - limit >= 0) {
      dispatch({ type: ExploreActionType.setOffset, payload: offset - limit });
    }
  };

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
        }
      }
    },
    [columns]
  );

  const handleRowExpand = useCallback((rowId: number) => {
    setDetailsRowIndex(rowId);
  }, []);

  const {
    ref: contentRef,
    width: contentWidth,
    height: contentHeight,
  } = useResizeObserver<HTMLDivElement>();

  const spaceTableBody = heightBox - 105;

  const handleRowSelect = useCallback(
    (rowId: number, isWithShift: boolean = false) => {
      setRowLastClicked(rowId);

      setRowsSelected((prev) => {
        const isRowAlreadySelected = prev.includes(rowId);

        let newSelection = isRowAlreadySelected ? [] : [rowId];

        if (
          isWithShift &&
          rowLastClickedRef.current !== -1 &&
          rowLastClickedRef.current !== rowId
        ) {
          const start = Math.min(rowLastClickedRef.current, rowId);
          const end = Math.max(rowLastClickedRef.current, rowId);
          const rangeSize = end - start + 1;
          newSelection = Array.from({ length: rangeSize }, (_, i) => start + i);
        }

        if (isRowAlreadySelected) {
          return prev.filter((selectedRow) => selectedRow !== rowId);
        } else {
          return [...new Set([...prev, ...newSelection])];
        }
      });
    },
    []
  );

  const handleAllRowsSelect = (isSelected: boolean) => {
    if (isSelected) {
      setRowsSelected(Array.from({ length: total }).map((_, i) => i));
    } else {
      setRowsSelected([]);
    }
  };

  const handleExport = () => {
    onExport(rowsSelected);
  };

  const handleRemoveColumn = useCallback(
    (id: string) => {
      dispatch({
        type: ExploreActionType.removeColumn,
        payload: { id },
      });
    },
    [dispatch]
  );

  const widthTable = useMemo(() => {
    return columns.length * WIDTH_COLUMN_DEFAULT + WIDTH_COLUMN_FIRST;
  }, [columns]);

  const windowUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Fixed row height - no dynamic measuring

  // Use server rows
  const items: Array<IResponseQueryEntity | null> =
    (entities as IResponseQueryEntity[]) || [];
  const stableEmptyRowProps = useMemo(() => ({}), []);

  const getRowHeight = useCallback(() => HEIGHT_ROW_DEFAULT, []);

  const renderRow = useCallback(
    (props: any) => {
      const { index, style } = props;
      const isOdd = Boolean(index % 2 === 0);

      const isSelected = rowsSelectedSet.has(index);
      const isExpanded = false;
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
      const placeholderLabel = rowItem?.entity?.labels?.[0] ?? index;

      return (
        <div
          style={{ ...style, width: widthTable, height: HEIGHT_ROW_DEFAULT }}
          className={`qt-row ${isOdd ? " qt-row-odd" : ""}${
            isSelected ? " qt-row-selected" : ""
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
              <div>loading row</div>
              <div style={{ fontWeight: "bold" }}>{placeholderLabel}</div>
              <Loader size={16} color={"primary"} show />
            </div>
          ) : (
            <ExplorerTableRow
              rowId={index}
              rowItem={rowItem!}
              columns={columns}
              handleEditColumn={handleEditColumn}
              onRowSelect={handleRowSelect}
              onExpand={handleRowExpand}
              isSelected={isSelected}
              isLastClicked={rowLastClicked === index}
              isExpanded={isExpanded}
              invalidateActiveQuery={invalidateActiveQuery}
            />
          )}
        </div>
      );
    },
    [
      rowsSelectedSet,
      dataSourceOffset,
      items,
      widthTable,
      columns,
      handleEditColumn,
      handleRowSelect,
      handleRowExpand,
      rowLastClicked,
      invalidateActiveQuery,
      getCachedEntity,
    ]
  );

  const handleRowsRendered = ({ startIndex, stopIndex }: any) => {
    const visibleStart = startIndex ?? 0;
    const visibleEnd = stopIndex ?? visibleStart;
    const targetStart = Math.max(0, visibleStart - OVERSCAN_ROWS);
    const targetEnd = Math.min(total - 1, visibleEnd + OVERSCAN_ROWS);
    const targetLimit = Math.max(1, targetEnd - targetStart + 1);

    const approxVisible = Math.ceil(spaceTableBody / HEIGHT_ROW_DEFAULT);
    const maxFetch = Math.max(approxVisible + 2 * OVERSCAN_ROWS, 30);
    const cappedLimit = Math.min(targetLimit, maxFetch, total);

    const currStart = renderWindow.offset;
    const currEnd = renderWindow.offset + items.length - 1;
    const minDelta = 5;
    const extendsAbove = targetStart < currStart - minDelta;
    const extendsBelow = targetEnd > currEnd + minDelta;
    const offsetChanged = Math.abs(targetStart - offset) >= minDelta;
    const limitChanged = Math.abs(cappedLimit - limit) >= minDelta;
    const shouldUpdate =
      extendsAbove || extendsBelow || offsetChanged || limitChanged;

    if (windowUpdateTimeoutRef.current) {
      clearTimeout(windowUpdateTimeoutRef.current);
    }
    if (shouldUpdate) {
      windowUpdateTimeoutRef.current = setTimeout(() => {
        dispatch({
          type: ExploreActionType.setLimitAndOffset,
          payload: { offset: targetStart, limit: cappedLimit },
        });
      }, SCROLL_WINDOW_UPDATE_DEBOUNCE_MS);
    }
  };

  useEffect(() => {
    console.log("isQueryFetching", isQueryFetching);
  }, [isQueryFetching]);

  return (
    <>
      <StyledTableWrapper
        style={{
          height: heightBox - 20,
        }}
        ref={contentRef}
      >
        <ExploreTableControl
          setIsNewColumnOpen={setIsNewColumnOpen}
          isNewColumnOpen={isNewColumnOpen}
          batchActionSelected={batchActionSelected}
          setBatchActionSelected={setBatchActionSelected}
          rowsSelected={rowsSelected}
          entities={(items.filter(Boolean) as IResponseQueryEntity[]) || []}
          setRowLastClicked={setRowLastClicked}
          rowsTotal={total}
          onAllRowsSelect={handleAllRowsSelect}
          onExport={handleExport}
        />

        <div
          style={{
            width: contentWidth,
            height: heightBox - 70,
            overflowX: "auto",
            overflowY: "hidden",
          }}
        >
          {/* HEADER (sticky at top of vertical area, shared horizontal scroll) */}
          <div style={{ width: widthTable }}>
            {/* Alternatively, use the memoized header component below to minimize re-renders */}
            <MemoizedTableHeader
              columns={columns}
              onRemoveColumn={handleRemoveColumn}
            />

            {/* BODY (List handles Y; shares X with header via parent Scrollbar) */}
            <StyledBody
              style={{
                height: spaceTableBody,
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

        {/* {renderTableFooter()} */}
      </StyledTableWrapper>

      {/* DETAILS MODAL */}
      {detailsRowIndex !== null &&
        items[detailsRowIndex - renderWindow.offset] && (
          <Modal
            showModal={
              detailsRowIndex !== null &&
              items[detailsRowIndex - renderWindow.offset] !== null
            }
            width={"fat"}
            onClose={() => setDetailsRowIndex(null)}
          >
            <ModalHeader
              title="Entity Detail"
              onClose={() => setDetailsRowIndex(null)}
            />
            <ModalContent enableScroll noPadding>
              <ExplorerTableDetail
                rowEntity={
                  (
                    items[
                      detailsRowIndex - renderWindow.offset
                    ] as IResponseQueryEntity
                  ).entity
                }
                columns={columns}
                isOdd={false}
              />
            </ModalContent>
            <ModalFooter>
              <Button label="Close" onClick={() => setDetailsRowIndex(null)} />
            </ModalFooter>
          </Modal>
        )}

      {/* NEW COLUMN */}
      <div style={{ position: "relative" }}>
        <ExplorerTableNewColumnPanel
          open={isNewColumnOpen}
          onClose={() => setIsNewColumnOpen(false)}
          onCreateColumn={handleCreateColumn}
        />
      </div>
    </>
    // </div>
  );
};
