import { RelationEnums } from "@inkvisitor/shared/enums";
import { Relation } from "@inkvisitor/shared/types";
import { Button, LetterIcon } from "components";
import { CopyUuidsButton } from "components/advanced";
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
  copyUuids?: string[];
}
export const EntityDetailRelationTypeIcon: React.FC<
  EntityDetailRelationTypeIcon
> = ({
  relationType,
  graphOpen = false,
  handleOpenGraph = () => {},
  hideLabel,
  copyUuids = [],
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
      {copyUuids.length > 0 && <CopyUuidsButton uuids={copyUuids} />}
    </StyledRelationType>
  );
};
