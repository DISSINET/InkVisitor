import { IEntity } from "@shared/types";
import { IResponseUsedInStatementClassification } from "@shared/types/response-detail";
import { Table } from "components";
import { EntityTag } from "components/advanced";
import React, { useMemo } from "react";
import { CellProps, Column } from "react-table";
import { renderEntityTag } from "../EntityDetailUsedInTableUtils";

type CellType = CellProps<IResponseUsedInStatementClassification>;
interface EntityDetailClassificationTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInStatementClassification[];
  perPage?: number;
}
export const EntityDetailClassificationTable: React.FC<
  EntityDetailClassificationTable
> = ({ title, entities, useCases, perPage = 5 }) => {
  const data = useMemo(() => (useCases ? useCases : []), [useCases]);

  const columns = useMemo<Column<IResponseUsedInStatementClassification>[]>(
    () => [
      {
        Header: "Statement",
        accessor: "data",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const entityId = useCase.statementId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && <EntityTag key={entity.id} entity={entity} />}</>;
        },
      },
      {
        Header: "Actant",
        accesor: "data",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
          const entityId = useCase.actantEntityId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && renderEntityTag(entity)}</>;
        },
      },
      {
        Header: "Classification",
        Cell: ({ row }: CellType) => {
          const useCase = row.original;
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
