import {
  IResponseDetail,
  IResponseUsedInDocument,
} from "@shared/types/response-detail";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import { Button, IconWithTooltip, Table } from "components";
import {
  AbbreviatedTextWithTooltip,
  DocumentTitle,
  EntityTag,
} from "components/advanced";
import React, { useMemo } from "react";
import { FaAnchor, FaTrashAlt } from "react-icons/fa";
import { HiClipboardList } from "react-icons/hi";
import { CellProps, Column } from "react-table";
import { toast } from "react-toastify";
import { StyledAnchorText } from "./EntityDetailUsedInDocumentsTableStyles";
import { useSearchParams } from "hooks";
import { useAppDispatch, useAppSelector } from "redux/hooks";
import { setDetailBoxState } from "redux/features/layout/mainPage/detailBoxStateSlice";
import { DetailBoxState } from "types";
import { EntityEnums } from "@shared/enums";
import useAnnotator from "hooks/useAnnotator";
import { setStatementListOpened } from "redux/features/layout/mainPage/statementListOpenedSlice";
import { TbAnchorOff } from "react-icons/tb";
import { setAnnotatorOpened } from "redux/features/layout/mainPage/annotatorOpenedSlice";

type CellType = CellProps<IResponseUsedInDocument>;
interface EntityDetailUsedInDocumentsTable {
  title: { singular: string; plural: string };
  perPage?: number;
  entity: IResponseDetail;
  widthTooNarrow: boolean;
}
export const EntityDetailUsedInDocumentsTable: React.FC<
  EntityDetailUsedInDocumentsTable
> = ({
  title,
  perPage,
  entity,
  widthTooNarrow,
}: EntityDetailUsedInDocumentsTable) => {
  const detailBoxState: DetailBoxState = useAppSelector(
    (state) => state.layout.mainPage.detailBoxState
  );

  const {
    entities,
    usedInDocuments: uses,
    id: entityId,
    class: entityClass,
  } = entity;
  const queryClient = useQueryClient();

  const removeAnchorMutation = useMutation({
    mutationFn: (data: { documentId: string; anchorIndex: number }) =>
      api.documentRemoveAnchor(data.documentId, entityId, data.anchorIndex),
    onSuccess(data, variables, context) {
      queryClient.invalidateQueries({ queryKey: ["entity"] });
      queryClient.invalidateQueries({ queryKey: ["document"] });
    },
  });

  const { setTerritoryId, setStatementId, territoryId } = useSearchParams();
  const dispatch = useAppDispatch();

  const { scrollToAnchor } = useAnnotator();

  const columns = useMemo<Column<IResponseUsedInDocument>[]>(
    () => [
      {
        id: "anchor btn",
        Cell: ({ row }: CellType) => {
          const { parentTerritoryId } = row.original;
          return (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {parentTerritoryId ||
              entityClass === EntityEnums.Class.Territory ? (
                <Button
                  tooltipLabel="locate in annotator"
                  onClick={() => {
                    let timeout = 0;
                    if (
                      territoryId !== parentTerritoryId ||
                      detailBoxState === DetailBoxState.FullHeight
                    ) {
                      // set more time to open statement list, annotator and/or find the territory
                      timeout = 2000;
                    } else {
                      timeout = 100;
                    }
                    if (parentTerritoryId) {
                      setTerritoryId(parentTerritoryId);
                    } else if (entityClass === EntityEnums.Class.Territory) {
                      setTerritoryId(entityId);
                    }

                    if (entityClass === EntityEnums.Class.Statement) {
                      setStatementId(entityId);
                    }

                    if (detailBoxState === DetailBoxState.FullHeight) {
                      dispatch(setStatementListOpened(true));
                      dispatch(setDetailBoxState(DetailBoxState.Normal));
                    }
                    dispatch(setAnnotatorOpened(true));

                    setTimeout(() => {
                      scrollToAnchor(entityId, row.original.anchorIndex);
                    }, timeout);
                  }}
                  icon={<FaAnchor size={16} />}
                  inverted
                  noBackground
                  noBorder
                  noIconMargin
                />
              ) : (
                <IconWithTooltip
                  color="greyer"
                  icon={<TbAnchorOff size={16} />}
                  tooltipLabel="anchor without parent territory cannot be located in Annotator"
                />
              )}
            </div>
          );
        },
      },
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
              width={widthTooNarrow ? 60 : 100}
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
    [
      entities,
      detailBoxState,
      entityClass,
      entityId,
      territoryId,
      widthTooNarrow,
    ]
  );

  return (
    <>
      <Table
        entityTitle={title}
        columns={columns}
        data={uses}
        perPage={perPage}
        isLoading={removeAnchorMutation.isPending}
        firstColumnMinWidth
        // lastColumnMinWidth
      />
    </>
  );
};
