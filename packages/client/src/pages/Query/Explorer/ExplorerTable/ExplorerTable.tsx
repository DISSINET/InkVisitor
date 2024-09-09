import React, { useState } from "react";

import { EntityEnums } from "@shared/enums";
import { IEntity, IResponseQuery } from "@shared/types";
import { Explore } from "@shared/types/query";
import { Button, ButtonGroup, Checkbox, Input } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import { FaTrashAlt } from "react-icons/fa";
import { TbColumnInsertRight } from "react-icons/tb";
import { v4 as uuidv4 } from "uuid";
import { ExploreAction, ExploreActionType } from "../state";
import {
  StyledGrid,
  StyledGridColumn,
  StyledGridHeader,
  StyledNewColumn,
  StyledNewColumnGrid,
  StyledNewColumnLabel,
  StyledNewColumnValue,
} from "./ExplorerTableStyles";

interface ExplorerTable {
  state: Explore.IExplore;
  dispatch: React.Dispatch<ExploreAction>;
  data: IResponseQuery;
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
  console.log(state.columns);
  const { entities, explore, query } = data;
  const { columns, filters, limit, offset, sort, view } = state;

  const [showNewColumn, setShowNewColumn] = useState(true);

  const [columnName, setColumnName] = useState("");
  const [columnType, setColumnType] = useState(Explore.EExploreColumnType.ER);
  const [propertyType, setPropertyType] = useState<IEntity | false>(false);
  const [editable, setEditable] = useState(false);

  const getNewColumn = () => {
    return {
      id: uuidv4(),
      name: columnName,
      type: columnType,
      editable: editable,
      // TODO: only for EExploreColumnType.EPV
      // propertyType: propertyType,
    };
  };

  const handleClearLocalState = () => {
    setColumnName("");
    setColumnType(Explore.EExploreColumnType.ER);
    setPropertyType(false);
    setEditable(false);
  };

  const handleCreateColumn = () => {
    dispatch({
      type: ExploreActionType.addColumn,
      payload: getNewColumn(),
    });
    handleClearLocalState();
    // setShowNewColumn(false);
  };

  return (
    <div style={{ display: "flex", padding: "1rem" }}>
      <StyledGrid $columns={columns.length + 2}>
        {/* HEADER */}
        <StyledGridHeader>entities</StyledGridHeader>
        {columns.map((column, key) => {
          return (
            <StyledGridHeader key={key}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {column.name}
                <span style={{ marginLeft: "0.5rem" }}>
                  <Button
                    noBorder
                    noBackground
                    inverted
                    icon={<FaTrashAlt />}
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
        <StyledGridHeader>
          <span>
            <Button
              icon={<TbColumnInsertRight size={17} />}
              label="new column"
              onClick={() => setShowNewColumn(true)}
              disabled={showNewColumn}
            />
          </span>
        </StyledGridHeader>

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
                    {/* {record[column.accessor]
                      ? record[column.accessor]
                      : "empty"} */}
                  </StyledGridColumn>
                );
              })}
              <StyledGridColumn></StyledGridColumn>
            </React.Fragment>
          );
        })}
      </StyledGrid>
      {showNewColumn && (
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
                      label: value,
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
                    <EntityTag fullWidth entity={propertyType} />
                  ) : (
                    <EntitySuggester
                      categoryTypes={[EntityEnums.Class.Concept]}
                      onPicked={(entity) => setPropertyType(entity)}
                    />
                  )}
                </StyledNewColumnValue>
              </>
            )}
            <StyledNewColumnLabel>Editable</StyledNewColumnLabel>
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
              <Button label="create column" onClick={handleCreateColumn} />
            </ButtonGroup>
          </span>
        </StyledNewColumn>
      )}
    </div>
  );
};
