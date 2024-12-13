import { useMutation, useQueryClient } from "@tanstack/react-query";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FaEye, FaEyeSlash, FaTrashAlt } from "react-icons/fa";
import { GrClose } from "react-icons/gr";
import { MdOutlineEdit } from "react-icons/md";
import { TbColumnInsertRight } from "react-icons/tb";
import Scrollbar from "react-scrollbars-custom";
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
import MemoizedExplorerTableRow from "./ExplorerTableRow";
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
}
export const ExplorerTable: React.FC<ExplorerTable> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  queryError,
  height: heightBox,
  onExport,
}) => {
  const { entities, total: incomingTotal } = data ?? {
    entities: [],
    total: 0,
  };

  const rowIndices = useMemo(() => {
    return Array.from({ length: incomingTotal }).map((_, i) => i);
  }, [incomingTotal]);

  const { columns, filters, limit, offset, sort, view } = state;

  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

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

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["query"],
      });
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

  const toggleSortDirection = (columnId: string) => {
    if (sort && sort.columnId === columnId) {
      if (sort.direction === "asc") return "desc";
      if (sort.direction === "desc") return undefined; // No sort
    }
    return "asc";
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

  // const renderPaging = () => {
  //   return (
  //     <StyledPagination style={{ display: "flex", alignItems: "center" }}>
  //       <span
  //         style={{ marginRight: "1rem" }}
  //       >{`page ${pageNumber} of ${totalPages}`}</span>
  //       <span
  //         style={{ marginRight: "1rem" }}
  //       >{`records ${startRecord}-${endRecord} of ${total}`}</span>
  //       {state.limit < total && (
  //         <span
  //           style={{
  //             display: "inline-grid",
  //             gap: "0.5rem",
  //             gridTemplateColumns: "repeat(4,auto)",
  //             marginRight: "1rem",
  //           }}
  //         >
  //           <Button
  //             onClick={handleFirstPage}
  //             disabled={!canGoToPreviousPage}
  //             icon={<LuChevronFirst size={13} />}
  //             inverted
  //             color="greyer"
  //             radiusLeft
  //             radiusRight
  //           />
  //           <Button
  //             onClick={handlePreviousPage}
  //             disabled={!canGoToPreviousPage}
  //             icon={<LuChevronLeft size={13} />}
  //             inverted
  //             color="greyer"
  //             radiusLeft
  //             radiusRight
  //           />
  //           <Button
  //             onClick={handleNextPage}
  //             disabled={!canGoToNextPage}
  //             icon={<LuChevronRight size={13} />}
  //             inverted
  //             color="greyer"
  //             radiusLeft
  //             radiusRight
  //           />
  //           <Button
  //             onClick={handleLastPage}
  //             disabled={!canGoToNextPage}
  //             icon={<LuChevronLast size={13} />}
  //             inverted
  //             color="greyer"
  //             radiusLeft
  //             radiusRight
  //           />
  //         </span>
  //       )}
  //     </StyledPagination>
  //   );
  // };

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

  const handleScrollTable = (values: any) => {
    checkVisibility();
  };

  const handleExport = () => {
    onExport(rowsSelected);
  };

  const widthTable = useMemo(() => {
    return columns.length * WIDTH_COLUMN_DEFAULT + WIDTH_COLUMN_FIRST;
  }, [columns]);

  const rowsRefs = useRef<HTMLDivElement[]>([]);
  const refTable = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<string[]>([]);

  useEffect(() => {
    setTimeout(() => {
      checkVisibility();
    }, 100);
  }, [contentHeight]);

  const checkVisibility = () => {
    if (!refTable.current) return;

    const containerRect = refTable.current.getBoundingClientRect();
    const visible = rowsRefs.current
      .filter((item) => {
        if (!item) return false;
        const itemRect = item.getBoundingClientRect();

        // Check if item at least partly visible
        return (
          itemRect.top < containerRect.bottom &&
          itemRect.bottom > containerRect.top
        );
      })
      .map((item) => item.id);

    setVisibleItems(visible);
  };

  useEffect(() => {
    if (visibleItems.length === 0) return;

    const indices = visibleItems.map((item) => parseInt(item));
    const topItem = Math.min(...indices);
    const bottomItem = Math.max(...indices);

    const newOffset = topItem;
    const newLimit = bottomItem - topItem + 1;

    // console.log("new scroll items", newOffset, newLimit, visibleItems);

    if (newOffset !== offset || newLimit !== limit) {
      dispatch({
        type: ExploreActionType.setLimitAndOffset,
        payload: { offset: newOffset, limit: newLimit },
      });
    }
  }, [visibleItems.join("-")]);

  const [scrollTableX, setScrollTableX] = useState<number>(0);
  const [scrollTableXScrolling, setScrollTableXScrolling] =
    useState<boolean>(false);

  const scrollYLeft = useMemo<number>(() => {
    if (scrollTableXScrolling) {
      return -10;
    } else {
      return scrollTableX + (contentWidth ?? 0) - 10;
    }
  }, [contentWidth, scrollTableX, scrollTableXScrolling]);

  return (
    <div
      style={{
        height: heightBox - 20,
        margin: "1rem",
        overflow: "hidden",
      }}
      ref={contentRef}
    >
      <StyledTableWrapper>
        <ExploreTableControl
          setIsNewColumnOpen={setIsNewColumnOpen}
          isNewColumnOpen={isNewColumnOpen}
          batchActionSelected={batchActionSelected}
          setBatchActionSelected={setBatchActionSelected}
          rowsSelected={rowsSelected}
          entities={entities}
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
          onScroll={() => {
            setScrollTableXScrolling(true);
          }}
          onScrollStop={(values) => {
            // @ts-ignore
            setScrollTableX(values.scrollLeft);
            setScrollTableXScrolling(false);
          }}
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

                    {/* SORT */}
                    {/* <span style={{ marginLeft: "0.5rem" }}>
                            <Button
                              noBorder
                              noBackground
                              inverted
                              icon={
                                sort && sort.columnId === column.id ? (
                                  sort.direction === "asc" ? (
                                    <FaSortUp color={"white"} />
                                  ) : sort.direction === "desc" ? (
                                    <FaSortDown color={"white"} />
                                  ) : (
                                    <FaSort color={"white"} />
                                  )
                                ) : (
                                  <FaSort color={"white"} />
                                  )
                              }
                              onClick={() => {
                                const newDirection = toggleSortDirection(column.id);
                                dispatch({
                                  type: ExploreActionType.sort,
                                  payload:
                                    newDirection === undefined
                                      ? undefined
                                      : {
                                          columnId: column.id,
                                          direction: newDirection,
                                        },
                                });
                              }}
                              tooltipLabel="sort"
                              />
                              </span> */}

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
          <StyledBody ref={refTable}>
            <Scrollbar
              style={{
                width: widthTable,
                height: spaceTableBody,
              }}
              trackYProps={{
                renderer: (props) => {
                  const { elementRef, style, ...restProps } = props;
                  const trackStyle: React.CSSProperties = {
                    ...style,
                    left: scrollYLeft,
                  };

                  return (
                    <span
                      {...restProps}
                      style={{ ...trackStyle }}
                      ref={elementRef}
                      className="trackY"
                    />
                  );
                },
              }}
              noScrollX
              onScrollStop={(values) => {
                handleScrollTable(values);
              }}
            >
              {/* ROWS */}
              {Array.from({ length: total }).map((_, rowI) => {
                const responseI = rowI - offset;
                const isOdd = Boolean(rowI % 2);

                const responseData: IResponseQueryEntity | undefined =
                  entities[responseI];

                const isVisible = visibleItems.includes(rowI.toString());
                const isSelected = rowsSelected.includes(rowI);
                const isExpanded = rowsExpanded.includes(rowI);

                return (
                  <StyledRowWrapper
                    key={`${rowI}`}
                    ref={(el) => {
                      // @ts-ignore
                      rowsRefs.current[rowI] = el;
                    }}
                    id={`${rowI}`}
                  >
                    <StyledRow
                      $width={widthTable}
                      $height={HEIGHT_ROW_DEFAULT}
                      $isOdd={isOdd}
                      $isSelected={isSelected}
                    >
                      {isVisible && (
                        <MemoizedExplorerTableRow
                          rowId={rowI}
                          responseData={responseData}
                          columns={columns}
                          handleEditColumn={handleEditColumn}
                          onRowSelect={handleRowSelect}
                          onExpand={handleRowExpand}
                          isSelected={isSelected}
                          isLastClicked={rowLastClicked === rowI}
                          isExpanded={isExpanded}
                        />
                      )}
                    </StyledRow>

                    {isExpanded && responseData && (
                      <ExplorerTableRowExpanded
                        rowEntity={responseData.entity}
                        columns={columns}
                        isOdd={isOdd}
                      />
                    )}
                  </StyledRowWrapper>
                );
              })}
            </Scrollbar>
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