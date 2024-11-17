import React, { useContext, useEffect, useMemo, useState } from "react";

import { EntityEnums } from "@shared/enums";
import {
  IEntity,
  IProp,
  IResponseQuery,
  IResponseQueryEntity,
} from "@shared/types";
import { Explore } from "@shared/types/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup, Checkbox, Input } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import { CMetaProp } from "constructors";
import { FaTrashAlt } from "react-icons/fa";
import { GrClose } from "react-icons/gr";
import { MdOutlineEdit } from "react-icons/md";
import { TbColumnInsertRight } from "react-icons/tb";
import Scrollbar from "react-scrollbars-custom";
import { ThemeContext } from "styled-components";
import useResizeObserver from "use-resize-observer";
import { v4 as uuidv4 } from "uuid";
import { ExploreAction, ExploreActionType } from "../state";
import { ExplorerTableRow } from "./ExplorerTableRow";
import { ExplorerTableRowExpanded } from "./ExplorerTableRowExpanded/ExplorerTableRowExpanded";
import {
  StyledColumn,
  StyledHeader,
  StyledNewColumn,
  StyledNewColumnContent,
  StyledNewColumnHeader,
  StyledNewColumnLabel,
  StyledNewColumnValue,
  StyledRow,
  StyledTableWrapper,
} from "./ExplorerTableStyles";
import ExploreTableControl from "./ExploreTableControl";
import { BatchAction, batchOptions } from "./types";

