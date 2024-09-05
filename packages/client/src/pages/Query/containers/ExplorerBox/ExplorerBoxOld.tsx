import { Button } from "components";
import React, { useState } from "react";
import {
  StyledGrid,
  StyledGridColumn,
  StyledGridHeader,
} from "./ExplorerBoxOldStyles";
import { TbColumnInsertRight } from "react-icons/tb";

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
const data = [
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

interface ExplorerBox {}
export const ExplorerBox: React.FC<ExplorerBox> = ({}) => {
  const [columns, setColumns] = useState<Column[]>(intialColumns);

  return (
    <div>
      <StyledGrid $columns={columns.length + 1}>
        {/* HEADER */}
        {columns.map((column, key) => {
          return <StyledGridHeader key={key}>{column.header}</StyledGridHeader>;
        })}
        <StyledGridHeader>
          <span>
            <Button
              icon={<TbColumnInsertRight size={17} />}
              label="new column"
              onClick={() =>
                setColumns([
                  ...columns,
                  { header: "Status", accessor: "status" },
                ])
              }
            />
          </span>
        </StyledGridHeader>

        {data.map((record, key) => {
          return (
            // ROW
            <React.Fragment key={key}>
              {columns.map((column, key) => {
                return (
                  <StyledGridColumn key={key}>
                    {record[column.accessor]
                      ? record[column.accessor]
                      : "empty"}
                    {/* {"record[column.attr[key]]"} */}
                  </StyledGridColumn>
                );
              })}
              <StyledGridColumn></StyledGridColumn>
            </React.Fragment>
          );
        })}
      </StyledGrid>
    </div>
  );
};

export const MemoizedExplorerBox = React.memo(ExplorerBox);
