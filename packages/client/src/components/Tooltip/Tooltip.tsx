import React, { ReactElement } from "react";
import { PopupPosition, EventType } from "reactjs-popup/dist/types";

import { StyledDetail, StyledLabel, StyledPopup } from "./TooltipStyles";

interface Tooltip {
  children: ReactElement;
  position?: PopupPosition | PopupPosition[];
  on?: EventType | EventType[];
  label?: string;
  detail?: string;
  text?: string;
  disabled?: boolean;
  attributes?: React.ReactElement[];
}
export const Tooltip: React.FC<Tooltip> = ({
  children,
  position = ["bottom center", "right center", "top center"],
  on = ["hover", "focus"],
  label = "",
  detail,
  text,
  attributes,
  disabled = false,
}) => {
  return (
    <StyledPopup
      trigger={children}
      mouseLeaveDelay={0}
      position={position}
      on={on}
      disabled={disabled}
    >
      <div>
        <StyledLabel>
          {!label && !attributes ? "(no label)" : label}
        </StyledLabel>
        <StyledDetail>{detail}</StyledDetail>
        <StyledDetail>{text}</StyledDetail>
        {attributes}
      </div>
    </StyledPopup>
  );
};
