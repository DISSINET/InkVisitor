import React, { ReactElement } from "react";
import { EventType, PopupPosition } from "reactjs-popup/dist/types";
import { Colors } from "types";
import {
  StyledContentWrap,
  StyledLabel,
  StyledPopup,
  StyledRow,
} from "./TooltipStyles";

interface Tooltip {
  // trigger
  children: ReactElement;
  // simple tooltip
  label?: string;
  // tooltips with custom content
  content?: ReactElement[] | ReactElement;
  // settings
  position?: PopupPosition | PopupPosition[];
  on?: EventType | EventType[];
  color?: typeof Colors[number];
  noArrow?: boolean;
  disabled?: boolean;
  offsetX?: number;
  offsetY?: number;
  //
  tagGroup?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}
export const Tooltip: React.FC<Tooltip> = ({
  children,
  label = "",
  content,

  position = ["bottom center", "right center", "top center"],
  on = ["hover", "focus"],
  color = "black",
  disabled = false,
  offsetX,
  offsetY,
  noArrow = false,

  tagGroup = false,
  onOpen,
  onClose,
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
      onOpen={() => onOpen}
      onClose={() => onClose}
      keepTooltipInside
    >
      <div>
        {label && (
          <StyledContentWrap>
            <StyledRow>
              <StyledLabel>{label}</StyledLabel>
            </StyledRow>
          </StyledContentWrap>
        )}
        {content && (
          <StyledContentWrap tagGroup={tagGroup}>{content}</StyledContentWrap>
        )}
      </div>
    </StyledPopup>
  );
};
