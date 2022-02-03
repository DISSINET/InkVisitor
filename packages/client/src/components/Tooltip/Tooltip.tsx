import React, { ReactElement } from "react";
import { AiOutlineTag } from "react-icons/ai";
import { BiCommentDetail } from "react-icons/bi";
import { BsCardText } from "react-icons/bs";
import { ImListNumbered } from "react-icons/im";
import { EventType, PopupPosition } from "reactjs-popup/dist/types";
import { Colors } from "types";
import {
  StyledContentWrap,
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
  itemsCount?: number;
  attributes?: ReactElement;
  items?: ReactElement[] | ReactElement;
  color?: typeof Colors[number];
  tagTooltip?: boolean;
  noArrow?: boolean;
  disabled?: boolean;
  offsetX?: number;
  offsetY?: number;
}
export const Tooltip: React.FC<Tooltip> = ({
  children,
  position = ["bottom center", "right center", "top center"],
  on = ["hover", "focus"],
  label = "",
  detail,
  text,
  attributes,
  itemsCount,
  tagTooltip = false,
  disabled = false,
  noArrow = false,
  items,
  color = "black",
  offsetX,
  offsetY,
}) => {
  return (
    <StyledPopup
      trigger={children}
      mouseLeaveDelay={0}
      position={position}
      on={on}
      disabled={disabled}
      color={color}
      arrow={!noArrow}
      offsetX={offsetX}
      offsetY={offsetY}
    >
      <div>
        {attributes && <StyledContentWrap>{attributes}</StyledContentWrap>}
        {(tagTooltip || text || detail || label) && (
          <StyledContentWrap>
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
            {itemsCount !== undefined && (
              <StyledRow>
                <StyledIconWrap>
                  <ImListNumbered />
                </StyledIconWrap>
                <StyledDetail>{itemsCount}</StyledDetail>
              </StyledRow>
            )}
          </StyledContentWrap>
        )}
        {items && <StyledItemsWrap>{items}</StyledItemsWrap>}
      </div>
    </StyledPopup>
  );
};
