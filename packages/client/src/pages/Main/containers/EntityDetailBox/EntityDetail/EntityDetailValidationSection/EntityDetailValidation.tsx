import { entitiesDict } from "@shared/dictionaries";
import { classesAll } from "@shared/dictionaries/entity";
import { EntityEnums } from "@shared/enums";
import { IEntity } from "@shared/types";
import {
  EProtocolTieType,
  ITerritoryValidation,
} from "@shared/types/territory";
import { Button, Input } from "components";
import Dropdown, {
  AttributeButtonGroup,
  EntitySuggester,
  EntityTag,
} from "components/advanced";
import React from "react";
import { FaTrashAlt } from "react-icons/fa";
import {
  StyledBorderLeft,
  StyledFlexList,
  StyledGrid,
  StyledLabel,
  StyledSentence,
} from "./EntityDetailValidationStyles";

interface EntityDetailValidation {
  validation: ITerritoryValidation;
  entities: Record<string, IEntity>;
  updateValidationRule: (changes: Partial<ITerritoryValidation>) => void;
  removeValidationRule: () => void;
}
export const EntityDetailValidation: React.FC<EntityDetailValidation> = ({
  validation,
  entities,
  updateValidationRule,
  removeValidationRule,
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          paddingTop: "0.2rem",
          paddingBottom: "1.5rem",
        }}
      >
        <StyledSentence>
          {/* TODO: sentence generator */}
          {`Generated sentence than will include CAPS LOCK and <tags>`}
        </StyledSentence>
        <span>
          <Button
            color="danger"
            icon={<FaTrashAlt />}
            onClick={removeValidationRule}
            inverted
            tooltipLabel="remove validation rule"
          />
        </span>
      </div>
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
            <EntityTag
              flexListMargin
              entity={entities[classification]}
              unlinkButton={{
                onClick() {
                  updateValidationRule({
                    classifications: classifications.filter(
                      (c) => c !== classification
                    ),
                  });
                },
              }}
            />
          ))}
          <EntitySuggester
            excludedActantIds={classifications}
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
              shortValue: EProtocolTieType.Property,
              onClick: () =>
                updateValidationRule({ tieType: EProtocolTieType.Property }),
              selected: tieType === EProtocolTieType.Property,
            },
            {
              longValue: EProtocolTieType.Classification,
              shortValue: EProtocolTieType.Classification,
              onClick: () =>
                updateValidationRule({
                  tieType: EProtocolTieType.Classification,
                  propType: [],
                }),
              selected: tieType === EProtocolTieType.Classification,
            },
            {
              longValue: EProtocolTieType.Reference,
              shortValue: EProtocolTieType.Reference,
              onClick: () =>
                updateValidationRule({
                  tieType: EProtocolTieType.Reference,
                  propType: [],
                }),
              selected: tieType === EProtocolTieType.Reference,
            },
          ]}
        />

        {/* Prop type */}
        {tieType === EProtocolTieType.Property && (
          <>
            <StyledLabel>Prop type</StyledLabel>
            <StyledFlexList>
              {propType?.map((entityId) => (
                <EntityTag
                  flexListMargin
                  entity={entities[entityId]}
                  unlinkButton={{
                    onClick() {
                      updateValidationRule({
                        propType: propType?.filter((pTiD) => pTiD !== entityId),
                      });
                    },
                  }}
                />
              ))}
              <EntitySuggester
                categoryTypes={[EntityEnums.Class.Concept]}
                excludedActantIds={propType}
                onPicked={(entity) =>
                  updateValidationRule({
                    propType: [...(propType || []), entity.id],
                  })
                }
              />
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
            <EntityTag
              flexListMargin
              entity={entities[entityId]}
              unlinkButton={{
                onClick: () =>
                  updateValidationRule({
                    allowedEntities: allowedEntities.filter(
                      (aE) => aE !== entityId
                    ),
                  }),
              }}
            />
          ))}
          <EntitySuggester
            categoryTypes={classesAll}
            excludedActantIds={allowedEntities}
            onPicked={(entity) => {
              updateValidationRule({
                allowedEntities: [...(allowedEntities || []), entity.id],
                allowedClasses: [],
              });
            }}
          />
        </StyledFlexList>
      </StyledGrid>
    </StyledBorderLeft>
  );
};
