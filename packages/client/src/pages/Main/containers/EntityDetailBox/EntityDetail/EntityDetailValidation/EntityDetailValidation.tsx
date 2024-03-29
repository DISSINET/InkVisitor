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
}
export const EntityDetailValidation: React.FC<EntityDetailValidation> = ({
  validation,
  entities,
}) => {
  return (
    <StyledBorderLeft>
      <StyledSentence>{`Generated sentence than will include CAPS LOCK and <tags>`}</StyledSentence>
      <StyledGrid>
        <StyledLabel>Detail</StyledLabel>
        <Input
          width="full"
          value={validation.detail}
          onChangeFn={(value) => console.log(value)}
        />
        <StyledLabel>Entity types</StyledLabel>
        <Dropdown.Multi.Entity
          width="full"
          value={[]}
          onChange={(values) => console.log(values)}
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
              onClick: () => console.log(EProtocolTieType.Property),
              selected: validation.tieType === EProtocolTieType.Property,
            },
            {
              longValue: EProtocolTieType.Classification,
              onClick: () => console.log(EProtocolTieType.Classification),
              selected: validation.tieType === EProtocolTieType.Classification,
            },
            {
              longValue: EProtocolTieType.Reference,
              onClick: () => console.log(EProtocolTieType.Reference),
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
        <StyledLabel>Allowed E types</StyledLabel>
        <Dropdown.Multi.Entity
          width="full"
          value={validation.allowedEntities || []}
          onChange={(values) => console.log(values)}
          options={entitiesDict}
          disabled={
            validation.allowedEntities && validation.allowedEntities.length > 0
          }
          // disabled={!userCanEdit}
        />
        <StyledLabel>Allowed E values</StyledLabel>
        <StyledFlexList>
          <EntitySuggester categoryTypes={classesAll} />
        </StyledFlexList>
      </StyledGrid>
    </StyledBorderLeft>
  );
};
