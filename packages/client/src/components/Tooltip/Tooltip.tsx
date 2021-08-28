import React, { ReactElement } from "react";
import { PopupPosition, EventType } from "reactjs-popup/dist/types";

import { StyledDetail, StyledLabel, StyledPopup } from "./TooltipStyles";

interface Tooltip {
  children: ReactElement;
  position?: PopupPosition | PopupPosition[];
  on?: EventType | EventType[];
  label?: string;
  detail?: string;
  disabled?: boolean;
}
export const Tooltip: React.FC<Tooltip> = ({
  children,
  position = ["bottom center", "right center", "top center"],
  on = ["hover", "focus"],
  label = "",
  disabled = false,
  detail = "",
}) => {
  return (
    <StyledPopup
      trigger={children}
      mouseLeaveDelay={0}
      position={position}
      on={on}
      disabled={disabled || (label.length === 0 && detail.length === 0)}
    >
      <div>
        <StyledLabel>{label}</StyledLabel>
        <StyledDetail>{detail}</StyledDetail>
      </div>
    </StyledPopup>
  );
};
