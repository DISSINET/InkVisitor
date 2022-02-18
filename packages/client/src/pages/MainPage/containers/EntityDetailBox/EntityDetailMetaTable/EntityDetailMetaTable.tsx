import { EntityClass, Position } from "@shared/enums";
import { IProp, IResponseDetail, IResponseStatement } from "@shared/types";
import { Button, ButtonGroup } from "components";
import React, { useCallback, useMemo, useState } from "react";
import { FaTrashAlt, FaUnlink } from "react-icons/fa";
import { Cell, Column, Row, useTable } from "react-table";
import { EntitySuggester, EntityTag } from "../..";
import AttributesEditor from "../../AttributesEditor/AttributesEditor";
import { EntityDetailMetaTableRow } from "./EntityDetailMetaTableRow";
import {
  StyledPipe,
  StyledTable,
  StyledTh,
  StyledTHead,
} from "./EntityDetailMetaTableStyles";
// import { AttributesEditor } from "../../AttributesEditor/AttributesEditor";

interface EntityDetailMetaTable {
  entity: IResponseDetail;
  userCanEdit?: boolean;
  metaProps: IProp[];
  updateMetaStatement: any;
  removeMetaStatement: any;
}
export const EntityDetailMetaTable: React.FC<EntityDetailMetaTable> = ({
  entity,
  userCanEdit = false,
  metaProps,
  updateMetaStatement,
  removeMetaStatement,
}) => {
  const [statements, setStatements] = useState(metaProps);

  // useEffect(() => {
  //   setStatements(metaStatements);
  // }, [metaStatements]);

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
          const { id: statementId, data } = row.original as IResponseStatement;

          const typeSActant = data.actants.find(
            (a) => a.position == Position.Actant1
          );
          const typeActant = typeSActant
            ? entity.entities[typeSActant.actant]
            : false;

          return typeActant && typeSActant ? (
            <EntityTag
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
                      const updatedStatementActants =
                        metaStatementData.actants.map((actant) =>
                          actant.position === Position.Actant1
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
              <EntitySuggester
                onSelected={(newSelectedId: string) => {
                  const metaStatementData = { ...data };
                  const updatedStatementActants = metaStatementData.actants.map(
                    (actant) =>
                      actant.position === Position.Actant1
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
                categoryTypes={[EntityClass.Concept]}
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
            entities,
          } = row.original as IResponseStatement;

          const typeSActant = data.actants.find(
            (a) => a.position == Position.Actant1
          );
          const typeActant = typeSActant
            ? entities[typeSActant.actant]
            : undefined;

          return typeSActant ? (
            <AttributesEditor
              disabledAllAttributes={!userCanEdit}
              modalTitle={`Property Type attributes [${
                typeActant ? typeActant.label : "undefined"
              }]`}
              actant={typeActant}
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
                    actant.position === Position.Actant1
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
            entities,
          } = row.original as IResponseStatement;

          const valueSActant = data.actants.find(
            (a) => a.position == Position.Actant2
          );
          const valueActant = valueSActant
            ? entities[valueSActant.actant]
            : false;

          return valueSActant && valueActant ? (
            <EntityTag
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
                      const updatedStatementActants =
                        metaStatementData.actants.map((actant) =>
                          actant.position === Position.Actant2
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
              <EntitySuggester
                onSelected={(newSelectedId: string) => {
                  const metaStatementData = { ...data };
                  const updatedStatementActants = metaStatementData.actants.map(
                    (actant) =>
                      actant.position === Position.Actant2
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
                  EntityClass.Action,
                  EntityClass.Person,
                  EntityClass.Group,
                  EntityClass.Object,
                  EntityClass.Concept,
                  EntityClass.Location,
                  EntityClass.Value,
                  EntityClass.Event,
                  EntityClass.Statement,
                  EntityClass.Territory,
                  EntityClass.Resource,
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
            entities,
          } = row.original as IResponseStatement;

          const valueSActant = data.actants.find(
            (a) => a.position == Position.Actant2
          );
          const valueActant = valueSActant
            ? entities[valueSActant.actant]
            : undefined;

          return valueSActant ? (
            <AttributesEditor
              disabledAllAttributes={!userCanEdit}
              modalTitle={`Property Value attributes [${
                valueActant ? valueActant.label : ""
              }]`}
              actant={valueActant}
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
                    actant.position === Position.Actant2
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
            entities,
          } = row.original as IResponseStatement;

          const action = data?.actions[0];

          const valueSActant = data.actants.find(
            (a) => a.position == Position.Actant2
          );
          const valueActant = valueSActant
            ? entities[valueSActant.actant]
            : false;

          const typeSActant = data.actants.find(
            (a) => a.position == Position.Actant2
          );
          const typeActant = typeSActant ? entities[typeSActant.actant] : false;

          const typeLabel = typeActant ? typeActant.label : "undefined";
          const valueLabel = valueActant ? valueActant.label : "undefined";

          return (
            <ButtonGroup noMargin>
              {data && action && (
                <AttributesEditor
                  disabledAllAttributes={!userCanEdit}
                  modalTitle={`Property Type attributes [${typeLabel} - ${valueLabel}]`}
                  data={{
                    elvl: action.elvl,
                    certainty: action.certainty,
                    logic: action.logic,
                    mood: action.mood,
                    moodvariant: action.moodvariant,
                    bundleOperator: action.bundleOperator,
                    bundleStart: action.bundleStart,
                    bundleEnd: action.bundleEnd,
                  }}
                  disabledAttributes={["elvl"]}
                  handleUpdate={(newData: any) => {
                    const metaStatementData = { ...data };
                    const updatedStatementActions =
                      metaStatementData.actions.map((action) => ({
                        ...action,
                        ...newData,
                      }));
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
  }, [metaProps]);

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
            <EntityDetailMetaTableRow
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
