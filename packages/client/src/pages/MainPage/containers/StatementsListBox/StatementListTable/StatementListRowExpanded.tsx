import { IStatementActant } from "@shared/types";
import { useSearchParams } from "hooks";
import React, { useState } from "react";
import { Cell, ColumnInstance, Row } from "react-table";
import { StyledSubRow, StyledSubRowTd } from "./StatementListTableStyles";

interface StatementListRowExpanded {
  row: Row;
  visibleColumns: ColumnInstance<{}>[];
}
export const StatementListRowExpanded: React.FC<StatementListRowExpanded> = ({
  row,
  visibleColumns,
}) => {
  const [actants, setActants] = useState<IStatementActant[]>([]);

  const { detailId, setDetailId, setStatementId, setTerritoryId } =
    useSearchParams();

  const renderRowSubComponent = React.useCallback(
    ({ row }) => {
      const { actions, actants, text, note, references, tags } =
        row.values.data;
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
                  <StyledSubRowTd {...cell.getCellProps()}>
                    {cell.render("Cell")}
                  </StyledSubRowTd>
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
