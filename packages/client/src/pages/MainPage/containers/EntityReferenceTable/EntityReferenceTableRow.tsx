import { entityReferenceSourceDict } from "@shared/dictionaries";
import { EntityClass, EntityReferenceSource } from "@shared/enums";
import { IEntity, IReference, IOption, IResource, IValue } from "@shared/types";
import { Button, Dropdown, Input } from "components";
import { CEntityReference } from "constructors";
import React, { useEffect, useState } from "react";
import { FaPlus, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { OptionTypeBase } from "react-select";
import { sources } from "webpack";
import { StyledRow } from "../ActantSearchBox/ActantSearchBoxStyles";
import { EntitySuggester } from "../EntitySuggester/EntitySuggester";
import { EntityTag } from "../EntityTag/EntityTag";
import {
  StyledReferencesListColumn,
  StyledTagWrapper,
} from "./EntityReferenceInputStyles";

interface EntityReferenceTableRow {
  reference: IReference;
  resource: IEntity | undefined;
  value: IEntity | undefined;
  onChange: Function;
  disabled?: boolean;
  removeReference: Function;
}

export const EntityReferenceTableRow: React.FC<EntityReferenceTableRow> = ({
  reference,
  resource,
  value,
  onChange,
  disabled = true,
  removeReference,
}) => {
  const sendChanges = (newValues: IReference[]) => {
    // if (JSON.stringify(newValues) !== JSON.stringify(displayValues)) {
    onChange(newValues);
    // }
  };

  return (
    <React.Fragment>
      {/* resource */}
      <StyledReferencesListColumn>
        {resource ? (
          <StyledTagWrapper>
            <EntityTag
              actant={resource}
              fullWidth
              button={
                !disabled && (
                  <Button
                    key="d"
                    tooltip="unlink resource"
                    icon={<FaUnlink />}
                    inverted={true}
                    color="plain"
                    onClick={() => {
                      // updateReference(reference.id, {
                      //   resource: "",
                      // });
                    }}
                  />
                )
              }
            />
          </StyledTagWrapper>
        ) : (
          !disabled && (
            <EntitySuggester
              territoryActants={[]}
              openDetailOnCreate
              onSelected={(newSelectedId: string) => {
                // updateReference(reference.id, {
                //   resource: newSelectedId,
                // });
              }}
              categoryTypes={[EntityClass.Resource]}
            />
          )
        )}
      </StyledReferencesListColumn>

      {/* value */}
      <StyledReferencesListColumn>
        {value ? (
          <StyledTagWrapper>
            <EntityTag
              actant={value}
              fullWidth
              button={
                !disabled && (
                  <Button
                    key="d"
                    tooltip="unlink resource"
                    icon={<FaUnlink />}
                    inverted={true}
                    color="plain"
                    onClick={() => {
                      // updateReference(reference.id, {
                      //   resource: "",
                      // });
                    }}
                  />
                )
              }
            />
          </StyledTagWrapper>
        ) : (
          !disabled && (
            <EntitySuggester
              territoryActants={[]}
              openDetailOnCreate
              onSelected={(newSelectedId: string) => {
                // updateReference(reference.id, {
                //   resource: newSelectedId,
                // });
              }}
              categoryTypes={[EntityClass.Value]}
            />
          )
        )}
      </StyledReferencesListColumn>

      <StyledReferencesListColumn>
        {!disabled && (
          <Button
            key="delete"
            tooltip="remove reference row"
            inverted={true}
            icon={<FaTrashAlt />}
            color="plain"
            onClick={() => {
              removeReference(reference.id);
            }}
          />
        )}
      </StyledReferencesListColumn>
    </React.Fragment>
  );
};
