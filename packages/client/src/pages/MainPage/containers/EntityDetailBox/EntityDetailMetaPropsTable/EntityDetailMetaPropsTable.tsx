import { UsedInPosition } from "@shared/enums";
import { IEntity, IResponseUsedInMetaProp } from "@shared/types";
import { Table } from "components";
import { useSearchParams } from "hooks";
import React, { useMemo } from "react";
import { Cell, Column } from "react-table";

interface EntityDetailMetaPropsTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInMetaProp<UsedInPosition>[];
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
          return "ahoj";
        },
      },
      {
        Header: "Type",
        Cell: ({ row }: Cell) => {
          return "ahoj";
        },
      },
      {
        Header: "Value",
        Cell: ({ row }: Cell) => {
          return "ahoj";
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
