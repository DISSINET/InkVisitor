import React, { ReactElement } from "react";
import { AiOutlineTag } from "react-icons/ai";
import { BiCommentDetail } from "react-icons/bi";
import { BsCardText } from "react-icons/bs";
import { PopupPosition, EventType } from "reactjs-popup/dist/types";
import { Colors } from "types";

import {
  StyledDetail,
  StyledIconWrap,
  StyledItemsWrap,
  StyledLabel,
  StyledPopup,
  StyledRow,
} from "./TooltipStyles";

interface Tooltip {
  children: ReactElement;
  position?: PopupPosition | PopupPosition[];
  on?: EventType | EventType[];
  label?: string;
  detail?: string;
  text?: string;
  disabled?: boolean;
  attributes?: React.ReactElement[];
  tagTooltip?: boolean;
  noBackground?: boolean;
  items?: ReactElement[] | ReactElement;
  color?: typeof Colors[number];
}
export const Tooltip: React.FC<Tooltip> = ({
  children,
  position = ["bottom center", "right center", "top center"],
  on = ["hover", "focus"],
  label = "",
  detail,
  text,
  attributes,
  tagTooltip = false,
  disabled = false,
  noBackground = false,
  items,
  color = "black",
}) => {
  return (
    <StyledPopup
      trigger={children}
      mouseLeaveDelay={0}
      position={position}
      on={on}
      disabled={disabled}
      noBackground={noBackground}
      color={color}
    >
      <div>
        {attributes ? (
          attributes
        ) : (
          <>
            <StyledRow>
              {tagTooltip && (
                <StyledIconWrap>
                  <AiOutlineTag />
                </StyledIconWrap>
              )}
              <StyledLabel>{label}</StyledLabel>
            </StyledRow>
            {text && (
              <StyledRow>
                <StyledIconWrap>{<BsCardText />}</StyledIconWrap>
                <StyledDetail>{text}</StyledDetail>
              </StyledRow>
            )}
            {(tagTooltip || detail) && (
              <StyledRow>
                {tagTooltip && (
                  <StyledIconWrap>
                    <BiCommentDetail />
                  </StyledIconWrap>
                )}
                <StyledDetail>{detail}</StyledDetail>
              </StyledRow>
            )}
          </>
        )}
        {items && <StyledItemsWrap>{items}</StyledItemsWrap>}
      </div>
    </StyledPopup>
  );
};
