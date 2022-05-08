import { EntityClass, UsedInPosition } from "@shared/enums";
import { IEntity, IResponseUsedInStatement } from "@shared/types";
import { Button, Table } from "components";
import { useSearchParams } from "hooks";
import React, { useMemo } from "react";
import { FaEdit } from "react-icons/fa";
import { Cell } from "react-table";
import { EntityTag } from "../../EntityTag/EntityTag";
import {
  StyledShortenedText,
  StyledTableTextGridCell,
} from "./EntityDetailStatementsTableStyles";

interface EntityDetailStatementsTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInStatement<UsedInPosition>[];
  perPage?: number;
}
export const EntityDetailStatementsTable: React.FC<
  EntityDetailStatementsTable
> = ({ title, entities, useCases, perPage = 20 }) => {
  const { detailId, setDetailId, setStatementId, territoryId, setTerritoryId } =
    useSearchParams();

  const data = useMemo(() => (useCases ? useCases : []), [useCases]);

  const columns = React.useMemo(
    () => [
      {
        Header: "",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const useCase =
            row.original as IResponseUsedInStatement<UsedInPosition>;
          const entityId = useCase.statement?.id;
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
          const useCase =
            row.original as IResponseUsedInStatement<UsedInPosition>;
          const entityId = useCase.statement?.id;
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
          // TODO: tooltip
          const { position } = row.values;
          return <>{position}</>;
        },
      },
      {
        id: "edit",
        Cell: ({ row }: Cell) => {
          const useCase =
            row.original as IResponseUsedInStatement<UsedInPosition>;
          const entityId = useCase.statement?.id;
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
