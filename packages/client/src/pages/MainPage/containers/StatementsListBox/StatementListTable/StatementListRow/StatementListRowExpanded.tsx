import React, { useState } from "react";
import { useQuery } from "react-query";
import { useSearchParams } from "hooks";
import { Cell, ColumnInstance, Row, useTable } from "react-table";
import { ActantTag } from "../../../";

import { IActant, IAction, ILabel, IStatementActant } from "@shared/types";
import api from "api";
import { StyledSubRow } from "./StatementListRowStyles";
import { StyledTr, StyledTd } from "./StatementListRowStyles";

interface StatementListRowExpanded {
  row: Row;
  visibleColumns: ColumnInstance<{}>[];
}
export const StatementListRowExpanded: React.FC<StatementListRowExpanded> = ({
  row,
  visibleColumns,
}) => {
  const [actants, setActants] = useState<IStatementActant[]>([]);

  const {
    actantId,
    setActantId,
    setStatementId,
    setTerritoryId,
  } = useSearchParams();

  const renderRowSubComponent = React.useCallback(
    ({ row }) => {
      const {
        actions,
        actants,
        text,
        note,
        references,
        tags,
      } = row.values.data;
      return (
        <>
          <StyledSubRow id={`statement${row.values.id}`}>
            {row.cells.map((cell: Cell) => {
              if (
                [
                  "exp-actions",
                  "exp-actants",
                  "exp-references",
                  "exp-tags",
                ].includes(cell.column.id)
              ) {
                return (
                  <StyledTd {...cell.getCellProps()}>
                    {cell.render("Cell")}
                  </StyledTd>
                );
              }
            })}
          </StyledSubRow>
        </>
      );
    },
    [actants]
  );

  return (
    <tr>
      <td colSpan={visibleColumns.length + 1}>
        {renderRowSubComponent({ row })}
      </td>
    </tr>
  );
};
