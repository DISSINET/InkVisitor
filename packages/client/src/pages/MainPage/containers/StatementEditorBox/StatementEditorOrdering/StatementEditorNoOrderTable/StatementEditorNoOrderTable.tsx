import { IEntity, IResponseGeneric, OrderType } from "@shared/types";
import { AxiosResponse } from "axios";
import { Button, Table } from "components";
import { EntityTag } from "components/advanced";
import React, { useMemo } from "react";
import { CgPlayListAdd } from "react-icons/cg";
import { UseMutationResult } from "react-query";
import { Cell, Column } from "react-table";

interface StatementEditorNoOrderTable {
  elements: OrderType[];
  entities: { [key: string]: IEntity };
  addToOrdering: (elementId: string) => void;
}
export const StatementEditorNoOrderTable: React.FC<
  StatementEditorNoOrderTable
> = ({ elements, entities, addToOrdering }) => {
  const data = useMemo(() => elements, [elements]);
  const columns: Column<{}>[] = React.useMemo(
    () => [
      {
        id: "button",
        accesor: "data",
        Cell: ({ row }: Cell) => {
          const { elementId } = row.original as any;

          return (
            <Button
              icon={<CgPlayListAdd />}
              onClick={() => addToOrdering(elementId)}
            />
          );
        },
      },
      {
        id: "tags",
        accessor: "data",
        Cell: ({ row }: Cell) => {
          console.log(row.original);
          const { entityId } = row.original as any;

          const entity = entities[entityId];
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
    ],
    [elements, entities]
  );

  return <Table data={data} columns={columns} disableHeading />;
};
