import React, { useContext, useEffect, useMemo, useState } from "react";

import { classesAll } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { IEntity, IProp, IResponseQuery, IUser } from "@shared/types";
import { Explore } from "@shared/types/query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, ButtonGroup, Checkbox, Input } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import { CMetaProp } from "constructors";
import {
  FaChevronCircleDown,
  FaChevronCircleUp,
  FaTrashAlt,
} from "react-icons/fa";
import {
  LuChevronFirst,
  LuChevronLast,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";
import { MdOutlineEdit } from "react-icons/md";
import { TbColumnInsertRight } from "react-icons/tb";
import { ThemeContext } from "styled-components";
import { v4 as uuidv4 } from "uuid";
import { ExploreAction, ExploreActionType } from "../state";
import {
  StyledGrid,
  StyledGridColumn,
  StyledGridHeader,
  StyledGridHeaderColumn,
  StyledGridRow,
  StyledNewColumn,
  StyledNewColumnGrid,
  StyledNewColumnLabel,
  StyledNewColumnValue,
  StyledPagination,
  StyledTableFooter,
  StyledTableHeader,
  StyledTableWrapper,
} from "./ExplorerTableStyles";
import { ExplorerTableRowExpanded } from "./ExplorerTableRowExpanded/ExplorerTableRowExpanded";

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
}
export const ExplorerTable: React.FC<ExplorerTable> = ({
  state,
  dispatch,
  data,
  isQueryFetching,
  queryError,
}) => {
  const { entities, total: incomingTotal } = data ?? {
    entities: [],
    total: 0,
  };
  const { columns, filters, limit, offset, sort, view } = state;

  const [total, setTotal] = useState(0);

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

  const [showNewColumn, setShowNewColumn] = useState(false);

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
    // setShowNewColumn(false);
  };

  const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);

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

  const renderPaging = () => {
    return (
      <StyledPagination style={{ display: "flex", alignItems: "center" }}>
        <span
          style={{ marginRight: "1rem" }}
        >{`page ${pageNumber} of ${totalPages}`}</span>
        <span
          style={{ marginRight: "1rem" }}
        >{`records ${startRecord}-${endRecord} of ${total}`}</span>
        {state.limit < total && (
          <span
            style={{
              display: "inline-grid",
              gap: "0.5rem",
              gridTemplateColumns: "repeat(4,auto)",
              marginRight: "1rem",
            }}
          >
            <Button
              onClick={handleFirstPage}
              disabled={!canGoToPreviousPage}
              icon={<LuChevronFirst size={13} />}
              inverted
              color="greyer"
              radiusLeft
              radiusRight
            />
            <Button
              onClick={handlePreviousPage}
              disabled={!canGoToPreviousPage}
              icon={<LuChevronLeft size={13} />}
              inverted
              color="greyer"
              radiusLeft
              radiusRight
            />
            <Button
              onClick={handleNextPage}
              disabled={!canGoToNextPage}
              icon={<LuChevronRight size={13} />}
              inverted
              color="greyer"
              radiusLeft
              radiusRight
            />
            <Button
              onClick={handleLastPage}
              disabled={!canGoToNextPage}
              icon={<LuChevronLast size={13} />}
              inverted
              color="greyer"
              radiusLeft
              radiusRight
            />
          </span>
        )}
        <Dropdown.Single.Basic
          width={50}
          value={limit.toString()}
          options={[5, 10, 20, 50, 100].map((number) => {
            return {
              value: number.toString(),
              label: number.toString(),
            };
          })}
          onChange={(value) => handleChangeLimit(Number(value))}
        />
      </StyledPagination>
    );
  };

  const renderTableHeader = () => {
    return (
      <StyledTableHeader>
        {renderPaging()}
        <div>
          <Button
            icon={<TbColumnInsertRight size={17} />}
            label="new column"
            color={showNewColumn ? "info" : "primary"}
            onClick={() => setShowNewColumn(!showNewColumn)}
          />
        </div>
      </StyledTableHeader>
    );
  };

  const renderTableFooter = () => {
    return (
      <StyledTableFooter>
        {renderPaging()}
        <div>
          <Button
            icon={<TbColumnInsertRight size={17} />}
            label="new column"
            color={showNewColumn ? "info" : "primary"}
            onClick={() => setShowNewColumn(!showNewColumn)}
          />
        </div>
      </StyledTableFooter>
    );
  };

  const renderCell = (
    recordEntity: IEntity,
    cellData:
      | IEntity
      | IEntity[]
      | number
      | number[]
      | string
      | string[]
      | IUser
      | IUser[],
    column: Explore.IExploreColumn
  ) => {
    if (Array.isArray(cellData)) {
      if (
        cellData.length > 0 &&
        typeof (cellData[0] as IEntity).class !== "undefined"
      ) {
        // is type IEntity[]
        return cellData.map((entity, key) => {
          return (
            <React.Fragment key={key}>
              <span>
                <EntityTag
                  entity={entity as IEntity}
                  unlinkButton={
                    column.editable && {
                      onClick: () => {
                        const { id } = entity as IEntity;
                        const { id: recordEntityId, props } =
                          recordEntity as IEntity;

                        const foundEntity = props.find(
                          (prop) => prop.value?.entityId === id
                        );
                        if (foundEntity) {
                          updateEntityMutation.mutate({
                            entityId: recordEntityId,
                            changes: {
                              props: props.filter(
                                (prop) => prop.id !== foundEntity.id
                              ),
                            },
                          });
                        }
                      },
                    }
                  }
                  disableDoubleClick
                />
              </span>
            </React.Fragment>
          );
        });
      } else if (
        cellData.length > 0 &&
        typeof (cellData[0] as IUser).email !== "undefined"
      ) {
        // is type IUser[]
        return (
          <div>
            <span
              style={{
                backgroundColor: "lime",
                padding: "0.3rem",
                display: "flex",
              }}
            >
              {(cellData as IUser[]).map((user) => {
                return user.name;
              })}
            </span>
          </div>
        );
      }
    } else {
      // TODO: not an array - IEntity, IUser, number, string
    }

    // return <StyledEmpty>{"empty"}</StyledEmpty>;
  };

  const [rowsExpanded, setRowsExpanded] = useState<string[]>([]);

  const themeContext = useContext(ThemeContext);

  return (
    <>
      <div style={{ display: "flex", overflow: "auto", padding: "1rem" }}>
        <StyledTableWrapper>
          {renderTableHeader()}
          <StyledGrid $columns={columns.length + 1}>
            {/* HEADER */}
            {/* TODO: sticky doesn't work */}
            <StyledGridHeader>
              <StyledGridHeaderColumn>{/* actions */}</StyledGridHeaderColumn>
              <StyledGridHeaderColumn>{/* entities */}</StyledGridHeaderColumn>
              {columns.map((column, key) => {
                return (
                  <StyledGridHeaderColumn key={key}>
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
                  </StyledGridHeaderColumn>
                );
              })}
            </StyledGridHeader>

            {entities.map((row, key) => {
              const { entity: rowEntity, columnData } = row;
              const rowId = rowEntity.id;
              const isOdd = Boolean(key % 2);
              return (
                // ROW
                <>
                  <StyledGridRow
                    key={key}
                    onClick={() =>
                      rowsExpanded.includes(rowId)
                        ? setRowsExpanded(
                            rowsExpanded.filter((r) => r !== rowId)
                          )
                        : setRowsExpanded(rowsExpanded.concat(rowId))
                    }
                    $isOdd={isOdd}
                  >
                    {/* ROW EXPANDER */}
                    <StyledGridColumn>
                      <span
                        style={{
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!rowsExpanded.includes(rowId)) {
                            setRowsExpanded(rowsExpanded.concat(rowId));
                          } else {
                            setRowsExpanded(
                              rowsExpanded.filter((r) => r !== rowId)
                            );
                          }
                        }}
                      >
                        {rowsExpanded.includes(rowEntity.id) ? (
                          <FaChevronCircleUp
                            color={themeContext?.color.warning}
                          />
                        ) : (
                          <FaChevronCircleDown />
                        )}
                      </span>
                    </StyledGridColumn>

                    <StyledGridColumn>
                      <span
                        style={{ display: "inline-flex", overflow: "hidden" }}
                      >
                        <EntityTag
                          entity={rowEntity}
                          fullWidth
                          disableDoubleClick
                        />
                      </span>
                    </StyledGridColumn>
                    {columns.map((column, key) => {
                      return (
                        <StyledGridColumn key={key}>
                          {renderCell(rowEntity, columnData[column.id], column)}

                          {column.editable &&
                            column.type === Explore.EExploreColumnType.EPV && (
                              <EntitySuggester
                                categoryTypes={classesAll}
                                onPicked={(entity) => {
                                  const params =
                                    column.params as Explore.IExploreColumnParams<Explore.EExploreColumnType.EPV>;

                                  const newProp: IProp = CMetaProp({
                                    typeEntityId: params.propertyType,
                                    valueEntityId: entity.id,
                                  });

                                  updateEntityMutation.mutate({
                                    entityId: rowEntity.id,
                                    changes: {
                                      props: [...rowEntity.props, newProp],
                                    },
                                  });
                                }}
                              />
                            )}
                        </StyledGridColumn>
                      );
                    })}
                  </StyledGridRow>

                  {rowsExpanded.includes(rowEntity.id) && (
                    <div style={{ display: "contents" }}>
                      <ExplorerTableRowExpanded
                        rowEntity={rowEntity}
                        columns={columns}
                        isOdd={isOdd}
                      />
                    </div>
                  )}
                </>
              );
            })}
          </StyledGrid>
          {/* {renderTableFooter()} */}
        </StyledTableWrapper>

        {/* NEW COLUMN */}
        {showNewColumn && (
          <StyledNewColumn>
            <StyledGridHeaderColumn $greyBackground>
              <span style={{ display: "flex", alignItems: "center" }}>
                <TbColumnInsertRight size={17} />
                <p style={{ marginLeft: "0.5rem" }}>New column</p>
              </span>
            </StyledGridHeaderColumn>
            <StyledNewColumnGrid>
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
            </StyledNewColumnGrid>

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
                  onClick={() => setShowNewColumn(false)}
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
    </>
  );
};
