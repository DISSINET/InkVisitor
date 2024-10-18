import { EntityEnums } from "@shared/enums";
import {
  IEntity,
  IResponseUsedInStatement,
  IStatement,
  IStatementActant,
  IStatementAction,
} from "@shared/types";
import { Button, Table, TagGroup } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React, { useMemo } from "react";
import { FaEdit } from "react-icons/fa";
import { CellProps, Column } from "react-table";
import {
  StyledShortenedText,
  StyledTableTextGridCell,
} from "../EntityDetailUsedInTableStyles";

type CellType = CellProps<IResponseUsedInStatement<EntityEnums.UsedInPosition>>;

interface EntityDetailStatementsTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInStatement<EntityEnums.UsedInPosition>[];
  perPage?: number;
}
export const EntityDetailStatementsTable: React.FC<
  EntityDetailStatementsTable
> = ({ title, entities, useCases, perPage = 5 }) => {
  const { setStatementId, setTerritoryId } = useSearchParams();

  const data = useMemo(() => (useCases ? useCases : []), [useCases]);

  const columns = useMemo<
    Column<IResponseUsedInStatement<EntityEnums.UsedInPosition>>[]
  >(
    () => [
      {
        Header: "",
        id: "entity",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const entityId = useCase.statement?.id;
          const entity = entityId ? entities[entityId] : false;
          return (
            <>
              {entity && (
                <EntityTag key={entity.id} entity={entity} showOnly="entity" />
              )}
            </>
          );
        },
      },
      {
        Header: "Subj",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const subjectIds = useCase.statement.data.actants
            .filter((a: IStatementActant) => a.position === "s")
            .map((a: IStatementActant) => a.entityId);

          const subjectObjects = subjectIds.map((actantId: string) => {
            return entities[actantId];
          });

          return (
            <>
              {subjectObjects ? (
                <TagGroup definedEntities={subjectObjects} />
              ) : (
                <div />
              )}
            </>
          );
        },
      },
      {
        Header: "Actions",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const { actions } = useCase.statement.data;
          const actionIds = actions.map((a: IStatementAction) => a.actionId);
          const actionObjects = actionIds.map((actionId: string) => {
            return entities[actionId];
          });

          return (
            <>
              {actionObjects ? (
                <TagGroup definedEntities={actionObjects} />
              ) : (
                <div />
              )}
            </>
          );
        },
      },
      {
        Header: "Objects",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;

          const actantIds = useCase.statement.data.actants
            .filter((a: IStatementActant) => a.position !== "s")
            .map((a: IStatementActant) => a.entityId);

          const actantObjects = actantIds.map((actantId: string) => {
            return entities[actantId];
          });

          return (
            <>
              {actantObjects ? (
                <TagGroup definedEntities={actantObjects} oversizeLimit={4} />
              ) : (
                <div />
              )}
            </>
          );
        },
      },
      {
        Header: "Text",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const entityId = useCase.statement?.id;
          const entity = entityId ? entities[entityId] : false;

          return (
            <>
              {entity && entity.class === EntityEnums.Class.Statement ? (
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
        Header: "Position",
        accessor: "position",
      },
    ],
    [entities]
  );

  return (
    <>
      <Table
        columns={columns}
        data={data}
        entityTitle={title}
        perPage={perPage}
        fullWidthColumn={5}
        onRowClick={(row) => {
          const statementId = row.original.statement?.id;
          const entity = statementId ? entities[statementId] : false;

          if (entity && entity.class === EntityEnums.Class.Statement) {
            const statement = entity as IStatement;
            if (statement.data.territory) {
              setStatementId(statement.id);
              setTerritoryId(statement.data.territory.territoryId);
            }
          }
        }}
      />
    </>
  );
};
