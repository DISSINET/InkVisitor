import { EntityEnums } from "@shared/enums";
import { IEntity, IReference } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { excludedSuggesterEntities } from "Theme/constants";
import api from "api";
import { Button } from "components";
import {
  EntityDropzone,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import { CReference } from "constructors";
import update from "immutability-helper";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaExternalLinkAlt, FaPlus, FaTrashAlt } from "react-icons/fa";
import {
  GrDocument,
  GrDocumentMissing,
  GrDocumentVerified,
} from "react-icons/gr";
import { CellProps, Column, Row, useTable } from "react-table";
import { deepCopy, normalizeURL } from "utils/utils";
import { EntityReferenceTableRow } from "./EntityReferenceTableRow";
import {
  StyledReferenceValuePartLabel,
  StyledReferencesListButtons,
  StyledTable,
} from "./EntityReferenceTableStyles";

type CellType = CellProps<IReference>;

interface EntityReferenceTable {
  entityId: string;
  entities: {
    [key: string]: IEntity;
  };
  references: IReference[];
  onChange: (newRefefences: IReference[], instantUpdate?: boolean) => void;
  disabled: boolean;
  openDetailOnCreate?: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
}

export const EntityReferenceTable: React.FC<EntityReferenceTable> = ({
  entityId,
  entities,
  references,
  onChange,
  disabled = true,
  openDetailOnCreate,
  isInsideTemplate,
  territoryParentId,
}) => {
  // Documents query
  const {
    status: documentsStatus,
    data: documents,
    error: documentsError,
    isFetching: DocumentsIsFetching,
  } = useQuery(
    ["documents", references],
    async () => {
      const documentIds: string[] = [];

      references
        .map((ref) => ref.resource)
        .forEach((ref) => {
          const refE = entities[ref];
          if (refE) {
            if (refE.data.documentId) {
              documentIds.push(refE.data.documentId);
            }
          }
        });
      const res = await api.documentsGet({ documentIds: documentIds });
      return res.data;
    },
    { enabled: !!entityId && api.isLoggedIn() }
  );

  const handleChangeResource = (
    refId: string,
    newReSourceId: string,
    instantUpdate?: boolean
  ) => {
    const newReferences = deepCopy(references);
    newReferences.forEach((ref: IReference) => {
      if (ref.id === refId) {
        ref.resource = newReSourceId;
      }
    });
    onChange(newReferences, instantUpdate);
  };

  const handleChangeValue = (
    refId: string,
    newValueId: string,
    instantUpdate?: boolean
  ) => {
    const newReferences = deepCopy(references);
    newReferences.forEach((ref: IReference) => {
      if (ref.id === refId) {
        ref.value = newValueId;
      }
    });
    onChange(newReferences, instantUpdate);
  };

  const handleRemove = (refId: string, instantUpdate?: boolean) => {
    const newReferences = deepCopy(references).filter(
      (ref: IReference) => ref.id !== refId
    );
    onChange(newReferences, instantUpdate);
  };

  const handleAdd = () => {
    const newReferences = deepCopy(references);
    newReferences.push(CReference());
    onChange(newReferences);
  };

  const [localReferences, setLocalReferences] = useState<IReference[]>([]);

  useEffect(() => {
    setLocalReferences(references);
  }, [references]);

  const moveRow = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragRecord = localReferences[dragIndex];
      const newLocalReferences = update(localReferences, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, dragRecord],
        ],
      });

      setLocalReferences(newLocalReferences);
    },
    [localReferences]
  );

  const columns = useMemo<Column<IReference>[]>(
    () => [
      {
        Header: "Resource",
        Cell: ({ row }: CellType) => {
          const reference = row.original;
          const resourceEntity = entities[reference.resource];

          return (
            <>
              {resourceEntity ? (
                <EntityDropzone
                  onSelected={(newSelectedId: string) => {
                    handleChangeResource(reference.id, newSelectedId, true);
                  }}
                  disableTemplatesAccept
                  categoryTypes={[EntityEnums.Class.Resource]}
                  isInsideTemplate={isInsideTemplate}
                  territoryParentId={territoryParentId}
                  excludedActantIds={[resourceEntity.id]}
                >
                  <EntityTag
                    entity={resourceEntity}
                    fullWidth
                    unlinkButton={
                      !disabled && {
                        onClick: () => {
                          handleChangeResource(reference.id, "");
                        },
                        tooltipLabel: "unlink resource",
                      }
                    }
                  />
                </EntityDropzone>
              ) : (
                !disabled && (
                  <div>
                    <EntitySuggester
                      openDetailOnCreate={openDetailOnCreate}
                      territoryActants={[]}
                      onSelected={(newSelectedId: string) => {
                        handleChangeResource(reference.id, newSelectedId, true);
                      }}
                      disableTemplatesAccept
                      categoryTypes={[EntityEnums.Class.Resource]}
                      isInsideTemplate={isInsideTemplate}
                      territoryParentId={territoryParentId}
                    />
                  </div>
                )
              )}
            </>
          );
        },
      },
      {
        Header: "Part",
        Cell: ({ row }: CellType) => {
          const reference = row.original;
          const resourceEntity = entities[reference.resource];
          const valueEntity = entities[reference.value];

          return (
            <div style={{ display: "flex", alignItems: "center" }}>
              {valueEntity ? (
                <EntityDropzone
                  onSelected={(newSelectedId: string) => {
                    handleChangeValue(reference.id, newSelectedId, true);
                  }}
                  categoryTypes={[EntityEnums.Class.Value]}
                  excludedEntityClasses={excludedSuggesterEntities}
                  isInsideTemplate={isInsideTemplate}
                  territoryParentId={territoryParentId}
                  excludedActantIds={[valueEntity.id]}
                >
                  <EntityTag
                    entity={valueEntity}
                    customTooltipAttributes={
                      resourceEntity &&
                      resourceEntity.data.partValueLabel && {
                        partLabel: resourceEntity.data.partValueLabel,
                      }
                    }
                    fullWidth
                    unlinkButton={
                      !disabled && {
                        onClick: () => {
                          handleChangeValue(reference.id, "");
                        },
                        tooltipLabel: "unlink value",
                      }
                    }
                  />
                </EntityDropzone>
              ) : (
                !disabled && (
                  <div>
                    <EntitySuggester
                      placeholder={resourceEntity?.data?.partValueLabel}
                      excludedEntityClasses={excludedSuggesterEntities}
                      openDetailOnCreate={openDetailOnCreate}
                      territoryActants={[]}
                      onSelected={(newSelectedId: string) => {
                        handleChangeValue(reference.id, newSelectedId, true);
                      }}
                      categoryTypes={[EntityEnums.Class.Value]}
                      isInsideTemplate={isInsideTemplate}
                      territoryParentId={territoryParentId}
                    />
                  </div>
                )
              )}
            </div>
          );
        },
      },
      {
        id: "text reference",
        Cell: ({ row }: CellType) => {
          const reference = row.original;
          const resourceEntity = entities[reference.resource];

          const document =
            resourceEntity && documents
              ? documents.find(
                  (doc) => doc.id === resourceEntity.data.documentId
                )
              : undefined;

          return (
            <>
              {resourceEntity ? (
                resourceEntity.data.documentId ? (
                  document?.referencedEntityIds.includes(entityId) ? (
                    <Button
                      tooltipLabel="with entity"
                      icon={<GrDocumentVerified />}
                      inverted
                      color="primary"
                      noBorder
                    />
                  ) : (
                    <Button
                      tooltipLabel="no reference in document found"
                      icon={<GrDocument />}
                      inverted
                      color="plain"
                      noBorder
                    />
                  )
                ) : (
                  <Button
                    icon={<GrDocumentMissing />}
                    tooltipLabel="no document assigned for this resource"
                    color="danger"
                    noBorder
                    inverted
                  />
                )
              ) : (
                <></>
              )}
            </>
          );
        },
      },
      {
        id: "reference buttons",
        Cell: ({ row }: CellType) => {
          const reference = row.original;
          const resourceEntity = entities[reference.resource];
          const valueEntity = entities[reference.value];

          return (
            <>
              <StyledReferencesListButtons>
                {resourceEntity &&
                  valueEntity &&
                  resourceEntity.data.partValueBaseURL && (
                    <Button
                      key="url"
                      tooltipLabel="external link"
                      inverted
                      icon={<FaExternalLinkAlt />}
                      color="plain"
                      onClick={() => {
                        const url =
                          resourceEntity.data.partValueBaseURL.includes("http")
                            ? normalizeURL(
                                resourceEntity.data.partValueBaseURL
                              ) + valueEntity.label
                            : "//" +
                              normalizeURL(
                                resourceEntity.data.partValueBaseURL
                              ) +
                              valueEntity.label;
                        window.open(url, "_blank");
                      }}
                    />
                  )}
                {!disabled && (
                  <Button
                    key="delete"
                    tooltipLabel="remove reference row"
                    inverted
                    icon={<FaTrashAlt />}
                    color="plain"
                    onClick={() => {
                      handleRemove(reference.id);
                    }}
                  />
                )}
              </StyledReferencesListButtons>
            </>
          );
        },
      },
    ],
    [
      entities,
      documents,
      isInsideTemplate,
      territoryParentId,
      openDetailOnCreate,
    ]
  );

  const getRowId = useCallback((row: IReference) => {
    return row.id;
  }, []);
  9;
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    visibleColumns,
  } = useTable({
    columns,
    data: useMemo(() => localReferences || [], [localReferences]),
    getRowId,
  });

  return (
    <React.Fragment>
      <StyledTable {...getTableProps()}>
        <tbody {...getTableBodyProps()}>
          {rows.map((row: Row<IReference>, i: number) => {
            prepareRow(row);
            return (
              <EntityReferenceTableRow
                index={i}
                row={row}
                moveRow={moveRow}
                updateOrderFn={() => onChange(localReferences, true)}
                visibleColumns={visibleColumns}
                hasOrder={rows.length > 1}
                {...row.getRowProps()}
              />
            );
          })}
        </tbody>
      </StyledTable>

      <div style={{ marginTop: "1.5rem" }}>
        {!disabled && (
          <Button
            icon={<FaPlus />}
            label={"new reference"}
            onClick={() => handleAdd()}
          />
        )}
      </div>
    </React.Fragment>
  );
};
