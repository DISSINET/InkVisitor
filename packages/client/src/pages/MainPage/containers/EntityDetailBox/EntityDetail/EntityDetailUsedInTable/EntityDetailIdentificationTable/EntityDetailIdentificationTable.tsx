import { IEntity } from "@shared/types";
import { IResponseUsedInStatementIdentification } from "@shared/types/response-detail";
import { Table } from "components";
import { EntityTag } from "components/advanced";
import React, { useMemo } from "react";
import { Cell, Column } from "react-table";
import { renderEntityTag } from "../EntityDetailUsedInTableUtils";

interface EntityDetailIdentificationTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInStatementIdentification[];
  perPage?: number;
}
export const EntityDetailIdentificationTable: React.FC<
  EntityDetailIdentificationTable
> = ({ title, entities, useCases, perPage = 5 }) => {
  const data = useMemo(() => (useCases ? useCases : []), [useCases]);

  const columns: Column<{}>[] = React.useMemo(
    () => [
      {
        Header: "Statement",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          const useCase =
            row.original as IResponseUsedInStatementIdentification;
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
        Header: "Actant",
        accesor: "data",
        Cell: ({ row }: Cell) => {
          const useCase =
            row.original as IResponseUsedInStatementIdentification;
          const entityId = useCase.actantEntityId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && renderEntityTag(entity)}</>;
        },
      },
      {
        Header: "Identification",
        Cell: ({ row }: Cell) => {
          const useCase =
            row.original as IResponseUsedInStatementIdentification;
          const entityId = useCase.relationEntityId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && renderEntityTag(entity)}</>;
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
      />
    </>
  );
};
