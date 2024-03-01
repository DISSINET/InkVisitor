import { RelationEnums } from "@shared/enums";
import { Relation } from "@shared/types";
import { Button, LetterIcon } from "components";
import React from "react";
import { BiNetworkChart } from "react-icons/bi";
import { TbArrowNarrowRight, TbArrowsHorizontal } from "react-icons/tb";
import {
  StyledArrow,
  StyledLabel,
  StyledRelationType,
} from "./EntityDetailRelationTypeIconStyles";

interface EntityDetailRelationTypeIcon {
  relationType: RelationEnums.Type;
  graphOpen?: boolean;
  handleOpenGraph?: () => void;
  hideLabel?: boolean;
}
export const EntityDetailRelationTypeIcon: React.FC<
  EntityDetailRelationTypeIcon
> = ({
  relationType,
  graphOpen = false,
  handleOpenGraph = () => {},
  hideLabel,
}) => {
  const relationRule = Relation.RelationRules[relationType]!;

  return (
    <StyledRelationType>
      <LetterIcon letter={relationType} color="info" />
      {!hideLabel && <StyledLabel>{relationRule.label}</StyledLabel>}
      <StyledArrow>
        {relationRule.inverseLabel ? (
          <TbArrowsHorizontal />
        ) : (
          <TbArrowNarrowRight />
        )}
      </StyledArrow>
      {relationRule.graph && (
        <Button
          icon={<BiNetworkChart />}
          onClick={handleOpenGraph}
          inverted={graphOpen}
        />
      )}
    </StyledRelationType>
  );
};
