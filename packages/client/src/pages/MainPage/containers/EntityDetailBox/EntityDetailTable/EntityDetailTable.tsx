import { EntityClass, UsedInPosition } from "@shared/enums";
import {
  IEntity,
  IResponseUsedInMetaProp,
  IResponseUsedInStatement,
} from "@shared/types";
import { Button, Table } from "components";
import { useSearchParams } from "hooks";
import React, { useMemo } from "react";
import { FaEdit } from "react-icons/fa";
import { Cell } from "react-table";
import { EntityTag } from "../../EntityTag/EntityTag";
import {
  StyledShortenedText,
  StyledTableTextGridCell,
} from "./EntityDetailTableStyles";

interface EntityDetailTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases:
    | IResponseUsedInMetaProp<UsedInPosition>[]
    | IResponseUsedInStatement<UsedInPosition>[];
  perPage?: number;
  mode: "MetaProp" | "Statement" | "StatementProp";
}
export const EntityDetailTable: React.FC<EntityDetailTable> = ({
  title,
  entities,
  useCases,
  perPage = 20,
  mode,
}) => {
  const { detailId, setDetailId, setStatementId, territoryId, setTerritoryId } =
    useSearchParams();

  const data = useMemo(() => (useCases ? useCases : []), [useCases]);

  const columns = React.useMemo(
    () => [
      {
        Header: "",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const useCase = row.original;

          const entityId =
            mode === "MetaProp"
              ? (useCase as IResponseUsedInMetaProp<UsedInPosition>).entityId
              : (useCase as IResponseUsedInStatement<UsedInPosition>).statement
                  ?.id;

          const entity = entityId ? entities[entityId] : false;
          return (
            <>
              {entity && (
                <EntityTag
                  key={entity.id}
                  actant={entity}
                  showOnly="entity"
                  tooltipText={entity.label}
                />
              )}
            </>
          );
        },
      },
      {
        Header: "text",
        Cell: ({ row }: Cell) => {
          const useCase = row.original;
          const entityId =
            mode === "MetaProp"
              ? (useCase as IResponseUsedInMetaProp<UsedInPosition>).entityId
              : (useCase as IResponseUsedInStatement<UsedInPosition>).statement
                  ?.id;
          const entity = entityId ? entities[entityId] : false;

          return (
            <>
              {entity && entity.class === EntityClass.Statement ? (
                <StyledTableTextGridCell>
                  <StyledShortenedText>{entity.data.text}</StyledShortenedText>
                </StyledTableTextGridCell>
              ) : (
                ""
              )}
            </>
          );
        },
      },
      {
        Header: "position",
        accessor: "position",
        Cell: ({ row }: Cell) => {
          // TODO: tooltip?
          const { position } = row.values;
          return <>{position}</>;
        },
      },
      {
        id: "edit",
        Cell: ({ row }: Cell) => {
          const useCase = row.original;
          const entityId =
            mode === "MetaProp"
              ? (useCase as IResponseUsedInMetaProp<UsedInPosition>).entityId
              : (useCase as IResponseUsedInStatement<UsedInPosition>).statement
                  ?.id;
          const entity = entityId ? entities[entityId] : false;

          return (
            <>
              {entity && (
                <Button
                  icon={<FaEdit size={14} />}
                  color="primary"
                  inverted
                  noBorder
                  tooltip="edit statement"
                  onClick={async () => {
                    if (entity.data.territory) {
                      setStatementId(entity.id);
                      setTerritoryId(entity.data.territory.id);
                    }
                  }}
                />
              )}
            </>
          );
        },
      },
    ],
    [entities]
  );

  return (
    <>
      <Table columns={columns} data={data} entityTitle={title} />
    </>
  );
};
