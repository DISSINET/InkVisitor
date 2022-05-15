import { EntityClass } from "@shared/enums";
import { IEntity, IReference } from "@shared/types";
import { Button } from "components";
import React from "react";
import { FaExternalLinkAlt, FaTrashAlt, FaUnlink } from "react-icons/fa";
import { EntitySuggester } from "../EntitySuggester/EntitySuggester";
import { EntityTag } from "../EntityTag/EntityTag";
import {
  StyledReferencesListButtons,
  StyledReferencesListColumn,
  StyledReferenceValuePartLabel,
  StyledTagWrapper,
} from "./EntityReferenceInputStyles";

interface EntityReferenceTableRow {
  reference: IReference;
  resource: IEntity | undefined;
  value: IEntity | undefined;
  onChange: Function;
  disabled?: boolean;
  handleRemove: (refId: string) => void;
  handleChangeResource: (refId: string, newResource: string) => void;
  handleChangeValue: (refId: string, newValue: string) => void;
  openDetailOnCreate?: boolean;
}

export const EntityReferenceTableRow: React.FC<EntityReferenceTableRow> = ({
  reference,
  resource,
  value,
  onChange,
  disabled = true,
  handleRemove,
  handleChangeResource,
  handleChangeValue,
  openDetailOnCreate = false,
}) => {
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
                      handleChangeResource(reference.id, "");
                    }}
                  />
                )
              }
            />
          </StyledTagWrapper>
        ) : (
          !disabled && (
            <div>
              <EntitySuggester
                openDetailOnCreate={openDetailOnCreate}
                territoryActants={[]}
                onSelected={(newSelectedId: string) => {
                  handleChangeResource(reference.id, newSelectedId);
                }}
                categoryTypes={[EntityClass.Resource]}
              />
            </div>
          )
        )}
      </StyledReferencesListColumn>

      {/* value */}
      <StyledReferencesListColumn>
        {resource && resource.data.partValueLabel && (
          <StyledReferenceValuePartLabel>
            ({resource.data.partValueLabel})
          </StyledReferenceValuePartLabel>
        )}
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
                      handleChangeValue(reference.id, "");
                    }}
                  />
                )
              }
            />
          </StyledTagWrapper>
        ) : (
          !disabled && (
            <div>
              <EntitySuggester
                openDetailOnCreate={openDetailOnCreate}
                territoryActants={[]}
                onSelected={(newSelectedId: string) => {
                  handleChangeValue(reference.id, newSelectedId);
                }}
                categoryTypes={[EntityClass.Value]}
              />
            </div>
          )
        )}
      </StyledReferencesListColumn>

      <StyledReferencesListColumn>
        <StyledReferencesListButtons>
          {resource && value && resource.data.partValueBaseURL && (
            <Button
              key="url"
              tooltip={""}
              inverted={true}
              icon={<FaExternalLinkAlt />}
              color="plain"
              onClick={() => {
                const url = resource.data.partValueBaseURL.includes("http")
                  ? resource.data.partValueBaseURL + value.label
                  : "//" + resource.data.partValueBaseURL + value.label;
                window.open(url, "_blank");
              }}
            />
          )}
          {!disabled && (
            <Button
              key="delete"
              tooltip="remove reference row"
              inverted={true}
              icon={<FaTrashAlt />}
              color="plain"
              onClick={() => {
                handleRemove(reference.id);
              }}
            />
          )}
        </StyledReferencesListButtons>
      </StyledReferencesListColumn>
    </React.Fragment>
  );
};
