import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaEyeSlash } from "react-icons/fa";
import { GrClose } from "react-icons/gr";
import { MdOutlineEdit } from "react-icons/md";
import { TbColumnInsertRight } from "react-icons/tb";
import Scrollbar from "react-scrollbars-custom";
import { List } from "react-window";
import { v4 as uuidv4 } from "uuid";

import { EntityEnums } from "@shared/enums";
import {
  IEntity,
  IProp,
  IReference,
  IResponseQuery,
  IResponseQueryEntity,
} from "@shared/types";
import { Explore } from "@shared/types/query";
import api from "api";
import { Button, ButtonGroup, Checkbox, Input } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import { CMetaProp } from "constructors";

import { ExploreAction, ExploreActionType } from "../state";
import ExplorerTableRow from "./ExplorerTableRow";
import { ExplorerTableRowExpanded } from "./ExplorerTableRowExpanded/ExplorerTableRowExpanded";
import {
  StyledBody,
  StyledColumn,
  StyledHeader,
  StyledNewColumn,
  StyledNewColumnContent,
  StyledNewColumnHeader,
  StyledNewColumnLabel,
  StyledNewColumnValue,
  StyledRow,
  StyledRowWrapper,
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
import { useResizeObserver } from "hooks";
import { BeatLoader } from "react-spinners";

const OVERSCAN_ROWS = 20;

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
  onPrefetchWindow?: (offset: number, limit: number) => void;
}
export const ExplorerTable: React.FC<ExplorerTable> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  queryError,
  height: heightBox,
  onExport,
  invalidateActiveQuery,
  stableSignature,
  onPrefetchWindow,
}) => {
  // Keep last successful data to avoid resetting the list when a new window is fetching
  const [lastData, setLastData] = useState<IResponseQuery | undefined>(
    undefined
  );
  useEffect(() => {
    if (data && typeof data.total === "number") {
      setLastData(data);
    }
  }, [data]);
  const { entities, total: incomingTotal } = data ??
    lastData ?? { entities: [], total: 0 };

  const rowIndices = useMemo(() => {
    return Array.from({ length: incomingTotal }).map((_, i) => i);
  }, [incomingTotal]);

  const { columns, limit, offset } = state;

  const [total, setTotal] = useState(0);
  // const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

  const [rowLastClicked, setRowLastClicked] = useState<number>(-1);
  const [rowsSelected, setRowsSelected] = useState<number[]>([]);

  const [batchActionSelected, setBatchActionSelected] = useState<BatchAction>(
    batchOptions[0].value
  );
  const [rowsExpanded, setRowsExpanded] = useState<number[]>([]);

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

  // Sorting controls are currently disabled; toggleSortDirection removed

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

  // const renderTableFooter = () => {
  //   return <StyledTableFooter>{renderPaging()}</StyledTableFooter>;
  // };

  const handleRowExpand = useCallback(
    (rowId: number) => {
      if (rowsExpanded.includes(rowId)) {
        setRowsExpanded(
          rowsExpanded.filter((expandedRow) => expandedRow !== rowId)
        );
      } else {
        setRowsExpanded([...rowsExpanded, rowId]);
      }
    },
    [rowsExpanded]
  );

  const {
    ref: contentRef,
    width: contentWidth,
    height: contentHeight,
  } = useResizeObserver<HTMLDivElement>();

  const spaceTableBody = heightBox - 150;

  const handleRowSelect = useCallback(
    (rowId: number, isWithShift: boolean = false) => {
      setRowLastClicked(rowId);

      setRowsSelected((prev) => {
        const isRowAlreadySelected = prev.includes(rowId);

        let newSelection = isRowAlreadySelected ? [] : [rowId];

        if (isWithShift && rowLastClicked !== -1 && rowLastClicked !== rowId) {
          newSelection =
            rowLastClicked < rowId
              ? // clicked after last
                rowIndices.slice(rowLastClicked, rowId + 1)
              : // clicked before last
                rowIndices.slice(rowId, rowLastClicked + 1);
        }

        if (isRowAlreadySelected) {
          return prev.filter((selectedRow) => selectedRow !== rowId);
        } else {
          return [...new Set([...prev, ...newSelection])];
        }
      });
    },
    [rowLastClicked, rowIndices]
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

  const widthTable = useMemo(() => {
    return columns.length * WIDTH_COLUMN_DEFAULT + WIDTH_COLUMN_FIRST;
  }, [columns]);

  const windowUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const rowSizeCacheRef = useRef<Record<number, number>>({});
  const [rowHeightsVersion, setRowHeightsVersion] = useState(0);

  // Use server rows
  const items: Array<IResponseQueryEntity | null> =
    (entities as IResponseQueryEntity[]) || [];
  const stableEmptyRowProps = useMemo(() => ({}), []);

  const getItemSize = (index: number) => {
    return rowSizeCacheRef.current[index] ?? HEIGHT_ROW_DEFAULT;
  };

  const getRowHeight = useCallback(
    (index: number) => getItemSize(index),
    [rowHeightsVersion]
  );

  const setItemSize = (index: number, size: number) => {
    const prev = rowSizeCacheRef.current[index];
    if (prev !== size) {
      rowSizeCacheRef.current[index] = size;
      setRowHeightsVersion((v) => v + 1);
    }
  };

  const handleRowsRendered = ({ startIndex, stopIndex }: any) => {
    const bufferedTop = Math.max(0, (startIndex ?? 0) - OVERSCAN_ROWS);
    const bufferedBottom = Math.min(
      total - 1,
      (stopIndex ?? 0) + OVERSCAN_ROWS
    );
    const desiredOffset = bufferedTop;
    const desiredLimit = Math.max(1, bufferedBottom - bufferedTop + 1);

    // Cap fetch size to a reasonable window based on viewport height
    const approxRowsVisible = Math.ceil(spaceTableBody / HEIGHT_ROW_DEFAULT);
    const maxFetch = Math.max(approxRowsVisible + 2 * OVERSCAN_ROWS, 50);
    const cappedLimit = Math.min(desiredLimit, maxFetch, total);

    if (windowUpdateTimeoutRef.current) {
      clearTimeout(windowUpdateTimeoutRef.current);
    }
    windowUpdateTimeoutRef.current = setTimeout(() => {
      if (desiredOffset !== offset || cappedLimit !== limit) {
        dispatch({
          type: ExploreActionType.setLimitAndOffset,
          payload: { offset: desiredOffset, limit: cappedLimit },
        });
        // Skip neighbor prefetch here to avoid extra calls while scrolling
      }
    }, 120);
  };

  // horizontal scroll is handled by outer Scrollbar only

  const isLoading = isQueryFetching;
  return (
    <div
      style={{
        height: heightBox - 20,
        margin: "1rem",
        overflow: "hidden",
      }}
      ref={contentRef}
    >
      {/* {isLoading && (
        <div
          style={{
            position: "absolute",
            right: 24,
            top: 24,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            pointerEvents: "none",
          }}
        >
          <BeatLoader size={6} margin={3} color="#bbb" />
          <span style={{ fontSize: 12, color: "#bbb" }}>fetching…</span>
        </div>
      )} */}
      <StyledTableWrapper>
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

        <Scrollbar
          style={{
            width: contentWidth,
            height: heightBox - 70,
          }}
          contentProps={{ style: { overflow: "visible" } }}
          noScrollY
        >
          {/* HEADER */}
          <StyledHeader
            style={{
              width: widthTable,
            }}
          >
            <StyledColumn $isHeader={true} $width={WIDTH_COLUMN_FIRST}>
              Entity
            </StyledColumn>
            {columns.map((column, key) => {
              return (
                <StyledColumn
                  $isHeader={true}
                  $width={WIDTH_COLUMN_DEFAULT}
                  key={key}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    {column.editable && (
                      <MdOutlineEdit
                        size={14}
                        style={{ marginRight: "0.3rem" }}
                      />
                    )}
                    {column.name}

                    {/* SORT controls intentionally removed/disabled in this phase */}

                    <span style={{ marginLeft: "0.5rem" }}>
                      <Button
                        noBorder
                        noBackground
                        inverted
                        icon={<FaEyeSlash color={"white"} />}
                        onClick={() =>
                          dispatch({
                            type: ExploreActionType.removeColumn,
                            payload: { id: column.id },
                          })
                        }
                        tooltipLabel="remove column"
                      />
                    </span>
                  </div>
                </StyledColumn>
              );
            })}
          </StyledHeader>
          <StyledBody
            style={{
              height: spaceTableBody,
            }}
          >
            <List
              rowCount={total}
              rowHeight={getRowHeight}
              overscanCount={OVERSCAN_ROWS}
              onRowsRendered={handleRowsRendered}
              rowProps={stableEmptyRowProps}
              rowComponent={(props: any) => {
                const { index, style } = props;
                const isOdd = Boolean(index % 2);
                const isSelected = rowsSelected.includes(index);
                const isExpanded = rowsExpanded.includes(index);

                const expandedMeasureRef = (el: HTMLDivElement | null) => {
                  if (el) {
                    const expandedHeight = el.getBoundingClientRect().height;
                    const newSize = HEIGHT_ROW_DEFAULT + expandedHeight;
                    setItemSize(index, newSize);
                  } else if (!isExpanded) {
                    setItemSize(index, HEIGHT_ROW_DEFAULT);
                  }
                };

                // Ensure default size when not expanded
                if (!isExpanded && getItemSize(index) !== HEIGHT_ROW_DEFAULT) {
                  setItemSize(index, HEIGHT_ROW_DEFAULT);
                }
                return (
                  <div style={style}>
                    <StyledRow
                      $width={widthTable}
                      $height={HEIGHT_ROW_DEFAULT}
                      $isOdd={isOdd}
                      $isSelected={isSelected}
                    >
                      <ExplorerTableRow
                        rowId={index}
                        items={items as IResponseQueryEntity[]}
                        offset={offset}
                        columns={columns}
                        handleEditColumn={handleEditColumn}
                        onRowSelect={handleRowSelect}
                        onExpand={handleRowExpand}
                        isSelected={isSelected}
                        isLastClicked={rowLastClicked === index}
                        isExpanded={isExpanded}
                        invalidateActiveQuery={invalidateActiveQuery}
                      />
                    </StyledRow>
                    {isExpanded && items[index - offset] && (
                      <div ref={expandedMeasureRef}>
                        <ExplorerTableRowExpanded
                          rowEntity={
                            (items[index - offset] as IResponseQueryEntity)
                              .entity
                          }
                          columns={columns}
                          isOdd={isOdd}
                        />
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </StyledBody>
        </Scrollbar>
        {/* {renderTableFooter()} */}
      </StyledTableWrapper>

      {/* NEW COLUMN */}
      {isNewColumnOpen && (
        <StyledNewColumn>
          <StyledNewColumnHeader>
            <div style={{ display: "flex", alignItems: "center" }}>
              <TbColumnInsertRight size={17} />
              <p style={{ marginLeft: "0.5rem" }}>New column</p>
            </div>
            <div>
              <Button
                icon={<GrClose size={14} />}
                onClick={() => setIsNewColumnOpen(false)}
                noBorder
                color="white"
                noBackground
                inverted
              />
            </div>
          </StyledNewColumnHeader>
          <StyledNewColumnContent>
            <StyledNewColumnLabel>Column name</StyledNewColumnLabel>
            <StyledNewColumnValue>
              <Input
                width="full"
                value={columnName}
                onChangeFn={(value) => setColumnName(value)}
                changeOnType
              />
            </StyledNewColumnValue>
            <StyledNewColumnLabel>Column type</StyledNewColumnLabel>
            <StyledNewColumnValue>
              <Dropdown.Single.Basic
                width="full"
                value={columnType}
                options={Object.keys(Explore.EExploreColumnType)
                  .map(
                    (key) =>
                      Explore.EExploreColumnType[
                        key as keyof typeof Explore.EExploreColumnType
                      ]
                  )
                  .map((value) => {
                    return {
                      value: value,
                      label: Explore.EExploreColumnTypeLabels[value],
                      isDisabled:
                        Explore.EExploreColumnTypeDisabled[value].disabled,
                    };
                  })}
                onChange={(value) => setColumnType(value)}
              />
            </StyledNewColumnValue>
            {columnType === Explore.EExploreColumnType.EPV && (
              <>
                <StyledNewColumnLabel>Property type</StyledNewColumnLabel>
                <StyledNewColumnValue>
                  {propertyType ? (
                    <EntityTag
                      fullWidth
                      entity={propertyType}
                      unlinkButton={{
                        onClick: () => setPropertyType(undefined),
                      }}
                      disableDoubleClick
                    />
                  ) : (
                    <EntitySuggester
                      categoryTypes={[EntityEnums.Class.Concept]}
                      onPicked={(entity) => setPropertyType(entity)}
                    />
                  )}
                </StyledNewColumnValue>
              </>
            )}
            <StyledNewColumnLabel>
              <MdOutlineEdit size={14} style={{ marginRight: "0.3rem" }} />
              Editable
            </StyledNewColumnLabel>
            <StyledNewColumnValue>
              <Checkbox
                value={editable}
                onChangeFn={(value) => setEditable(value)}
              />
            </StyledNewColumnValue>
          </StyledNewColumnContent>

          <span
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <ButtonGroup style={{ marginLeft: "1rem", marginTop: "1rem" }}>
              <Button
                color="warning"
                label="cancel"
                onClick={() => setIsNewColumnOpen(false)}
              />
              <Button
                label="create column"
                onClick={handleCreateColumn}
                disabled={
                  !columnName.length ||
                  (columnType === Explore.EExploreColumnType.EPV &&
                    !propertyTypeId)
                }
              />
            </ButtonGroup>
          </span>
        </StyledNewColumn>
      )}
    </div>
  );
};
