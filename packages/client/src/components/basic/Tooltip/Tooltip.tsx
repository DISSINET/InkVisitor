import React, { ReactElement } from "react";
import { EventType, PopupPosition } from "reactjs-popup/dist/types";
import { Colors } from "types";
import {
  StyledContentWrap,
  StyledItemsWrap,
  StyledLabel,
  StyledPopup,
  StyledRow,
} from "./TooltipStyles";

interface Tooltip {
  children: ReactElement;
  position?: PopupPosition | PopupPosition[];
  on?: EventType | EventType[];
  noArrow?: boolean;
  color?: typeof Colors[number];
  disabled?: boolean;
  offsetX?: number;
  offsetY?: number;
  // simple tooltip
  label?: string;
  content?: ReactElement[] | ReactElement;

  // entityTooltip
  tagTooltip?: boolean;
  detail?: string;
  text?: string;
  itemsCount?: number;

  // custom tooltip
  attributes?: ReactElement;
  items?: ReactElement[] | ReactElement;
  //
}
export const Tooltip: React.FC<Tooltip> = ({
  children,
  position = ["bottom center", "right center", "top center"],
  on = ["hover", "focus"],
  label = "",
  content,

  color = "black",
  disabled = false,
  offsetX,
  offsetY,
  // custom tooltip
  attributes,
  items,
  noArrow = false,
  // entityTooltip
  detail,
  text,
  itemsCount,
  // TODO: remove
  tagTooltip = false,
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
        {label && (
          <StyledContentWrap>
            <StyledRow>
              <StyledLabel>{label}</StyledLabel>
            </StyledRow>
          </StyledContentWrap>
        )}
        {content && <>{content}</>}

        {/* {(tagTooltip || text || detail || label) && (
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
        )} */}

        {attributes && <StyledContentWrap>{attributes}</StyledContentWrap>}
        {items && <StyledItemsWrap>{items}</StyledItemsWrap>}
      </div>
    </StyledPopup>
  );
};
