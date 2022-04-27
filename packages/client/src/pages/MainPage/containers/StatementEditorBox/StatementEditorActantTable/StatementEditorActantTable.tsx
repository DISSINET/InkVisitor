import { EntityClass } from "@shared/enums";
import {
  IEntity,
  IResponseStatement,
  IStatementActant,
  IStatementAction,
} from "@shared/types";
import update from "immutability-helper";
import React, { useCallback, useMemo, useState } from "react";
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
}) => {
  const [filteredActants, setFilteredActants] = useState<
    FilteredActantObject[]
  >([]);

  useMemo(() => {
    const filteredActants = statement.data.actants.map((sActant, key) => {
      const actant = statement.entities[sActant.actant];
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
        id: "position",
        Header: "",
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

  const updatePropNew = (propId: string, changes: any) => {
    if (statement && propId) {
      const newStatementData = { ...statement.data };

      // this is probably an overkill
      [...newStatementData.actants, ...newStatementData.actions].forEach(
        (actant: IStatementActant | IStatementAction) => {
          actant.props.forEach((prop1, pi1) => {
            // 1st level
            if (prop1.id === propId) {
              actant.props[pi1] = { ...actant.props[pi1], ...changes };
            }

            // 2nd level
            actant.props[pi1].children.forEach((prop2, pi2) => {
              if (prop2.id === propId) {
                actant.props[pi1].children[pi2] = {
                  ...actant.props[pi1].children[pi2],
                  ...changes,
                };
              }

              // 3rd level
              actant.props[pi1].children[pi2].children.forEach((prop3, pi3) => {
                if (prop3.id === propId) {
                  actant.props[pi1].children[pi2].children[pi3] = {
                    ...actant.props[pi1].children[pi2].children[pi3],
                    ...changes,
                  };
                }
              });
            });
          });
        }
      );

      updateStatementDataMutation.mutate(newStatementData);
    }
  };

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
                  updateProp={updatePropNew}
                  removeProp={removeProp}
                  movePropToIndex={movePropToIndex}
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
