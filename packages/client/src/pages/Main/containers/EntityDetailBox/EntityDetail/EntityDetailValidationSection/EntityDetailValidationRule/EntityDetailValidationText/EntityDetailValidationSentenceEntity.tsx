import { IEntity } from "@shared/types";
import React, { useState } from "react";
import { getEntityLabel, getShortLabelByLetterCount } from "utils/utils";
import { StyledSentenceEntity } from "../EntityDetailValidationRuleStyles";
import { Tooltip } from "components";

interface EntityDetailValidationSentenceEntity {
  entity: IEntity;
  entityId: string;
  last: boolean;
}
export const EntityDetailValidationSentenceEntity: React.FC<
  EntityDetailValidationSentenceEntity
> = ({ entity, entityId, last }) => {
  const maxLetterCount = 15;
  const [isHovered, setIsHovered] = useState(false);
  const [referenceElement, setReferenceElement] =
    useState<HTMLSpanElement | null>(null);

  return (
    <span key={entityId}>
      <StyledSentenceEntity
        ref={setReferenceElement}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {getShortLabelByLetterCount(getEntityLabel(entity), maxLetterCount)}
      </StyledSentenceEntity>
      <Tooltip
        visible={getEntityLabel(entity).length > maxLetterCount && isHovered}
        referenceElement={referenceElement}
        label={getEntityLabel(entity)}
      />
      {!last && " or "}
    </span>
  );
};
