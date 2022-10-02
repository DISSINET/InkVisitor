import { Tooltip } from "components";
import React, { ReactElement } from "react";
import { PopupPosition, EventType } from "reactjs-popup/dist/types";
import { Colors } from "types";
import { StyledContentWrap } from "./CustomTooltipStyles";

interface CustomTooltip {
  // trigger
  children: ReactElement;
  content?: ReactElement | ReactElement[];
  // settings
  position?: PopupPosition | PopupPosition[];
  on?: EventType | EventType[];
  noArrow?: boolean;
  color?: typeof Colors[number];
  disabled?: boolean;
  offsetX?: number;
  offsetY?: number;
  //
  tagGroup?: boolean;
}
export const CustomTooltip: React.FC<CustomTooltip> = ({
  children,
  content,
  // settings
  position,
  on,
  noArrow,
  color,
  disabled,
  offsetX,
  offsetY,
  //
  tagGroup = false,
}) => {
  const renderContent = () => (
    <StyledContentWrap tagGroup={tagGroup}>{content}</StyledContentWrap>
  );

  return (
    <Tooltip
      content={renderContent()}
      position={position}
      on={on}
      noArrow={noArrow}
      color={color}
      disabled={disabled}
      offsetX={offsetX}
      offsetY={offsetY}
    >
      {children}
    </Tooltip>
  );
};
