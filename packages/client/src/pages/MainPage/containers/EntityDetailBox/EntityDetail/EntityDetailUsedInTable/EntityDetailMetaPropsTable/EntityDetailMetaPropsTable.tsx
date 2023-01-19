import { IEntity, IResponseUsedInMetaProp } from "@shared/types";
import { Table } from "components";
import React, { useMemo } from "react";
import { Cell, Column } from "react-table";
import { renderEntityTag } from "../EntityDetailUsedInTableUtils";

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

  const columns: Column<{}>[] = React.useMemo(
    () => [
      {
        Header: "Origin",
        accesor: "data",
        Cell: ({ row }: Cell) => {
          const useCase = row.original as IResponseUsedInMetaProp;
          const entityId = useCase.originId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && renderEntityTag(entity)}</>;
        },
      },
      {
        Header: "Type",
        Cell: ({ row }: Cell) => {
          const useCase = row.original as IResponseUsedInMetaProp;
          const entityId = useCase.typeId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && renderEntityTag(entity)}</>;
        },
      },
      {
        Header: "Value",
        Cell: ({ row }: Cell) => {
          const useCase = row.original as IResponseUsedInMetaProp;
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
