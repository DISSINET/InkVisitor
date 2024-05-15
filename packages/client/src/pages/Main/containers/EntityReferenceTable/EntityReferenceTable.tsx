import { IEntity, IReference } from "@shared/types";
import { Button } from "components";
import { CReference } from "constructors";
import update from "immutability-helper";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaExternalLinkAlt, FaPlus, FaTrashAlt } from "react-icons/fa";
import { CellProps, Column } from "react-table";
import { deepCopy, normalizeURL } from "utils/utils";
import { EntityReferenceTableResource } from "./EntityReferenceTableResource";
import { EntityReferenceTableRow } from "./EntityReferenceTableRow";
import { StyledReferencesListButtons } from "./EntityReferenceTableStyles";
import { EntityReferenceTableValue } from "./EntityReferenceTableValue";

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

  // OLD DOCUMENTS IMPLEMENTATION
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

  return (
    <React.Fragment>
      {localReferences.map((ref, key) => {
        return (
          <EntityReferenceTableRow
            key={key}
            index={key}
            reference={ref}
            entities={entities}
            handleChangeResource={handleChangeResource}
            handleChangeValue={handleChangeValue}
            handleRemove={handleRemove}
            hasOrder={localReferences.length > 1}
            alwaysShowCreateModal={alwaysShowCreateModal}
            updateOrderFn={() => onChange(localReferences, true)}
            moveRow={moveRow}
            isInsideTemplate={isInsideTemplate}
            userCanEdit={userCanEdit}
            disabled={disabled}
            openDetailOnCreate={openDetailOnCreate}
            territoryParentId={territoryParentId}
          />
        );
      })}

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
