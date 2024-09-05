import React from "react";

import { IResponseQuery } from "@shared/types";
import { Explore } from "@shared/types/query";
import { Button } from "components";
import { TbColumnInsertRight } from "react-icons/tb";
import { StyledGrid, StyledGridHeader } from "./ExplorerTableStyles";

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

  return (
    <>
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
                () => {}
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
    </>
  );
};
