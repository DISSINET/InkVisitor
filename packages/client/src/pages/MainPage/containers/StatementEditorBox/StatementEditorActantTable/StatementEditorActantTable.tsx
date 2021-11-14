import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Column, useTable, useExpanded, Row, Cell } from "react-table";
import update from "immutability-helper";
import {
  StyledTable,
  StyledTHead,
  StyledTh,
  StyledTagWrapper,
} from "./StatementEditorActantTableStyles";
import { StatementEditorActantTableRow } from "./StatementEditorActantTableRow";
import { AttributesEditor } from "../../AttributesEditor/AttributesEditor";
import { AttributeButtonGroup } from "../../AttributeButtonGroup/AttributeButtonGroup";

import {
  IActant,
  IResponseStatement,
  IStatementActant,
  IStatementProp,
} from "@shared/types";
import { ActantSuggester, ActantTag } from "../..";
import { Button } from "components";
import { FaTrashAlt, FaUnlink, FaPlus } from "react-icons/fa";
import { UseMutationResult } from "react-query";
import { actantPositionDict } from "@shared/dictionaries";

interface FilteredActantObject {
  data: { actant: IActant | undefined; sActant: IStatementActant };
}
interface StatementEditorActantTable {
  statement: IResponseStatement;
  statementId: string;
  userCanEdit?: boolean;
  handleRowClick?: Function;
  renderPropGroup: Function;
  classEntitiesActant: string[];
  updateActantsMutation: UseMutationResult<any, unknown, object, unknown>;
  addProp: (originId: string) => void;
  propsByOrigins: {
    [key: string]: {
      type: "action" | "actant";
      origin: string;
      props: IStatementProp[];
      actant: IActant;
    };
  };
}
export const StatementEditorActantTable: React.FC<StatementEditorActantTable> = ({
  statement,
  statementId,
  userCanEdit = false,
  handleRowClick = () => {},
  classEntitiesActant,
  renderPropGroup,
  updateActantsMutation,
  addProp,
  propsByOrigins,
}) => {
  const [filteredActants, setFilteredActants] = useState<
    FilteredActantObject[]
  >([]);

  useEffect(() => {
    const filteredActants = statement.data.actants.map((sActant, key) => {
      const actant = statement.actants?.find((a) => a.id === sActant.actant);
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
      updateActantsMutation.mutate(newData);
    }
  };
  const removeActant = (statementActantId: string) => {
    if (statement) {
      const updatedActants = statement.data.actants.filter(
        (a) => a.id !== statementActantId
      );
      const newData = { actants: updatedActants };
      updateActantsMutation.mutate(newData);
    }
  };

  const updateActantsOrder = () => {
    if (userCanEdit) {
      const actants: IStatementActant[] = filteredActants.map(
        (filteredActant) => filteredActant.data.sActant
      );
      if (JSON.stringify(statement.data.actants) !== JSON.stringify(actants)) {
        updateActantsMutation.mutate({ actants });
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
        Header: "Actant",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const {
            actant,
            sActant,
          }: {
            actant: IActant;
            sActant: IStatementActant | any;
          } = row.values.data;
          return actant ? (
            <StyledTagWrapper>
              <ActantTag
                actant={actant}
                // fullWidth
                button={
                  userCanEdit && (
                    <Button
                      key="d"
                      tooltip="unlink actant"
                      icon={<FaUnlink />}
                      color="plain"
                      inverted={true}
                      onClick={() => {
                        updateActant(sActant.id, {
                          actant: "",
                        });
                      }}
                    />
                  )
                }
              />
            </StyledTagWrapper>
          ) : (
            userCanEdit && (
              <ActantSuggester
                onSelected={(newSelectedId: string) => {
                  updateActant(sActant.id, {
                    actant: newSelectedId,
                  });
                }}
                categoryIds={classEntitiesActant}
              />
            )
          );
        },
      },
      {
        id: "position",
        Header: "Position",
        Cell: ({ row }: Cell) => {
          const { sActant } = row.values.data;
          return (
            <AttributeButtonGroup
              disabled={!userCanEdit}
              options={[
                {
                  longValue: "subject",
                  shortValue: "s",
                  onClick: () =>
                    updateActant(sActant.id, {
                      position: "s",
                    }),
                  selected: sActant.position == "s",
                },
                {
                  longValue: "actant1",
                  shortValue: "a1",
                  onClick: () =>
                    updateActant(sActant.id, {
                      position: "a1",
                    }),
                  selected: sActant.position == "a1",
                },
                {
                  longValue: "actant2",
                  shortValue: "a2",
                  onClick: () =>
                    updateActant(sActant.id, {
                      position: "a2",
                    }),
                  selected: sActant.position == "a2",
                },
                {
                  longValue: "pseudo-actant",
                  shortValue: "pa",
                  onClick: () =>
                    updateActant(sActant.id, {
                      position: "p",
                    }),
                  selected: sActant.position == "p",
                },
              ]}
            />
          );
        },
      },
      {
        id: "Attributes",
        Cell: ({ row }: Cell) => {
          const {
            actant,
            sActant,
          }: {
            actant: IActant;
            sActant: IStatementActant | any;
          } = row.values.data;
          return sActant ? (
            <AttributesEditor
              modalTitle={`Actant involvement [${
                actant ? actant.label : "undefined"
              }]`}
              disabledAllAttributes={!userCanEdit}
              entityType={actant ? actant.class : false}
              data={{
                elvl: sActant.elvl,
                certainty: sActant.certainty,
                logic: sActant.logic,
                virtuality: sActant.virtuality,
                partitivity: sActant.partitivity,
                operator: sActant.operator,
                bundleStart: sActant.bundleStart,
                bundleEnd: sActant.bundleEnd,
              }}
              handleUpdate={(newData) => {
                updateActant(sActant.id, newData);
              }}
              loading={updateActantsMutation.isLoading}
            />
          ) : (
            <div />
          );
        },
      },
      {
        Header: "",
        id: "remove",
        Cell: ({ row }: Cell) =>
          userCanEdit && (
            <Button
              key="d"
              icon={<FaTrashAlt />}
              color="plain"
              inverted={true}
              tooltip="remove actant row"
              onClick={() => {
                removeActant(row.values.data.sActant.id);
              }}
            />
          ),
      },
      {
        Header: "",
        id: "add",
        Cell: ({ row }: Cell) => {
          const propOriginId = row.values.data.sActant.actant;
          return (
            userCanEdit && (
              <Button
                key="a"
                icon={<FaPlus />}
                color="plain"
                inverted={true}
                tooltip="add new prop"
                onClick={() => {
                  addProp(propOriginId);
                }}
              />
            )
          );
        },
      },
    ];
  }, [filteredActants, updateActantsMutation]);

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
                renderPropGroup={renderPropGroup}
                handleClick={handleRowClick}
                index={i}
                row={row}
                statement={statement}
                moveRow={moveRow}
                userCanEdit={userCanEdit}
                updateOrderFn={updateActantsOrder}
                visibleColumns={visibleColumns}
                {...row.getRowProps()}
              />
            );
          })}
        </tbody>
      </StyledTable>
    </>
  );
};
