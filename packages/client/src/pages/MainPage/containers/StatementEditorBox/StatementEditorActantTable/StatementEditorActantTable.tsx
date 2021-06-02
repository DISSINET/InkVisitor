import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Column, useTable, useExpanded, Row, Cell } from "react-table";
import update from "immutability-helper";
import {
  StyledTable,
  StyledTHead,
  StyledTh,
} from "./StatementEditorActantTableStyles";
import { StatementEditorActantTableRow } from "./StatementEditorActantTableRow/StatementEditorActantTableRow";
import { IActant, IResponseStatement, IStatementActant } from "@shared/types";
import { ActantSuggester, ActantTag, CertaintyToggle, ElvlToggle } from "../..";
import { Button, Input } from "components";
import { FaTrashAlt, FaUnlink } from "react-icons/fa";
import { useQueryClient } from "react-query";
import api from "api";
import { actantPositionDict } from "@shared/dictionaries";

interface FilteredActantObject {
  data: { actant: IActant | undefined; sActant: IStatementActant };
}
interface StatementEditorActantTable {
  statement: IResponseStatement;
  statementId: string;
  handleRowClick?: Function;
  classEntitiesActant: string[];
}
export const StatementEditorActantTable: React.FC<StatementEditorActantTable> =
  ({
    statement,
    statementId,
    handleRowClick = () => {},
    classEntitiesActant,
  }) => {
    const queryClient = useQueryClient();

    const [filteredActants, setFilteredActants] = useState<
      FilteredActantObject[]
    >([]);

    useEffect(() => {
      const filteredActants = statement.data.actants.map((sActant, key) => {
        const actant = statement.actants.find((a) => a.id === sActant.actant);
        return { id: key, data: { actant, sActant } };
      });
      setFilteredActants(filteredActants);
    }, [statement]);

    const updateActant = (statementActantId: string, changes: any) => {
      if (statement && statementActantId) {
        const updatedActants = statement.data.actants.map((a) =>
          a.id === statementActantId ? { ...a, ...changes } : a
        );
        const newData = { actants: updatedActants };
        updateApiCall(newData);
      }
    };
    const removeActant = (statementActantId: string) => {
      if (statement) {
        const updatedActants = statement.data.actants.filter(
          (a) => a.id !== statementActantId
        );
        const newData = { actants: updatedActants };
        updateApiCall(newData);
      }
    };

    const updateActantsOrder = () => {
      const actants: IStatementActant[] = filteredActants.map(
        (filteredActant) => filteredActant.data.sActant
      );
      updateApiCall({
        actants: actants,
      });
    };

    const updateApiCall = async (changes: object) => {
      const res = await api.actantsUpdate(statementId, {
        data: changes,
      });
      queryClient.invalidateQueries(["statement"]);
    };

    const columns: Column<{}>[] = useMemo(() => {
      return [
        {
          Header: "ID",
          accessor: "id",
        },
        {
          Header: "Actant",
          accessor: "data",
          Cell: ({ row }: Cell) => {
            const { actant, sActant } = row.values.data;
            return actant ? (
              <ActantTag
                actant={actant}
                short={false}
                button={
                  <Button
                    key="d"
                    tooltip="unlink actant"
                    icon={<FaUnlink />}
                    color="danger"
                    onClick={() => {
                      updateActant(sActant.id, {
                        actant: "",
                      });
                    }}
                  />
                }
              />
            ) : (
              <ActantSuggester
                onSelected={(newSelectedId: string) => {
                  updateActant(sActant.id, {
                    actant: newSelectedId,
                  });
                }}
                categoryIds={classEntitiesActant}
              />
            );
          },
        },
        {
          Header: "Position",
          Cell: ({ row }: Cell) => {
            const { sActant } = row.values.data;
            return (
              <Input
                type="select"
                value={sActant.position}
                options={actantPositionDict}
                onChangeFn={(newPosition: any) => {
                  updateActant(sActant.id, {
                    position: newPosition,
                  });
                }}
              />
            );
          },
        },
        {
          Header: "Attributes",
          Cell: ({ row }: Cell) => {
            const { sActant } = row.values.data;
            return (
              <>
                <ElvlToggle
                  value={sActant.elvl}
                  onChangeFn={(newValue: string) => {
                    updateActant(sActant.id, {
                      elvl: newValue,
                    });
                  }}
                />
                <CertaintyToggle
                  value={sActant.certainty}
                  onChangeFn={(newValue: string) => {
                    updateActant(sActant.id, {
                      certainty: newValue,
                    });
                  }}
                />
              </>
            );
          },
        },
        {
          Header: "",
          id: "expander",
          Cell: ({ row }: Cell) => (
            <Button
              key="d"
              icon={<FaTrashAlt />}
              color="danger"
              tooltip="remove actant row"
              onClick={() => {
                removeActant(row.values.data.sActant.id);
              }}
            />
          ),
        },
      ];
    }, [filteredActants]);

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
                moveRow={moveRow}
                updateOrderFn={updateActantsOrder}
                {...row.getRowProps()}
              />
            );
          })}
        </tbody>
      </StyledTable>
    );
  };
