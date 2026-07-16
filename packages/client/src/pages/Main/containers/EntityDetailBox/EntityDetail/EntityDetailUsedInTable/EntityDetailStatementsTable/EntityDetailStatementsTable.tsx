import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  IEntity,
  IResponseUsedInStatement,
  IStatement,
  IStatementActant,
  IStatementAction,
} from "@inkvisitor/shared/types";
import { Table, TagGroup } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React, { useMemo } from "react";
import { CellProps, Column } from "react-table";
import { TbAnchor } from "react-icons/tb";
import { StyledAnchor, StyledShortenedText, StyledTableTextGridCell } from "../EntityDetailUsedInTableStyles";

type CellType = CellProps<IResponseUsedInStatement<EntityEnums.UsedInPosition>>;

interface EntityDetailStatementsTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInStatement<EntityEnums.UsedInPosition>[];
  perPage?: number;
  disableRowClick?: boolean;
}
export const EntityDetailStatementsTable: React.FC<EntityDetailStatementsTable> = ({
  title,
  entities,
  useCases,
  perPage = 5,
  disableRowClick,
}) => {
  const { setStatementId, setTerritoryId } = useSearchParams();

  const data = useMemo(() => (useCases ? useCases : []), [useCases]);

  const columns = useMemo<Column<IResponseUsedInStatement<EntityEnums.UsedInPosition>>[]>(
    () => [
      {
        Header: "",
        id: "entity",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const entityId = useCase.statement?.id;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && <EntityTag key={entity.id} entity={entity} showOnly="tag" />}</>;
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

          return <>{subjectObjects ? <TagGroup definedEntities={subjectObjects} /> : <div />}</>;
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

          return <>{actionObjects ? <TagGroup definedEntities={actionObjects} /> : <div />}</>;
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
          const { statement, anchorTexts } = row.original;

          if (!statement) {
            return "";
          }

          // Fallback order (each used only when the one above is empty):
          //   1) document anchor span(s) - multiple anchors joined with " ... "
          //   2) statement text (deprecated but still in use sometimes)
          //   3) statement label - rendered italic to mark it as a label
          const anchorText = anchorTexts
            ?.map((t) => t.trim())
            .filter((t) => t)
            .join(" ... ");
          const statementText = statement.data.text?.trim();
          const label = statement.labels?.[0]?.trim();

          let content: React.ReactNode = "";
          if (anchorText) {
            content = (
              <StyledShortenedText>
                <StyledAnchor>
                  <TbAnchor size={12} strokeWidth={2} />
                </StyledAnchor>
                {anchorText}
              </StyledShortenedText>
            );
          } else if (statementText) {
            content = (
              <StyledShortenedText>{statement.data.text}</StyledShortenedText>
            );
          } else if (label) {
            content = <StyledShortenedText $italic>{label}</StyledShortenedText>;
          }

          return <StyledTableTextGridCell>{content}</StyledTableTextGridCell>;
        },
      },
      {
        Header: "Position",
        accessor: "position",
      },
    ],
    [entities],
  );

  return (
    <>
      <Table
        columns={columns}
        data={data}
        entityTitle={title}
        perPage={perPage}
        fullWidthColumn={5}
        onRowClick={
          !disableRowClick
            ? (row) => {
                const statementId = row.original.statement?.id;
                const entity = statementId ? entities[statementId] : false;

                if (entity && entity.class === EntityEnums.Class.Statement) {
                  const statement = entity as IStatement;
                  if (statement.data.territory) {
                    setStatementId(statement.id);
                    setTerritoryId(statement.data.territory.territoryId);
                  }
                }
              }
            : undefined
        }
      />
    </>
  );
};
