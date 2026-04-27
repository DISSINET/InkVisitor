import { EntityEnums } from "@shared/enums";
import { Tag } from "components";
import React from "react";
import { EntityColors } from "types";
import {
  StyledEntityTag,
  StyledEntityTagWrap,
  StyledLabel,
  StyledLabelWrap,
} from "./EntityTagStyles";

interface EmptyEntityTag {
  label: string;
}
export const EmptyEntityTag: React.FC<EmptyEntityTag> = ({ label }) => {
  return (
    <StyledEntityTagWrap>
      <Tag
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
              $isItalic={true}
              $status={EntityEnums.Status.Approved}
              $invertedLabel={false}
              $fullWidth={false}
              $isFavorited={false}
            >
              {label}
            </StyledLabel>
          </StyledLabelWrap>
        }
        dragDisabled
      />
    </StyledEntityTagWrap>
  );
};
