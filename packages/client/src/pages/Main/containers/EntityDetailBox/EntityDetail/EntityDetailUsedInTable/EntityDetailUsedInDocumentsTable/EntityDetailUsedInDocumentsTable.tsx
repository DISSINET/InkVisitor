import {
  IResponseDetail,
  IResponseUsedInDocument,
} from "@shared/types/response-detail";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, Table } from "components";
import {
  AbbreviatedTextWithTooltip,
  DocumentTitle,
  EntityTag,
} from "components/advanced";
import React, { useMemo } from "react";
import { FaTrashAlt } from "react-icons/fa";
import { HiClipboardList } from "react-icons/hi";
import { CellProps, Column } from "react-table";
import { toast } from "react-toastify";
import { StyledAnchorText } from "./EntityDetailUsedInDocumentsTableStyles";

type CellType = CellProps<IResponseUsedInDocument>;
interface EntityDetailUsedInDocumentsTable {
  title: { singular: string; plural: string };
  perPage?: number;
  entity: IResponseDetail;
  widthTooSmall: boolean;
}
export const EntityDetailUsedInDocumentsTable: React.FC<
  EntityDetailUsedInDocumentsTable
> = ({
  title,
  perPage,
  entity,
  widthTooSmall,
}: EntityDetailUsedInDocumentsTable) => {
  const { entities, usedInDocuments: uses, id: entityId } = entity;
  const queryClient = useQueryClient();

  const removeAnchorMutation = useMutation({
    mutationFn: (data: { documentId: string; anchorIndex: number }) =>
      api.documentRemoveAnchor(data.documentId, entityId, data.anchorIndex),
    onSuccess(data, variables, context) {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
    },
  });

  const columns = useMemo<Column<IResponseUsedInDocument>[]>(
    () => [
      {
        Header: "Anchor text",
        Cell: ({ row }: CellType) => {
          const { anchorText, document } = row.original;
          return (
            <>
              {anchorText ? (
                <StyledAnchorText>
                  <Button
                    color="primary"
                    icon={
                      <HiClipboardList
                        size={18}
                        style={{ cursor: "pointer", flexShrink: 0 }}
                      />
                    }
                    onClick={() => {
                      api
                        .documentGetAnchorText(
                          document.id,
                          entityId,
                          row.original.anchorIndex
                        )
                        .then((response) => {
                          if (response.data.data) {
                            window.navigator.clipboard.writeText(
                              response.data.data
                            );
                            toast.info("text copied to clipboard");
                          }
                        })
                        .catch((error) => {
                          console.error("Failed to get anchor text:", error);
                          toast.error("Failed to copy text to clipboard");
                        });
                    }}
                    tooltipLabel="copy anchored text to clipboard"
                    inverted
                    noBackground
                    noBorder
                    noIconMargin
                  />

                  <AbbreviatedTextWithTooltip
                    text={anchorText}
                    documentId={document.id}
                    entityId={entityId}
                    anchorIndex={row.original.anchorIndex}
                  />
                </StyledAnchorText>
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
          return (
            <>
              {resourceEntity && (
                <div style={{ display: "grid" }}>
                  <EntityTag entity={resourceEntity} fullWidth />
                </div>
              )}
            </>
          );
        },
      },
      {
        Header: "Document",
        Cell: ({ row }: CellType) => {
          const { document } = row.original;
          return document ? (
            <DocumentTitle
              title={document.title}
              width={widthTooSmall ? 60 : "full"}
            />
          ) : (
            <></>
          );
        },
      },
      {
        Header: "Parent T",
        Cell: ({ row }: CellType) => {
          const territoryEntity = entities[row.original.parentTerritoryId];
          return (
            <>
              {territoryEntity && (
                <div style={{ display: "grid" }}>
                  <EntityTag entity={territoryEntity} fullWidth />
                </div>
              )}
            </>
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
              color="danger"
              inverted
              onClick={() =>
                removeAnchorMutation.mutate({
                  documentId: row.original.document.id,
                  anchorIndex: row.original.anchorIndex,
                })
              }
            />
          );
        },
      },
    ],
    [entities, widthTooSmall]
  );

  return (
    <>
      <Table
        entityTitle={title}
        columns={columns}
        data={uses}
        perPage={perPage}
        isLoading={removeAnchorMutation.isPending}
      />
    </>
  );
};
