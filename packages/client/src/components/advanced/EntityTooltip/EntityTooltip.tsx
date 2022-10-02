import { Tooltip } from "components";
import React, { ReactElement } from "react";
import { AiOutlineTag } from "react-icons/ai";
import { BiCommentDetail } from "react-icons/bi";
import { BsCardText } from "react-icons/bs";
import { ImListNumbered } from "react-icons/im";
import { PopupPosition, EventType } from "reactjs-popup/dist/types";
import { Colors } from "types";
import {
  StyledContentWrap,
  StyledRow,
  StyledIconWrap,
  StyledLabel,
  StyledDetail,
  StyledTooltipSeparator,
} from "./EntityTooltipStyles";

interface EntityTooltip {
  // trigger
  children: ReactElement;
  // entity attributes
  label?: string;
  detail?: string;
  text?: string;
  itemsCount?: number;
  // tooltip settings
  position?: PopupPosition | PopupPosition[];
  on?: EventType | EventType[];
  noArrow?: boolean;
  color?: typeof Colors[number];
  disabled?: boolean;
  offsetX?: number;
  offsetY?: number;
}
export const EntityTooltip: React.FC<EntityTooltip> = ({
  label,
  detail,
  text,
  itemsCount,
  children,
}) => {
  const renderContent = () => (
    <>
      {(text || detail || label) && (
        <StyledContentWrap>
          <StyledRow>
            <StyledIconWrap>
              <AiOutlineTag />
            </StyledIconWrap>
            <StyledLabel>{label}</StyledLabel>
          </StyledRow>
          {text && (
            <StyledRow>
              <StyledIconWrap>{<BsCardText />}</StyledIconWrap>
              <StyledDetail>{text}</StyledDetail>
            </StyledRow>
          )}
          {detail && (
            <StyledRow>
              <StyledIconWrap>
                <BiCommentDetail />
              </StyledIconWrap>

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
    </>
  );

  return (
    <Tooltip content={renderContent()}>
      {/* <StyledTooltipSeparator> */}
      {children}
      {/* </StyledTooltipSeparator> */}
    </Tooltip>
  );
};
