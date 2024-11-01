import { IEntity } from "@shared/types";
import { Button, Table } from "components";
import { EntityTag } from "components/advanced";
import React, { useMemo } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { HiClipboardList } from "react-icons/hi";
import { CellProps, Column } from "react-table";

type CellType = CellProps<any>;

interface EntityDetailAnchorTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: any[];
  perPage?: number;
}
export const EntityDetailAnchorTable: React.FC<EntityDetailAnchorTable> = ({
  title,
  entities,
  useCases,
  perPage,
}) => {
  const data = useMemo(() => (useCases ? useCases : []), [useCases]);

  const columns = useMemo<Column<any>[]>(
    () => [
      {
        Header: "Anchor text",
        accessor: "data",
        Cell: ({ row }: CellType) => {
          return (
            <p>
              <HiClipboardList
                onClick={() => console.log("copy to clipboard")}
              />
            </p>
          );
        },
      },
      {
        Header: "Resource",
        Cell: ({ row }: CellType) => {
          return <>resource</>;
          // <EntityTag entity={} />
        },
      },
      {
        Header: "Document",
        Cell: ({ row }: CellType) => {
          return <>document</>;
        },
      },
      {
        Header: "Parent territory",
        Cell: ({ row }: CellType) => {
          return (
            <></>
            // <EntityTag entity={} />
          );
        },
      },
      {
        id: "action btns",
        Header: "",
        accessor: "data",
        Cell: ({ row }: CellType) => {
          return (
            <Button
              icon={<FaTrashAlt />}
              onClick={() => console.log("remove anchor")}
            />
          );
        },
      },
    ],
    []
  );

  return (
    <Table
      entityTitle={title}
      columns={columns}
      data={data}
      perPage={perPage}
    />
  );
};
