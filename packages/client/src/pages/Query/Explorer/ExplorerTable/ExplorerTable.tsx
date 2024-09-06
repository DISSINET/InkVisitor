import React, { useState } from "react";

import { EntityEnums } from "@shared/enums";
import { IEntity, IResponseQuery } from "@shared/types";
import { Explore } from "@shared/types/query";
import { Button, ButtonGroup, Checkbox, Input } from "components";
import Dropdown, { EntitySuggester, EntityTag } from "components/advanced";
import { TbColumnInsertRight } from "react-icons/tb";
import {
  StyledGrid,
  StyledGridHeader,
  StyledNewColumn,
  StyledNewColumnGrid,
  StyledNewColumnLabel,
  StyledNewColumnValue,
} from "./ExplorerTableStyles";

interface Column {
  header: string;
  accessor: string;
}
const intialColumns: Column[] = [
  {
    header: "Class",
    accessor: "class",
  },
  {
    header: "Label",
    accessor: "label",
  },
];
const dataTemp = [
  {
    id: "asdad-aswead-xxx",
    class: "concept",
    label: "jedna",
  },
  {
    id: "asdad-aswead-yyy",
    class: "action",
    label: "dva",
  },
  {
    id: "asdad-aswead-zzz",
    class: "person",
    label: "tri",
  },
];

interface ExplorerTable {
  state: Explore.IExplore;
  dispatch: React.Dispatch<any>;
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
  const { entities, explore, query } = data;
  const { columns } = explore;

  const [columnName, setColumnName] = useState("");
  const [columnType, setColumnType] = useState(Explore.EExploreColumnType.ER);
  const [propertyType, setPropertyType] = useState<IEntity>();
  const [editable, setEditable] = useState(false);

  const [showNewColumn, setShowNewColumn] = useState(true);

  return (
    <div style={{ display: "flex", padding: "1rem" }}>
      <StyledGrid $columns={columns.length + 1}>
        {/* HEADER */}
        {columns.map((column, key) => {
          return <StyledGridHeader key={key}>{column.name}</StyledGridHeader>;
        })}
        <StyledGridHeader>
          <span>
            <Button
              icon={<TbColumnInsertRight size={17} />}
              label="new column"
              onClick={
                () => setShowNewColumn(true)
                // setColumns([
                //   ...columns,
                //   { header: "Status", accessor: "status" },
                // ])
              }
            />
          </span>
        </StyledGridHeader>

        {/* {dataTemp.map((record, key) => {
          return (
            // ROW
            <React.Fragment key={key}>
              {columns.map((column, key) => {
                return (
                  <StyledGridColumn key={key}>
                    {record[column.accessor]
                      ? record[column.accessor]
                      : "empty"}
                  </StyledGridColumn>
                );
              })}
              <StyledGridColumn></StyledGridColumn>
            </React.Fragment>
          );
        })} */}
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
            <StyledNewColumnLabel>Editable</StyledNewColumnLabel>
            <StyledNewColumnValue>
              <Checkbox
                value={editable}
                onChangeFn={(value) => setEditable(value)}
              />
            </StyledNewColumnValue>
          </StyledNewColumnGrid>

          <ButtonGroup style={{ marginLeft: "1rem", marginTop: "1rem" }}>
            <Button label="create column" />
            <Button
              color="warning"
              label="cancel"
              onClick={() => setShowNewColumn(false)}
            />
          </ButtonGroup>
        </StyledNewColumn>
      )}
    </div>
  );
};
