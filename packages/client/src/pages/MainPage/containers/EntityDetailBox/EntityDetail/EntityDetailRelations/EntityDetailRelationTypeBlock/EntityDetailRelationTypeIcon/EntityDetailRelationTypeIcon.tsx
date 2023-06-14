import { RelationEnums } from "@shared/enums";
import { Relation } from "@shared/types";
import theme from "Theme/theme";
import { Button, LetterIcon } from "components";
import React from "react";
import { BiNetworkChart } from "react-icons/bi";
import { TbArrowNarrowRight, TbArrowsHorizontal } from "react-icons/tb";
import { StyledLabel } from "../EntityDetailRelationTypeBlockStyles";
import { StyledRelationType } from "./EntityDetailRelationTypeIconStyles";

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
      {relationRule.inverseLabel ? (
        <TbArrowsHorizontal color={theme.color["info"]} />
      ) : (
        <TbArrowNarrowRight color={theme.color["info"]} />
      )}
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
