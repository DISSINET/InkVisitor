import { IEntity, IResponseUsedInMetaProp } from "@shared/types";
import { Table } from "components";
import { useSearchParams } from "hooks";
import React, { useMemo } from "react";
import { Cell, Column } from "react-table";
import { EntityTag } from "../../EntityTag/EntityTag";

interface EntityDetailMetaPropsTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInMetaProp[];
  perPage?: number;
}
export const EntityDetailMetaPropsTable: React.FC<
  EntityDetailMetaPropsTable
> = ({ title, entities, useCases, perPage = 5 }) => {
  const { detailId, setDetailId, setStatementId, territoryId, setTerritoryId } =
    useSearchParams();

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
          return <>{entity && <EntityTag actant={entity} />}</>;
        },
      },
      {
        Header: "Type",
        Cell: ({ row }: Cell) => {
          const useCase = row.original as IResponseUsedInMetaProp;
          const entityId = useCase.typeId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && <EntityTag actant={entity} />}</>;
        },
      },
      {
        Header: "Value",
        Cell: ({ row }: Cell) => {
          const useCase = row.original as IResponseUsedInMetaProp;
          const entityId = useCase.valueId;
          const entity = entityId ? entities[entityId] : false;
          return <>{entity && <EntityTag actant={entity} />}</>;
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
