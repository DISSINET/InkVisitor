import { IEntity } from "@shared/types";
import { IResponseUsedInDocument } from "@shared/types/response-detail";
import { useMutation } from "@tanstack/react-query";
import api from "api";
import { Button, DocumentTitle, Table } from "components";
import { EntityTag } from "components/advanced";
import React, { useMemo } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { HiClipboardList } from "react-icons/hi";
import { CellProps, Column } from "react-table";

type CellType = CellProps<IResponseUsedInDocument>;
interface EntityDetailUsedInDocumentsTable {
  title: { singular: string; plural: string };
  entities: { [key: string]: IEntity };
  useCases: IResponseUsedInDocument[];
  perPage?: number;
}
export const EntityDetailUsedInDocumentsTable: React.FC<
  EntityDetailUsedInDocumentsTable
> = ({ title, entities, useCases = [], perPage }) => {
  const data = useMemo(() => useCases, [useCases]);

  const removeAnchorMutation = useMutation({
    mutationFn: (data: { documentId: string; entityId: string }) =>
      api.documentRemoveAnchors(data.documentId, data.entityId),
    onSuccess(data, variables, context) {},
  });

  const columns = useMemo<Column<IResponseUsedInDocument>[]>(
    () => [
      {
        Header: "Anchor text",
        // accessor: "data",
        Cell: ({ row }: CellType) => {
          const { anchorText } = row.original;
          return (
            <>
              {anchorText ? (
                <p>
                  <HiClipboardList
                    onClick={() =>
                      window.navigator.clipboard.writeText(anchorText)
                    }
                  />
                  {anchorText || ""}
                </p>
              ) : (
                <></>
              )}
            </>
          );
        },
      },
      {
        Header: "Resource",
        Cell: ({ row }: CellType) => {
          const resourceEntity = entities[row.original.resourceId];
          return <>{resourceEntity && <EntityTag entity={resourceEntity} />}</>;
        },
      },
      {
        Header: "Document",
        Cell: ({ row }: CellType) => {
          const { document } = row.original;
          return document ? <DocumentTitle title={document.title} /> : <></>;
        },
      },
      {
        Header: "Parent territory",
        Cell: ({ row }: CellType) => {
          const territoryEntity = entities[row.original.parentTerritoryId];
          return (
            <>{territoryEntity && <EntityTag entity={territoryEntity} />}</>
          );
        },
      },
      {
        id: "action btns",
        Header: "",
        Cell: ({ row }: CellType) => {
          return (
            <Button
              icon={<FaTrashAlt />}
              onClick={() =>
                removeAnchorMutation.mutate({
                  documentId: row.original.document.id,
                  // TODO: which entity id to remove
                  entityId: row.original.document.entityIds[0],
                })
              }
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
