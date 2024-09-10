import React, { useContext, useMemo, useState } from "react";

import { EntityEnums } from "@shared/enums";
import { IEntity, IResponseQuery, IResponseQueryEntity } from "@shared/types";
import { Explore } from "@shared/types/query";
import { Button, ButtonGroup, Checkbox, Input } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import { FaTrashAlt } from "react-icons/fa";
import { MdOutlineEdit } from "react-icons/md";
import { TbColumnInsertRight } from "react-icons/tb";
import { v4 as uuidv4 } from "uuid";
import { ExploreAction, ExploreActionType } from "../state";
import {
  StyledEmpty,
  StyledGrid,
  StyledGridColumn,
  StyledGridHeader,
  StyledNewColumn,
  StyledNewColumnGrid,
  StyledNewColumnLabel,
  StyledNewColumnValue,
  StyledTableHeader,
} from "./ExplorerTableStyles";
import { ThemeContext } from "styled-components";
import { classesAll } from "@shared/dictionaries/entity";

const initialState: {
  name: string;
  type: Explore.EExploreColumnType;
  editable: boolean;
  propertyType: false | IEntity;
} = {
  name: "",
  type: Explore.EExploreColumnType.EPV,
  editable: false,
  propertyType: false,
};
interface ExplorerTable {
  state: Explore.IExplore;
  dispatch: React.Dispatch<ExploreAction>;
  // entities: IResponseQueryEntity[];
  data: IResponseQuery;
  isQueryFetching: boolean;
  queryError: Error | null;
}
export const ExplorerTable: React.FC<ExplorerTable> = ({
  state,
  dispatch,
  // entities,
  data,
  isQueryFetching,
  queryError,
}) => {
  const { entities, explore, query } = data;
  const { columns, filters, limit, offset, sort, view } = state;

  // const entities = useMemo(() => data.entities, [data]);

  const [columnName, setColumnName] = useState(initialState.name);
  const [columnType, setColumnType] = useState(initialState.type);
  const [propertyType, setPropertyType] = useState<IEntity | false>(
    initialState.propertyType
  );
  const [editable, setEditable] = useState(initialState.editable);

  const getNewColumn = () => {
    return {
      id: uuidv4(),
      name: columnName.length
        ? columnName
        : Explore.EExploreColumnTypeLabels[columnType],
      type: columnType,
      editable: editable,
      params: {
        [Explore.EExploreColumnType.EPV]: { propertyType: propertyType },
      },
    };
  };

  const handleClearLocalState = () => {
    setColumnName(initialState.name);
    setColumnType(initialState.type);
    setEditable(initialState.editable);
    setPropertyType(initialState.propertyType);
  };

  const handleCreateColumn = () => {
    dispatch({
      type: ExploreActionType.addColumn,
      payload: getNewColumn(),
    });
    handleClearLocalState();
    // setShowNewColumn(false);
  };

  const themeContext = useContext(ThemeContext);

  return (
    <div style={{ padding: "1rem" }}>
      <StyledTableHeader>
        <span style={{ marginRight: "1rem" }}>records: {entities.length}</span>
        <span style={{ marginRight: "1rem" }}>offset: {state.offset}</span>
        <span style={{ marginRight: "1rem" }}>limit: {state.limit}</span>
        {state.limit < entities.length && (
          <span>
            <Button
              // onClick={(): void => gotoPage(0)}
              // disabled={!canPreviousPage}
              label={"<<"}
              inverted
              color="greyer"
            />

            <Button
              // onClick={(): void => previousPage()}
              // disabled={!canPreviousPage}
              label={"<"}
              inverted
              color="greyer"
            />

            {/* <StyledPageNumber>
              {pageIndex + 1}/{pageOptions.length}
            </StyledPageNumber> */}

            <Button
              // onClick={(): void => nextPage()}
              // disabled={!canNextPage}
              label={">"}
              inverted
              color="greyer"
            />

            <Button
              // onClick={(): void => gotoPage(pageCount - 1)}
              // disabled={!canNextPage}
              label={">>"}
              inverted
              color="greyer"
            />
          </span>
        )}
      </StyledTableHeader>
      <div style={{ display: "flex", overflow: "auto" }}>
        <StyledGrid $columns={columns.length + 1}>
          {/* HEADER */}
          <StyledGridHeader>{/* entities */}</StyledGridHeader>
          {columns.map((column, key) => {
            return (
              <StyledGridHeader key={key}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {column.editable && (
                    <MdOutlineEdit
                      size={14}
                      style={{ marginRight: "0.3rem" }}
                    />
                  )}
                  {column.name}
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
              </StyledGridHeader>
            );
          })}

          {entities.map((record, key) => {
            return (
              // ROW
              <React.Fragment key={key}>
                <StyledGridColumn>
                  <span>
                    <EntityTag entity={record.entity} />
                  </span>
                </StyledGridColumn>
                {columns.map((column, key) => {
                  return (
                    <StyledGridColumn key={key}>
                      {record.columnData[column.id] ? (
                        (record.columnData[column.id] as Array<IEntity>).map(
                          (entity, key) => {
                            return (
                              <React.Fragment key={key}>
                                <span>
                                  <EntityTag
                                    entity={entity}
                                    // TODO: unlink from explore state
                                    // unlinkButton={editable && {
                                    //   onClick: () =>
                                    // }}
                                  />
                                </span>
                              </React.Fragment>
                            );
                          }
                        )
                      ) : (
                        <StyledEmpty>{"empty"}</StyledEmpty>
                      )}

                      {column.editable && (
                        <EntitySuggester
                          categoryTypes={classesAll}
                          // TODO: add to explore state
                          // onPicked={}
                        />
                      )}
                    </StyledGridColumn>
                  );
                })}
              </React.Fragment>
            );
          })}
        </StyledGrid>

        {state.view.showNewColumn && (
          <StyledNewColumn>
            <StyledGridHeader $greyBackground>
              <span style={{ display: "flex", alignItems: "center" }}>
                <TbColumnInsertRight size={17} />
                <p style={{ marginLeft: "0.5rem" }}>New column</p>
              </span>
            </StyledGridHeader>
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
                        unlinkButton={{ onClick: () => setPropertyType(false) }}
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
                  onClick={() =>
                    dispatch({ type: ExploreActionType.hideNewColumn })
                  }
                />
                <Button
                  label="create column"
                  onClick={handleCreateColumn}
                  disabled={
                    !columnName.length ||
                    (columnType === Explore.EExploreColumnType.EPV &&
                      !propertyType)
                  }
                />
              </ButtonGroup>
            </span>
          </StyledNewColumn>
        )}
      </div>
    </div>
  );
};
