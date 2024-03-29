import {
  EProtocolTieType,
  ITerritoryValidation,
} from "@shared/types/territory";
import React from "react";
import {
  StyledBorderLeft,
  StyledFlexList,
  StyledGrid,
  StyledLabel,
  StyledSentence,
} from "./EntityDetailValidationStyles";
import { IEntity } from "@shared/types";
import { Button, Input } from "components";
import Dropdown, {
  AttributeButtonGroup,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import { entitiesDict } from "@shared/dictionaries";
import { EntityEnums } from "@shared/enums";
import { classesAll } from "@shared/dictionaries/entity";

interface EntityDetailValidation {
  validation: ITerritoryValidation;
  entities: Record<string, IEntity>;
  updateValidationRule: (changes: Partial<ITerritoryValidation>) => void;
}
export const EntityDetailValidation: React.FC<EntityDetailValidation> = ({
  validation,
  entities,
  updateValidationRule,
}) => {
  const {
    detail,
    entityClasses,
    classifications,
    tieType,
    propType,
    allowedClasses,
    allowedEntities,
  } = validation;
  return (
    <StyledBorderLeft>
      <StyledSentence>{`Generated sentence than will include CAPS LOCK and <tags>`}</StyledSentence>
      <StyledGrid>
        {/* Detail */}
        <StyledLabel>Detail</StyledLabel>
        <Input
          width="full"
          value={detail}
          onChangeFn={(value) => updateValidationRule({ detail: value })}
        />

        {/* Entity classes */}
        <StyledLabel>Entity types</StyledLabel>
        <Dropdown.Multi.Entity
          width="full"
          value={entityClasses}
          onChange={(values) => updateValidationRule({ entityClasses: values })}
          options={entitiesDict}
          // disabled={!userCanEdit}
        />

        {/* Classifications */}
        <StyledLabel>..classified as</StyledLabel>
        <StyledFlexList>
          {classifications.map((classification, key) => (
            <>
              <span
                onClick={() =>
                  updateValidationRule({
                    classifications: classifications.filter(
                      (c) => c !== classification
                    ),
                  })
                }
              >
                {classification}
              </span>
              {/* <EntityTag entity={entities[classification]} /> */}
            </>
          ))}
          <EntitySuggester
            categoryTypes={[EntityEnums.Class.Concept]}
            onPicked={(entity) =>
              updateValidationRule({
                classifications: [...classifications, entity.id],
              })
            }
          />
        </StyledFlexList>

        {/* Tie type */}
        <StyledLabel>Tie type</StyledLabel>
        <AttributeButtonGroup
          noMargin
          options={[
            {
              longValue: EProtocolTieType.Property,
              onClick: () =>
                updateValidationRule({ tieType: EProtocolTieType.Property }),
              selected: tieType === EProtocolTieType.Property,
            },
            {
              longValue: EProtocolTieType.Classification,
              onClick: () =>
                updateValidationRule({
                  tieType: EProtocolTieType.Classification,
                }),
              selected: tieType === EProtocolTieType.Classification,
            },
            {
              longValue: EProtocolTieType.Reference,
              onClick: () =>
                updateValidationRule({ tieType: EProtocolTieType.Reference }),
              selected: tieType === EProtocolTieType.Reference,
            },
          ]}
        />

        {/* Prop type */}
        {tieType === EProtocolTieType.Property && (
          <>
            <StyledLabel>Prop type</StyledLabel>
            <StyledFlexList>
              {propType?.map((entityId) => {
                return (
                  <>
                    <EntityTag entity={entities[entityId]} />
                  </>
                );
              })}
              <EntitySuggester categoryTypes={[EntityEnums.Class.Concept]} />
            </StyledFlexList>
          </>
        )}

        {/* Allowed classes */}
        <StyledLabel>Allowed E types</StyledLabel>
        <Dropdown.Multi.Entity
          width="full"
          value={allowedClasses || []}
          onChange={(values) =>
            updateValidationRule({ allowedClasses: values })
          }
          options={entitiesDict}
          disabled={allowedEntities && allowedEntities.length > 0}
          // disabled={!userCanEdit}
        />

        {/* Allowed entities */}
        <StyledLabel>Allowed E values</StyledLabel>
        <StyledFlexList>
          {allowedEntities?.map((entityId) => (
            <EntityTag entity={entities[entityId]} />
          ))}
          <EntitySuggester categoryTypes={classesAll} />
        </StyledFlexList>
      </StyledGrid>
      {/* <Button label="remove validation rule" onClick={() => } /> */}
    </StyledBorderLeft>
  );
};
