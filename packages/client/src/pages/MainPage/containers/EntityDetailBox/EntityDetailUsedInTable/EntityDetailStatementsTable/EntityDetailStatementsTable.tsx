import { EntityClass, UsedInPosition } from "@shared/enums";
import {
  IEntity,
  IResponseUsedInStatement,
  IStatementActant,
  IStatementAction,
} from "@shared/types";
import { Button, Table, TagGroup, Tooltip } from "components";
import { useSearchParams } from "hooks";
import { EntityTag } from "pages/MainPage/containers/EntityTag/EntityTag";
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
  useCases: IResponseUsedInStatement<UsedInPosition>[];
  perPage?: number;
}
export const EntityDetailStatementsTable: React.FC<
  EntityDetailStatementsTable
> = ({ title, entities, useCases, perPage = 5 }) => {
  const { setStatementId, setTerritoryId } = useSearchParams();

  const data = useMemo(() => (useCases ? useCases : []), [useCases]);

  const renderListActant = (actantObject: IEntity, key: number) => {
    return (
      actantObject && (
        <EntityTag
          key={key}
          actant={actantObject}
          showOnly="entity"
          tooltipPosition="right center"
        />
      )
    );
  };

  const columns: Column<{}>[] = React.useMemo(
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
        Header: "Subj",
        Cell: ({ row }: Cell) => {
          const useCase =
            row.original as IResponseUsedInStatement<UsedInPosition>;
          const subjectIds = useCase.statement.data.actants
            .filter((a: IStatementActant) => a.position === "s")
            .map((a: IStatementActant) => a.actant);

          const subjectObjects = subjectIds.map((actantId: string) => {
            return entities[actantId];
          });

          const isOversized = subjectIds.length > 2;

          return (
            <TagGroup>
              {subjectObjects
                .slice(0, 2)
                .map((subjectObject: IEntity, key: number) =>
                  renderListActant(subjectObject, key)
                )}
              {isOversized && (
                <Tooltip
                  offsetX={-14}
                  position="right center"
                  color="success"
                  noArrow
                  items={
                    <TagGroup>
                      {subjectObjects
                        .slice(2)
                        .map((subjectObject: IEntity, key: number) =>
                          renderListActant(subjectObject, key)
                        )}
                    </TagGroup>
                  }
                >
                  <StyledDots>{"..."}</StyledDots>
                </Tooltip>
              )}
            </TagGroup>
          );
        },
      },
      {
        Header: "Actions",
        Cell: ({ row }: Cell) => {
          const useCase =
            row.original as IResponseUsedInStatement<UsedInPosition>;
          const { actions } = useCase.statement.data;
          const actionIds = actions.map((a: IStatementAction) => a.action);
          const actionObjects = actionIds.map((actionId: string) => {
            return entities[actionId];
          });

          if (actionObjects) {
            const isOversized = actionIds.length > 2;
            return (
              <TagGroup>
                {actionObjects
                  .slice(0, 2)
                  .map((action: IEntity, key: number) =>
                    renderListActant(action, key)
                  )}
                {isOversized && (
                  <Tooltip
                    offsetX={-14}
                    position="right center"
                    color="success"
                    noArrow
                    items={
                      <TagGroup>
                        {actionObjects
                          .slice(2)
                          .map((action: IEntity, key: number) =>
                            renderListActant(action, key)
                          )}
                      </TagGroup>
                    }
                  >
                    <StyledDots>{"..."}</StyledDots>
                  </Tooltip>
                )}
              </TagGroup>
            );
          } else {
            return <div />;
          }
        },
      },
      {
        Header: "Objects",
        Cell: ({ row }: Cell) => {
          const useCase =
            row.original as IResponseUsedInStatement<UsedInPosition>;

          const actantIds = useCase.statement.data.actants
            .filter((a: IStatementActant) => a.position !== "s")
            .map((a: IStatementActant) => a.actant);
          const isOversized = actantIds.length > 4;

          const actantObjects = actantIds.map((actantId: string) => {
            return entities[actantId];
          });
          return (
            <TagGroup>
              {actantObjects
                .slice(0, 4)
                .map((actantObject: IEntity, key: number) =>
                  renderListActant(actantObject, key)
                )}
              {isOversized && (
                <Tooltip
                  offsetX={-14}
                  position="right center"
                  color="success"
                  noArrow
                  items={
                    <TagGroup>
                      {actantObjects
                        .slice(4)
                        .map((actantObject: IEntity, key: number) =>
                          renderListActant(actantObject, key)
                        )}
                    </TagGroup>
                  }
                >
                  <StyledDots>{"..."}</StyledDots>
                </Tooltip>
              )}
            </TagGroup>
          );
        },
      },
      {
        Header: "Text",
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
        Header: "Position",
        accessor: "position",
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
