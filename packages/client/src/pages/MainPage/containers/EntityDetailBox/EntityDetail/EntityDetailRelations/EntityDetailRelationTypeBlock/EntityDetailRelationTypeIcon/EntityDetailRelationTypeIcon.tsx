import { RelationEnums } from "@shared/enums";
import { Relation } from "@shared/types";
import { LetterIcon } from "components";
import React from "react";
import { TbArrowsHorizontal, TbArrowNarrowRight } from "react-icons/tb";
import theme from "Theme/theme";
import { StyledRelationType } from "./EntityDetailRelationTypeIconStyles";

// TODO: Movo to components
interface EntityDetailRelationTypeIcon {
  relationType: RelationEnums.Type;
}
export const EntityDetailRelationTypeIcon: React.FC<
  EntityDetailRelationTypeIcon
> = ({ relationType }) => {
  const relationRule = Relation.RelationRules[relationType]!;

  return (
    <StyledRelationType>
      <LetterIcon letter={relationType} color="info" />
      {relationRule.inverseLabel ? (
        <TbArrowsHorizontal color={theme.color["info"]} />
      ) : (
        <TbArrowNarrowRight color={theme.color["info"]} />
      )}
    </StyledRelationType>
  );
};
