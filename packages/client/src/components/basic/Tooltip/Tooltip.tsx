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
  // trigger
  children: ReactElement;
  // simple tooltip
  label?: string;
  // tooltips with custom content
  content?: ReactElement[] | ReactElement;
  // settings
  position?: PopupPosition | PopupPosition[];
  on?: EventType | EventType[];
  noArrow?: boolean;
  color?: typeof Colors[number];
  disabled?: boolean;
  offsetX?: number;
  offsetY?: number;

  // TODO: remove - old tooltip
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

        {/* TODO: remove */}
        {attributes && <StyledContentWrap>{attributes}</StyledContentWrap>}
        {items && <StyledItemsWrap>{items}</StyledItemsWrap>}
      </div>
    </StyledPopup>
  );
};
