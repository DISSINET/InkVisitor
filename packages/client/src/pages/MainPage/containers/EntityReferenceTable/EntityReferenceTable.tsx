import { IEntity, IReference } from "@shared/types";
import { Button } from "components";
import { CReference } from "constructors";
import React from "react";
import { FaPlus } from "react-icons/fa";
import {
  StyledListHeaderColumn,
  StyledReferencesList,
} from "./EntityReferenceTableStyles";
import { EntityReferenceTableRow } from "./EntityReferenceTableRow";

interface EntityReferenceTable {
  entities: { [key: string]: IEntity };
  references: IReference[];
  onChange: (newRefefences: IReference[]) => void;
  disabled: boolean;
  openDetailOnCreate?: boolean;
  isInsideTemplate: boolean;
  territoryParentId?: string;
}

export const EntityReferenceTable: React.FC<EntityReferenceTable> = ({
  entities,
  references,
  onChange,
  disabled = true,
  openDetailOnCreate,
  isInsideTemplate,
  territoryParentId,
}) => {
  const sendChanges = (newValues: IReference[]) => {
    onChange(newValues);
  };

  const handleChangeResource = (refId: string, newReSourceId: string) => {
    const newReferences = [...references];
    newReferences.forEach((ref: IReference) => {
      if (ref.id === refId) {
        ref.resource = newReSourceId;
      }
    });
    sendChanges(newReferences);
  };

  const handleChangeValue = (refId: string, newValueId: string) => {
    const newReferences = [...references];
    newReferences.forEach((ref: IReference) => {
      if (ref.id === refId) {
        ref.value = newValueId;
      }
    });
    sendChanges(newReferences);
  };

  const handleRemove = (refId: string) => {
    const newReferences = [...references].filter(
      (ref: IReference) => ref.id !== refId
    );
    sendChanges(newReferences);
  };

  const handleAdd = () => {
    const newReferences = [...references];
    newReferences.push(CReference());
    sendChanges(newReferences);
  };

  return (
    <React.Fragment>
      {references && references.length > 0 && (
        <StyledReferencesList>
          <React.Fragment>
            <StyledListHeaderColumn>Resource</StyledListHeaderColumn>
            <StyledListHeaderColumn>Part</StyledListHeaderColumn>
            <StyledListHeaderColumn></StyledListHeaderColumn>
          </React.Fragment>

          {references &&
            references.map((reference: IReference, ri: number) => {
              const resourceEntity = entities[reference.resource];
              const valueEntity = entities[reference.value];
              return (
                <EntityReferenceTableRow
                  key={ri}
                  reference={reference}
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
