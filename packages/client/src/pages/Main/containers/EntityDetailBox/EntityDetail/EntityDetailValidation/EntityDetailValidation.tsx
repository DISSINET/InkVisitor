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
import { Input } from "components";
import Dropdown, {
  AttributeButtonGroup,
  EntitySuggester,
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
  return (
    <StyledBorderLeft>
      <StyledSentence>{`Generated sentence than will include CAPS LOCK and <tags>`}</StyledSentence>
      <StyledGrid>
        <StyledLabel>Detail</StyledLabel>
        <Input
          width="full"
          value={validation.detail}
          onChangeFn={(value) => updateValidationRule({ detail: value })}
        />
        <StyledLabel>Entity types</StyledLabel>
        <Dropdown.Multi.Entity
          width="full"
          value={validation.entityClasses}
          onChange={(values) => updateValidationRule({ entityClasses: values })}
          options={entitiesDict}
          // disabled={!userCanEdit}
        />
        <StyledLabel>..classified as</StyledLabel>
        <StyledFlexList>
          <EntitySuggester categoryTypes={[EntityEnums.Class.Concept]} />
        </StyledFlexList>
        <StyledLabel>Tie type</StyledLabel>
        <AttributeButtonGroup
          noMargin
          options={[
            {
              longValue: EProtocolTieType.Property,
              onClick: () =>
                updateValidationRule({ tieType: EProtocolTieType.Property }),
              selected: validation.tieType === EProtocolTieType.Property,
            },
            {
              longValue: EProtocolTieType.Classification,
              onClick: () =>
                updateValidationRule({
                  tieType: EProtocolTieType.Classification,
                }),
              selected: validation.tieType === EProtocolTieType.Classification,
            },
            {
              longValue: EProtocolTieType.Reference,
              onClick: () =>
                updateValidationRule({ tieType: EProtocolTieType.Reference }),
              selected: validation.tieType === EProtocolTieType.Reference,
            },
          ]}
        />
        {validation.tieType === EProtocolTieType.Property && (
          <>
            <StyledLabel>Prop type</StyledLabel>
            <StyledFlexList>
              <EntitySuggester categoryTypes={[EntityEnums.Class.Concept]} />
            </StyledFlexList>
          </>
        )}
        {/* Allowed classes */}
        <StyledLabel>Allowed E types</StyledLabel>
        <Dropdown.Multi.Entity
          width="full"
          value={validation.allowedClasses || []}
          onChange={(values) =>
            updateValidationRule({ allowedClasses: values })
          }
          options={entitiesDict}
          disabled={
            validation.allowedEntities && validation.allowedEntities.length > 0
          }
          // disabled={!userCanEdit}
        />
        {/* Allowed entities */}
        <StyledLabel>Allowed E values</StyledLabel>
        <StyledFlexList>
          <EntitySuggester categoryTypes={classesAll} />
        </StyledFlexList>
      </StyledGrid>
    </StyledBorderLeft>
  );
};
