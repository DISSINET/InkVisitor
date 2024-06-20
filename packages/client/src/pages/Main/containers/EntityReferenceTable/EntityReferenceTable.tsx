import { EntityEnums } from "@shared/enums";
import { IEntity, IReference } from "@shared/types";
import { excludedSuggesterEntities } from "Theme/constants";
import { Button } from "components";
import { EntitySuggester } from "components/advanced";
import { CReference } from "constructors";
import update from "immutability-helper";
import React, { useCallback, useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import { CellProps } from "react-table";
import { deepCopy } from "utils/utils";
import { v4 as uuidv4 } from "uuid";
import { EntityReferenceTableRow } from "./EntityReferenceTableRow";

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

  // Attempts to move typed from one suggester to another
  const [tempResourceTyped, setTempResourceTyped] = useState("");
  const [tempValueTyped, setTempValueTyped] = useState("");
  const [fieldToUpdate, setFieldToUpdate] = useState<
    false | "resource" | "value"
  >(false);

  const [refResource, setRefResource] = useState("");
  const [refValue, setRefValue] = useState("");

  useEffect(() => {
    if (JSON.stringify(localReferences) !== JSON.stringify(references)) {
      setLocalReferences(references);
      if (fieldToUpdate === "resource") {
        // TODO: add to resource input
        setRefResource(tempResourceTyped);
        setTempResourceTyped("");
      } else if (fieldToUpdate === "value") {
        // TODO: add to value input
        setRefValue(tempValueTyped);
        setTempValueTyped("");
      }
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

  const moveRow = useCallback((dragIndex: number, hoverIndex: number) => {
    setLocalReferences((prevLocalReferences) =>
      update(prevLocalReferences, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevLocalReferences[dragIndex]],
        ],
      })
    );
  }, []);

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
            key={ref.id}
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
            initResourceTyped={
              localReferences.length === key + 1 ? refResource : undefined
            }
            initValueTyped={
              localReferences.length === key + 1 ? refValue : undefined
            }
          />
        );
      })}

      {/* Entity reference spare row */}
      <div
        style={{
          display: "flex",
          gap: ".5rem",
          marginTop: "3rem",
          marginLeft: "2rem",
        }}
      >
        {/* RESOURCE */}
        <EntitySuggester
          alwaysShowCreateModal={alwaysShowCreateModal}
          openDetailOnCreate={openDetailOnCreate}
          territoryActants={[]}
          onSelected={(newSelectedId) => {
            onChange(
              [
                ...references,
                { id: uuidv4(), resource: newSelectedId, value: "" },
              ],
              true
            );
            if (tempValueTyped.length) {
              setFieldToUpdate("value");
            }
          }}
          disableTemplatesAccept
          categoryTypes={[EntityEnums.Class.Resource]}
          isInsideTemplate={isInsideTemplate}
          territoryParentId={territoryParentId}
          disabled={disabled}
          onTyped={(typed) => setTempResourceTyped(typed)}
          initTyped={tempResourceTyped}
        />
        {/* VALUE */}
        <EntitySuggester
          alwaysShowCreateModal={alwaysShowCreateModal}
          excludedEntityClasses={excludedSuggesterEntities}
          openDetailOnCreate={openDetailOnCreate}
          territoryActants={[]}
          onSelected={(newSelectedId: string) => {
            onChange(
              [
                ...references,
                { id: uuidv4(), resource: "", value: newSelectedId },
              ],
              true
            );
            if (tempResourceTyped.length) {
              setFieldToUpdate("resource");
            }
          }}
          categoryTypes={[EntityEnums.Class.Value]}
          isInsideTemplate={isInsideTemplate}
          territoryParentId={territoryParentId}
          disabled={disabled}
          onTyped={(typed) => setTempValueTyped(typed)}
          initTyped={tempValueTyped}
        />
      </div>

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
