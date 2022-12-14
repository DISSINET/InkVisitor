import { EntityEnums } from "@shared/enums";
import {
  IEntity,
  IResponseUsedInStatement,
  IStatementActant,
  IStatementAction,
} from "@shared/types";
import { Button, Table, TagGroup, Tooltip } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React, { useMemo } from "react";
import { FaEdit } from "react-icons/fa";
import { Cell, Column } from "react-table";
import {
  StyledDots,
  StyledShortenedText,
  StyledTableTextGridCell,
} from "../EntityDetailUsedInTableStyles";

interface EntityDetailStatementsTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInStatement<EntityEnums.UsedInPosition>[];
  perPage?: number;
}
export const EntityDetailStatementsTable: React.FC<EntityDetailStatementsTable> =
  ({ title, entities, useCases, perPage = 5 }) => {
    const { setStatementId, setTerritoryId } = useSearchParams();

    const data = useMemo(() => (useCases ? useCases : []), [useCases]);

    const columns: Column<{}>[] = React.useMemo(
      () => [
        {
          Header: "",
          accessor: "data",
          Cell: ({ row }: Cell) => {
            const useCase =
              row.original as IResponseUsedInStatement<EntityEnums.UsedInPosition>;
            const entityId = useCase.statement?.id;
            const entity = entityId ? entities[entityId] : false;
            return (
              <>
                {entity && (
                  <EntityTag
                    key={entity.id}
                    entity={entity}
                    showOnly="entity"
                    tooltipText={entity.label}
                  />
                )}
              </>
            );
          },
        },
        {
          Header: "Subj",
          Cell: ({ row }: Cell) => {
            const useCase =
              row.original as IResponseUsedInStatement<EntityEnums.UsedInPosition>;
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
          Cell: ({ row }: Cell) => {
            const useCase =
              row.original as IResponseUsedInStatement<EntityEnums.UsedInPosition>;
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
          Cell: ({ row }: Cell) => {
            const useCase =
              row.original as IResponseUsedInStatement<EntityEnums.UsedInPosition>;

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
          Cell: ({ row }: Cell) => {
            const useCase =
              row.original as IResponseUsedInStatement<EntityEnums.UsedInPosition>;
            const entityId = useCase.statement?.id;
            const entity = entityId ? entities[entityId] : false;

            return (
              <>
                {entity && entity.class === EntityEnums.Class.Statement ? (
                  <StyledTableTextGridCell>
                    <StyledShortenedText>
                      {entity.data.text}
                    </StyledShortenedText>
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
        {
          id: "edit",
          Cell: ({ row }: Cell) => {
            const useCase =
              row.original as IResponseUsedInStatement<EntityEnums.UsedInPosition>;
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
                    tooltipLabel="edit statement"
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
        <Table
          columns={columns}
          data={data}
          entityTitle={title}
          perPage={perPage}
          fullWidthColumn={5}
        />
      </>
    );
  };
