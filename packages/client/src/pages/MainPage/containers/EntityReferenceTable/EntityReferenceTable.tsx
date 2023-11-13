import { IEntity, IReference } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { Button } from "components";
import { CReference } from "constructors";
import React from "react";
import { FaPlus } from "react-icons/fa";
import { EntityReferenceTableRow } from "./EntityReferenceTableRow";
import {
  StyledListHeaderColumn,
  StyledReferencesList,
} from "./EntityReferenceTableStyles";

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
    const newReferences = [...references];
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
    const newReferences = [...references];
    newReferences.forEach((ref: IReference) => {
      if (ref.id === refId) {
        ref.value = newValueId;
      }
    });
    onChange(newReferences, instantUpdate);
  };

  const handleRemove = (refId: string, instantUpdate?: boolean) => {
    const newReferences = [...references].filter(
      (ref: IReference) => ref.id !== refId
    );
    onChange(newReferences, instantUpdate);
  };

  const handleAdd = () => {
    const newReferences = [...references];
    newReferences.push(CReference());
    onChange(newReferences);
  };

  return (
    <React.Fragment>
      {references && references.length > 0 && (
        <StyledReferencesList>
          <React.Fragment>
            <StyledListHeaderColumn>Resource</StyledListHeaderColumn>
            <StyledListHeaderColumn>Part</StyledListHeaderColumn>
            <StyledListHeaderColumn></StyledListHeaderColumn>
            <StyledListHeaderColumn></StyledListHeaderColumn>
          </React.Fragment>

          {references &&
            references.map((reference: IReference, ri: number) => {
              const resourceEntity = entities[reference.resource];
              const valueEntity = entities[reference.value];

              const document =
                resourceEntity && documents
                  ? documents.find(
                      (doc) => doc.id === resourceEntity.data.documentId
                    )
                  : undefined;
              return (
                <EntityReferenceTableRow
                  key={ri}
                  reference={reference}
                  document={document}
                  entityId={entityId}
                  resource={resourceEntity}
                  value={valueEntity}
                  disabled={disabled}
                  handleRemove={handleRemove}
                  handleChangeResource={handleChangeResource}
                  handleChangeValue={handleChangeValue}
                  openDetailOnCreate={openDetailOnCreate}
                  isInsideTemplate={isInsideTemplate}
                  territoryParentId={territoryParentId}
                />
              );
            })}
        </StyledReferencesList>
      )}
      {!disabled && (
        <Button
          icon={<FaPlus />}
          label={"new reference"}
          onClick={() => handleAdd()}
        />
      )}
    </React.Fragment>
  );
};
