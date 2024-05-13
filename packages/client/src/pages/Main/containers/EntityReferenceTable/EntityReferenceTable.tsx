import { EntityEnums } from "@shared/enums";
import { IEntity, IReference } from "@shared/types";
import { excludedSuggesterEntities } from "Theme/constants";
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
import { CellProps, Column, Row, useTable } from "react-table";
import { deepCopy, normalizeURL } from "utils/utils";
import { EntityReferenceTableRow } from "./EntityReferenceTableRow";
import {
  StyledGrid,
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
  userCanEdit: boolean;
  alwaysShowCreateModal?: boolean;
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
  userCanEdit,
  alwaysShowCreateModal,
}) => {
  const [localReferences, setLocalReferences] = useState<IReference[]>([]);

  useEffect(() => {
    if (JSON.stringify(localReferences) !== JSON.stringify(references)) {
      setLocalReferences(references);
    }
  }, [references]);

  // Documents query
  // const {
  //   status: documentsStatus,
  //   data: documents,
  //   error: documentsError,
  //   isFetching: DocumentsIsFetching,
  // } = useQuery({
  //   queryKey: ["documents", localReferences],
  //   queryFn: async () => {
  //     const documentIds: string[] = [];

  //     localReferences
  //       .map((ref) => ref.resource)
  //       .forEach((ref) => {
  //         const refE = entities[ref];
  //         if (refE) {
  //           if (refE.data.documentId) {
  //             documentIds.push(refE.data.documentId);
  //           }
  //         }
  //       });
  //     const res = await api.documentsGet({ documentIds: documentIds });
  //     return res.data;
  //   },
  //   enabled: !!entityId && api.isLoggedIn(),
  // });

  const handleChangeResource = (
    refId: string,
    newReSourceId: string,
    instantUpdate?: boolean
  ) => {
    const newReferences = deepCopy(localReferences);
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
    const newReferences = deepCopy(localReferences);
    newReferences.forEach((ref: IReference) => {
      if (ref.id === refId) {
        ref.value = newValueId;
      }
    });
    onChange(newReferences, instantUpdate);
  };

  const handleRemove = (refId: string, instantUpdate?: boolean) => {
    const newReferences = deepCopy(localReferences).filter(
      (ref: IReference) => ref.id !== refId
    );
    onChange(newReferences, instantUpdate);
  };

  const handleAdd = () => {
    const newReferences = deepCopy(localReferences);
    newReferences.push(CReference());
    onChange(newReferences);
  };

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
          const resourceEntity: IEntity | undefined = reference.resource
            ? entities[reference.resource]
            : undefined;

          return (
            <StyledGrid>
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
                  disabled={disabled}
                >
                  <>
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
                  </>
                </EntityDropzone>
              ) : (
                <EntitySuggester
                  alwaysShowCreateModal={alwaysShowCreateModal}
                  openDetailOnCreate={openDetailOnCreate}
                  territoryActants={[]}
                  onSelected={(newSelectedId) => {
                    handleChangeResource(reference.id, newSelectedId, true);
                  }}
                  disableTemplatesAccept
                  categoryTypes={[EntityEnums.Class.Resource]}
                  isInsideTemplate={isInsideTemplate}
                  territoryParentId={territoryParentId}
                  disabled={disabled}
                />
              )}
            </StyledGrid>
          );
        },
      },
      {
        Header: "Part",
        Cell: ({ row }: CellType) => {
          const reference = row.original;
          const resourceEntity: IEntity | undefined = reference.resource
            ? entities[reference.resource]
            : undefined;
          const valueEntity: IEntity | undefined = reference.value
            ? entities[reference.value]
            : undefined;

          return (
            <StyledGrid>
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
                  disabled={disabled}
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
                <EntitySuggester
                  alwaysShowCreateModal={alwaysShowCreateModal}
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
                  disabled={disabled}
                />
              )}
            </StyledGrid>
          );
        },
      },
      // {
      //   id: "text reference",
      //   Cell: ({ row }: CellType) => {
      //     const reference = row.original;
      //     const resourceEntity = entities[reference.resource];

      //     const document =
      //       resourceEntity && documents
      //         ? documents.find(
      //             (doc) => doc.id === resourceEntity.data.documentId
      //           )
      //         : undefined;

      //     return (
      //       <>
      //         {resourceEntity ? (
      //           resourceEntity.data.documentId ? (
      //             document?.referencedEntityIds.includes(entityId) ? (
      //               <Button
      //                 tooltipLabel="with entity"
      //                 icon={<GrDocumentVerified />}
      //                 inverted
      //                 color="primary"
      //                 noBorder
      //               />
      //             ) : (
      //               <Button
      //                 tooltipLabel="no reference in document found"
      //                 icon={<GrDocument />}
      //                 inverted
      //                 color="plain"
      //                 noBorder
      //               />
      //             )
      //           ) : (
      //             <Button
      //               icon={<GrDocumentMissing />}
      //               tooltipLabel="no document assigned for this resource"
      //               color="danger"
      //               noBorder
      //               inverted
      //             />
      //           )
      //         ) : (
      //           <></>
      //         )}
      //       </>
      //     );
      //   },
      // },
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
      isInsideTemplate,
      territoryParentId,
      openDetailOnCreate,
      // documents,
    ]
  );

  const getRowId = useCallback((row: IReference) => {
    return row.id;
  }, []);

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
                userCanEdit={userCanEdit}
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
