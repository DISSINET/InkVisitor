import { EntityEnums } from "@shared/enums";
import { Tag } from "components";
import React from "react";
import { EntityColors } from "types";
import { StyledEntityTag, StyledLabel, StyledLabelWrap } from "./EntityTagStyles";

interface EmptyEntityTag {
  label: string;
}
export const EmptyEntityTag: React.FC<EmptyEntityTag> = ({ label }) => {
  return (
    <Tag
      propId={label}
      tagComponent={
        <StyledEntityTag
          $color={EntityColors[EntityEnums.Extension.NoClass].color}
          $isTemplate={false}
        >
          {EntityEnums.Extension.NoClass}
        </StyledEntityTag>
      }
      labelComponent={
        <StyledLabelWrap $invertedLabel={false}>
          <StyledLabel
            $invertedLabel={false}
            $fullWidth={false}
            $status={EntityEnums.Status.Approved}
            $isFavorited={false}
            $isItalic={true}
          >
            {label}
          </StyledLabel>
        </StyledLabelWrap>
      }
      disableDrag
    />
  );
};
