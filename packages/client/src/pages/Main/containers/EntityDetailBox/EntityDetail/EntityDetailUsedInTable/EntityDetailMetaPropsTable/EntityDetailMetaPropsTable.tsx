import { IEntity, IResponseUsedInMetaProp } from "@shared/types";
import { Table } from "components";
import React, { useMemo } from "react";
import { CellProps, Column } from "react-table";
import { renderEntityTag } from "../EntityDetailUsedInTableUtils";

type CellType = CellProps<IResponseUsedInMetaProp>;

interface EntityDetailMetaPropsTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInMetaProp[];
  perPage?: number;
}
export const EntityDetailMetaPropsTable: React.FC<
  EntityDetailMetaPropsTable
> = ({ title, entities, useCases, perPage = 5 }) => {
  const data = useMemo(() => (useCases ? useCases : []), [useCases]);

  const columns = useMemo<Column<IResponseUsedInMetaProp>[]>(
    () => [
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
