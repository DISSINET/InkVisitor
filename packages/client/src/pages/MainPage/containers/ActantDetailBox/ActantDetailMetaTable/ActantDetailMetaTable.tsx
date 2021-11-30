import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Column, useTable, useExpanded, Row, Cell } from "react-table";
import update from "immutability-helper";
import {
  StyledTable,
  StyledTHead,
  StyledTh,
  StyledPipe,
} from "./ActantDetailMetaTableStyles";
import {
  IAction,
  IActant,
  IResponseGeneric,
  IResponseStatement,
  IStatementAction,
  IResponseBookmarkFolder,
} from "@shared/types";
import { ActantSuggester, ActantTag, CertaintyToggle, ElvlToggle } from "../..";
import { Button, ButtonGroup, Input } from "components";
import { FaPlus, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { useMutation, UseMutationResult, useQueryClient } from "react-query";
import { ActantType } from "@shared/enums";
import { ActantDetailMetaTableRow } from "./ActantDetailMetaTableRow";
import { AttributesEditor } from "../../AttributesEditor/AttributesEditor";

interface ActantDetailMetaTable {
  userCanEdit?: boolean;
  metaStatements: IResponseStatement[];
  updateMetaStatement: any;
  removeMetaStatement: any;
}
export const ActantDetailMetaTable: React.FC<ActantDetailMetaTable> = ({
  userCanEdit = false,
  metaStatements,
  updateMetaStatement,
  removeMetaStatement,
}) => {
  const [statements, setStatements] = useState(metaStatements);

  useEffect(() => {
    setStatements(metaStatements);
  }, [metaStatements]);

  const columns: Column<{}>[] = useMemo(() => {
    return [
      {
        id: "id",
        accessor: "id",
      },

      {
        id: "type",
        accessor: "",
        Cell: ({ row }: Cell) => {
          const {
            id: statementId,
            data,
            actants,
          } = row.original as IResponseStatement;

          const typeSActant = data.actants.find((a) => a.position == "a1");
          const typeActant = typeSActant
            ? actants.find((a) => a.id === typeSActant.actant)
            : false;

          return typeActant && typeSActant ? (
            <ActantTag
              actant={typeActant}
              button={
                userCanEdit && (
                  <Button
                    key="d"
                    tooltip="unlink actant"
                    icon={<FaUnlink />}
                    color="plain"
                    inverted={true}
                    onClick={() => {
                      const metaStatementData = { ...data };
                      const updatedStatementActants = metaStatementData.actants.map(
                        (actant) =>
                          actant.position === "a1"
                            ? { ...actant, ...{ actant: "" } }
                            : actant
                      );
                      updateMetaStatement.mutate({
                        metaStatementId: statementId,
                        changes: {
                          ...metaStatementData,
                          ...{ actants: updatedStatementActants },
                        },
                      });
                    }}
                  />
                )
              }
            />
          ) : (
            userCanEdit && (
              <ActantSuggester
                onSelected={(newSelectedId: string) => {
                  const metaStatementData = { ...data };
                  const updatedStatementActants = metaStatementData.actants.map(
                    (actant) =>
                      actant.position === "a1"
                        ? { ...actant, ...{ actant: newSelectedId } }
                        : actant
                  );
                  updateMetaStatement.mutate({
                    metaStatementId: statementId,
                    changes: {
                      ...metaStatementData,
                      ...{ actants: updatedStatementActants },
                    },
                  });
                }}
                categoryTypes={[ActantType.Concept]}
              />
            )
          );
        },
      },

      {
        Header: "Type",
        id: "type-attributes",
        accessor: "",
        Cell: ({ row }: Cell) => {
          const {
            id: statementId,
            data,
            actants,
          } = row.original as IResponseStatement;

          const typeSActant = data.actants.find((a) => a.position == "a1");
          const typeActant = typeSActant
            ? actants.find((a) => a.id === typeSActant.actant)
            : false;

          return typeSActant ? (
            <AttributesEditor
              disabledAllAttributes={!userCanEdit}
              modalTitle={`Property Type attributes [${
                typeActant ? typeActant.label : "undefined"
              }]`}
              entityType={typeActant ? typeActant.class : false}
              data={{
                elvl: typeSActant.elvl,
                logic: typeSActant.logic,
                virtuality: typeSActant.virtuality,
                partitivity: typeSActant.partitivity,
              }}
              disabledAttributes={["elvl"]}
              handleUpdate={(newData: any) => {
                const metaStatementData = { ...data };
                const updatedStatementActants = metaStatementData.actants.map(
                  (actant) =>
                    actant.position === "a1"
                      ? { ...actant, ...newData }
                      : actant
                );

                updateMetaStatement.mutate({
                  metaStatementId: statementId,
                  changes: {
                    ...metaStatementData,
                    ...{ actants: updatedStatementActants },
                  },
                });
              }}
              loading={updateMetaStatement.isLoading}
            />
          ) : (
            <div />
          );
        },
      },

      {
        id: "pipe",
        accessor: "",
        Cell: ({ row }: Cell) => {
          return <StyledPipe />;
        },
      },

      {
        id: "value",
        accessor: "",
        Cell: ({ row }: Cell) => {
          const {
            id: statementId,
            data,
            actants,
          } = row.original as IResponseStatement;

          const valueSActant = data.actants.find((a) => a.position == "a2");
          const valueActant = valueSActant
            ? actants.find((a) => a.id === valueSActant.actant)
            : false;

          return valueSActant && valueActant ? (
            <ActantTag
              actant={valueActant}
              button={
                userCanEdit && (
                  <Button
                    key="d"
                    tooltip="unlink actant"
                    icon={<FaUnlink />}
                    color="plain"
                    inverted={true}
                    onClick={() => {
                      const metaStatementData = { ...data };
                      const updatedStatementActants = metaStatementData.actants.map(
                        (actant) =>
                          actant.position === "a2"
                            ? { ...actant, ...{ actant: "" } }
                            : actant
                      );
                      updateMetaStatement.mutate({
                        metaStatementId: statementId,
                        changes: {
                          ...metaStatementData,
                          ...{ actants: updatedStatementActants },
                        },
                      });
                    }}
                  />
                )
              }
            />
          ) : (
            userCanEdit && (
              <ActantSuggester
                onSelected={(newSelectedId: string) => {
                  const metaStatementData = { ...data };
                  const updatedStatementActants = metaStatementData.actants.map(
                    (actant) =>
                      actant.position === "a2"
                        ? { ...actant, ...{ actant: newSelectedId } }
                        : actant
                  );
                  updateMetaStatement.mutate({
                    metaStatementId: statementId,
                    changes: {
                      ...metaStatementData,
                      ...{ actants: updatedStatementActants },
                    },
                  });
                }}
                categoryTypes={[
                  ActantType.Action,
                  ActantType.Person,
                  ActantType.Group,
                  ActantType.Object,
                  ActantType.Concept,
                  ActantType.Location,
                  ActantType.Value,
                  ActantType.Event,
                  ActantType.Statement,
                  ActantType.Territory,
                  ActantType.Resource,
                ]}
              />
            )
          );
        },
      },

      {
        Header: "Value",
        id: "value-attributes",
        accessor: "",
        Cell: ({ row }: Cell) => {
          const {
            id: statementId,
            data,
            actants,
          } = row.original as IResponseStatement;

          const valueSActant = data.actants.find((a) => a.position == "a2");
          const valueActant = valueSActant
            ? actants.find((a) => a.id === valueSActant.actant)
            : false;

          return valueSActant ? (
            <AttributesEditor
              disabledAllAttributes={!userCanEdit}
              modalTitle={`Property Value attributes [${
                valueActant ? valueActant.label : ""
              }]`}
              entityType={valueActant ? valueActant.class : false}
              data={{
                elvl: valueSActant.elvl,
                logic: valueSActant.logic,
                virtuality: valueSActant.virtuality,
                partitivity: valueSActant.partitivity,
              }}
              disabledAttributes={["elvl"]}
              handleUpdate={(newData: any) => {
                const metaStatementData = { ...data };
                const updatedStatementActants = metaStatementData.actants.map(
                  (actant) =>
                    actant.position === "a2"
                      ? { ...actant, ...newData }
                      : actant
                );

                updateMetaStatement.mutate({
                  metaStatementId: statementId,
                  changes: {
                    ...metaStatementData,
                    ...{ actants: updatedStatementActants },
                  },
                });
              }}
              loading={updateMetaStatement.isLoading}
            />
          ) : (
            <div />
          );
        },
      },

      {
        id: "pipe2",
        accessor: "",
        Cell: ({ row }: Cell) => {
          return <StyledPipe />;
        },
      },

      {
        id: "actions",
        Cell: ({ row }: Cell) => {
          const {
            id: statementId,
            class: statementClass,
            data: data,
            actants,
          } = row.original as IResponseStatement;

          const action = data?.actions[0];

          const valueSActant = data.actants.find((a) => a.position == "a2");
          const valueActant = valueSActant
            ? actants.find((a) => a.id === valueSActant.actant)
            : false;

          const typeSActant = data.actants.find((a) => a.position == "a1");
          const typeActant = typeSActant
            ? actants.find((a) => a.id === typeSActant.actant)
            : false;

          const typeLabel = typeActant ? typeActant.label : "undefined";
          const valueLabel = valueActant ? valueActant.label : "undefined";

          return (
            <ButtonGroup noMargin>
              {data && action && (
                <AttributesEditor
                  disabledAllAttributes={!userCanEdit}
                  modalTitle={`Property Type attributes [${typeLabel} - ${valueLabel}]`}
                  entityType={statementClass}
                  data={{
                    elvl: action.elvl,
                    certainty: action.certainty,
                    logic: action.logic,
                    mood: action.mood,
                    moodvariant: action.moodvariant,
                    operator: action.operator,
                    bundleStart: action.bundleStart,
                    bundleEnd: action.bundleEnd,
                  }}
                  disabledAttributes={["elvl"]}
                  handleUpdate={(newData: any) => {
                    const metaStatementData = { ...data };
                    const updatedStatementActions = metaStatementData.actions.map(
                      (action) => ({ ...action, ...newData })
                    );
                    updateMetaStatement.mutate({
                      metaStatementId: statementId,
                      changes: {
                        ...metaStatementData,
                        ...{ actions: updatedStatementActions },
                      },
                    });
                  }}
                  loading={updateMetaStatement.isLoading}
                />
              )}
              {userCanEdit && (
                <Button
                  key="d"
                  icon={<FaTrashAlt />}
                  color="plain"
                  inverted={true}
                  tooltip="remove actant row"
                  onClick={() => {
                    removeMetaStatement.mutate(statementId);
                  }}
                />
              )}
            </ButtonGroup>
          );
        },
      },
    ];
  }, [statements]);

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
  } = useTable({
    columns,
    data: statements || [],
    getRowId,
    initialState: {
      hiddenColumns: ["id"],
    },
  });

  return statements && statements.length ? (
    <StyledTable {...getTableProps()}>
      <StyledTHead>
        <tr>
          <StyledTh key={"1"} colSpan={3}>
            Type
          </StyledTh>
          <StyledTh key={"2"} colSpan={3}>
            Value
          </StyledTh>
        </tr>
      </StyledTHead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row: Row, i: number) => {
          prepareRow(row);
          return (
            <ActantDetailMetaTableRow
              index={i}
              row={row}
              visibleColumns={visibleColumns}
              {...row.getRowProps()}
            />
          );
        })}
      </tbody>
    </StyledTable>
  ) : (
    <div />
  );
};
