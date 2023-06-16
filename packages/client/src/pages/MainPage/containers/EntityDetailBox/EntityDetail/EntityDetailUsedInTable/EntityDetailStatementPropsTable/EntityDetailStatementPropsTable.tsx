import { EntityEnums } from "@shared/enums";
import { IEntity, IStatement } from "@shared/types";
import { IResponseUsedInStatementProps } from "@shared/types/response-detail";
import { Button, Table } from "components";
import { EntityTag } from "components/advanced";
import { useSearchParams } from "hooks";
import React, { useMemo } from "react";
import { FaEdit } from "react-icons/fa";
import { CellProps, Column } from "react-table";
import { renderEntityTag } from "../EntityDetailUsedInTableUtils";

type CellType = CellProps<IResponseUsedInStatementProps>;

interface EntityDetailStatementPropsTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInStatementProps[];
  perPage?: number;
}
export const EntityDetailStatementPropsTable: React.FC<
  EntityDetailStatementPropsTable
> = ({ title, entities, useCases, perPage = 5 }) => {
  const { setStatementId, setTerritoryId } = useSearchParams();

  const data = useMemo(() => (useCases ? useCases : []), [useCases]);

  const columns = useMemo<Column<IResponseUsedInStatementProps>[]>(
    () => [
      {
        Header: "Statement",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const entityId = useCase.statementId;
          const entity = entityId ? entities[entityId] : false;
          return (
            <>
              {entity && (
                <EntityTag
                  key={entity.id}
                  entity={entity}
                  tooltipText={entity.label}
                />
              )}
            </>
          );
        },
      },
      {
        Header: "Origin",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const entityId = useCase.originId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && renderEntityTag(entity)}</>;
        },
      },
      {
        Header: "Type",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const entityId = useCase.typeId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && renderEntityTag(entity)}</>;
        },
      },
      {
        Header: "Value",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const entityId = useCase.valueId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && renderEntityTag(entity)}</>;
        },
      },
      {
        id: "edit",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const entityId = useCase.statementId;
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
                    if (entity.class === EntityEnums.Class.Statement) {
                      const statement = entity as IStatement;
                      if (statement.data.territory) {
                        setStatementId(statement.id);
                        setTerritoryId(statement.data.territory.territoryId);
                      }
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
        firstColumnMinWidth
        lastColumnMinWidth
      />
    </>
  );
};