const WIDTH_COLUMN_DEFAULT = 800;
const HEIGHT_ROW_DEFAULT = 40;

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
}
export const ExplorerTable: React.FC<ExplorerTable> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  queryError,
  height: heightBox,
}) => {
  const { entities, total: incomingTotal } = data ?? {
    entities: [],
    total: 0,
  };

  const { columns, filters, limit, offset, sort, view } = state;

  const [total, setTotal] = useState(0);
  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

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

  const handleChangeLimit = (newLimit: number) => {
    dispatch({ type: ExploreActionType.setLimit, payload: newLimit });
    dispatch({ type: ExploreActionType.setOffset, payload: 0 });
    setRowsExpanded([]);
  };

  const startRecord = offset + 1;
  const endRecord = Math.min(offset + limit, total);
  const pageNumber = Math.floor(offset / limit + 1);
  const canGoToPreviousPage = offset > 0;
  const canGoToNextPage = offset + limit < total;

  const toggleSortDirection = (columnId: string) => {
    if (sort && sort.columnId === columnId) {
      if (sort.direction === "asc") return "desc";
      if (sort.direction === "desc") return undefined; // No sort
    }
    return "asc";
  };

  const handleEditColumn = (
    rowEntity: IEntity,
    columnId: string,
    newEntity: IEntity
  ) => {
    const column = columns.find((column) => column.id === columnId);

    if (column) {
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
    }
  };

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
  //       <Dropdown.Single.Basic
  //         width={50}
  //         value={limit.toString()}
  //         options={[5, 10, 20, 50, 100].map((number) => {
  //           return {
  //             value: number.toString(),
  //             label: number.toString(),
  //           };
  //         })}
  //         onChange={(value) => handleChangeLimit(Number(value))}
  //       />
  //     </StyledPagination>
  //   );
  // };

  const [batchActionSelected, setBatchActionSelected] = useState<BatchAction>(
    batchOptions[0].value
  );

  // const renderTableFooter = () => {
  //   return <StyledTableFooter>{renderPaging()}</StyledTableFooter>;
  // };

  const [rowsExpanded, setRowsExpanded] = useState<string[]>([]);

  const themeContext = useContext(ThemeContext);

  const {
    ref: contentRef,
    width: contentWidth,
    height: contentHeight,
  } = useResizeObserver();

  const spaceTableBody = heightBox - 150;

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [lastClickedIndex, setLastClickedIndex] = useState<number>(-1);

  const handleRowSelect = (rowId: string) => {
    if (selectedRows.includes(rowId)) {
      setSelectedRows(
        selectedRows.filter((selectedRow) => selectedRow !== rowId)
      );
    } else {
      setSelectedRows([...selectedRows, rowId]);
    }
  };

  const handleScrollTable = (values: any) => {
    const newOffset = Math.floor(values.scrollTop / HEIGHT_ROW_DEFAULT);
    dispatch({ type: ExploreActionType.setOffset, payload: newOffset });
  };

  const widthTable = useMemo(() => {
    return columns.length * WIDTH_COLUMN_DEFAULT + 200;
  }, [columns]);

  const handleSelection = (rowIndex: number): string[] => {
    let selectedQueryEntities: IResponseQueryEntity[] = [];
    if (lastClickedIndex < rowIndex) {
      selectedQueryEntities = entities.slice(lastClickedIndex, rowIndex + 1);
    } else {
      // is bigger than - oposite direction of selection
      selectedQueryEntities = entities.slice(rowIndex, lastClickedIndex + 1);
    }
    return selectedQueryEntities.map((queryEntity) => queryEntity.entity.id);
  };

  const [scrollTableX, setScrollTableX] = useState<number>(0);

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
          selectedRows={selectedRows}
          setSelectedRows={setSelectedRows}
          entities={entities}
          setLastClickedIndex={setLastClickedIndex}
        />

        {/* <div
          style={{
            overflowX: "scroll",
            overflowY: "hidden",
            width: "100%",
          }}
        > */}
        <Scrollbar
          style={{
            width: contentWidth,
            height: contentHeight,
          }}
          onScrollStop={(values) => {
            // @ts-ignore
            setScrollTableX(values.scrollLeft);
          }}
          noScrollY
        >
          {/* HEADER */}
          <StyledHeader
            style={{
              width: widthTable,
            }}
          >
            <StyledColumn $isHeader={true} $width={250}></StyledColumn>
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
                        icon={<FaTrashAlt color={"white"} />}
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
                  left: scrollTableX + (contentWidth ?? 0) - 10,
                  // position: "relative",
                  // height: spaceTableBody,
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
            // thumbYProps={{
            //   renderer: (props) => {
            //     const { elementRef, style, ...restProps } = props;

            //     const thumbStyle: React.CSSProperties = {
            //       ...style,
            //       // left: contentWidth,
            //       // position: "fixed",
            //       // width: "10px",
            //     };

            //     return (
            //       <span
            //         style={thumbStyle}
            //         {...restProps}
            //         ref={elementRef}
            //         className="thumbY"
            //       />
            //     );
            //   },
            // }}
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

              const responseEntityId: string | undefined =
                responseData?.entity.id ?? undefined;

              if (responseEntityId) {
                // console.log(
                //   "row",
                //   `${rowI} -> ${responseI}`,
                //   offset,
                //   responseEntityId
                // );
              }

              return (
                <React.Fragment key={`${rowI}`}>
                  <StyledRow
                    $width={widthTable}
                    $height={HEIGHT_ROW_DEFAULT}
                    onClick={() =>
                      rowsExpanded.includes(responseEntityId)
                        ? setRowsExpanded(
                            rowsExpanded.filter((r) => r !== responseEntityId)
                          )
                        : setRowsExpanded(rowsExpanded.concat(responseEntityId))
                    }
                    $isOdd={isOdd}
                    $isSelected={selectedRows.includes(responseEntityId)}
                  >
                    <ExplorerTableRow
                      responseData={responseData}
                      columns={columns}
                      handleEditColumn={handleEditColumn}
                      updateEntityMutation={updateEntityMutation}
                    />
                  </StyledRow>

                  {rowsExpanded.includes(responseEntityId) && (
                    <ExplorerTableRowExpanded
                      rowEntity={responseData.entity}
                      columns={columns}
                      isOdd={isOdd}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </Scrollbar>
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
