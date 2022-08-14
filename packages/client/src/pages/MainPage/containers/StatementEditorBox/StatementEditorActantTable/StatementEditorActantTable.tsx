import { EntityClass } from "@shared/enums";
import { IEntity, IResponseStatement, IStatementActant } from "@shared/types";
import update from "immutability-helper";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { UseMutationResult } from "react-query";
import { Column, Row, useExpanded, useTable } from "react-table";
import { StatementEditorActantTableRow } from "./StatementEditorActantTableRow";
import {
  StyledTable,
  StyledTh,
  StyledTHead,
} from "./StatementEditorActantTableStyles";

interface FilteredActantObject {
  data: { actant: IEntity | undefined; sActant: IStatementActant };
}
interface StatementEditorActantTable {
  statement: IResponseStatement;
  statementId: string;
  userCanEdit?: boolean;
  handleRowClick?: Function;
  classEntitiesActant: EntityClass[];
  updateStatementDataMutation: UseMutationResult<any, unknown, object, unknown>;
  addProp: (originId: string) => void;
  updateProp: (propId: string, changes: any) => void;
  removeProp: (propId: string) => void;
  movePropToIndex: (propId: string, oldIndex: number, newIndex: number) => void;
  territoryParentId?: string;
}
export const StatementEditorActantTable: React.FC<
  StatementEditorActantTable
> = ({
  statement,
  statementId,
  userCanEdit = false,
  handleRowClick = () => {},
  classEntitiesActant,
  updateStatementDataMutation,
  addProp,
  updateProp,
  removeProp,
  movePropToIndex,
  territoryParentId,
}) => {
  const [filteredActants, setFilteredActants] = useState<
    FilteredActantObject[]
  >([]);

  useMemo(() => {
    const filteredActants = statement.data.actants.map((sActant, key) => {
      const actant = statement.entities[sActant.entityId];
      return { id: key, data: { actant, sActant } };
    });
    setFilteredActants(filteredActants);
  }, [statement]);

  const updateActantsOrder = () => {
    if (userCanEdit) {
      const actants: IStatementActant[] = filteredActants.map(
        (filteredActant) => filteredActant.data.sActant
      );
      if (JSON.stringify(statement.data.actants) !== JSON.stringify(actants)) {
        updateStatementDataMutation.mutate({ actants });
      }
    }
  };

  const columns: Column<{}>[] = useMemo(() => {
    return [
      {
        Header: "ID",
        accessor: "id",
      },
      {
        Header: "",
        accessor: "data",
      },
      {
        Header: "",
        id: "position",
      },
      {
        id: "Attributes",
      },
    ];
  }, [filteredActants, updateStatementDataMutation.isLoading]);

  const getRowId = useCallback((row) => {
    return row.id;
  }, []);
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
  } = useTable(
    {
      columns,
      data: filteredActants,
      getRowId,
      initialState: {
        hiddenColumns: ["id"],
      },
    },
    useExpanded
  );

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRecord = filteredActants[dragIndex];
      setFilteredActants(
        update(filteredActants, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragRecord],
          ],
        })
      );
    },
    [filteredActants]
  );

  return (
    <>
      {rows.length > 0 && (
        <StyledTable {...getTableProps()}>
          <StyledTHead>
            {headerGroups.map((headerGroup, key) => (
              <tr {...headerGroup.getHeaderGroupProps()} key={key}>
                <th></th>
                {headerGroup.headers.map((column, key) => (
                  <StyledTh {...column.getHeaderProps()} key={key}>
                    {column.render("Header")}
                  </StyledTh>
                ))}
              </tr>
            ))}
          </StyledTHead>
          <tbody {...getTableBodyProps()}>
            {rows.map((row: Row, i: number) => {
              prepareRow(row);
              return (
                <StatementEditorActantTableRow
                  handleClick={handleRowClick}
                  index={i}
                  row={row}
                  statement={statement}
                  moveRow={moveRow}
                  userCanEdit={userCanEdit}
                  updateOrderFn={updateActantsOrder}
                  visibleColumns={visibleColumns}
                  classEntitiesActant={classEntitiesActant}
                  updateStatementDataMutation={updateStatementDataMutation}
                  addProp={addProp}
                  updateProp={updateProp}
                  removeProp={removeProp}
                  movePropToIndex={movePropToIndex}
                  territoryParentId={territoryParentId}
                  {...row.getRowProps()}
                />
              );
            })}
          </tbody>
        </StyledTable>
      )}
    </>
  );
};
