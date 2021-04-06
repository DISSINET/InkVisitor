import React, { ReactElement } from "react";
import { PopupPosition, EventType } from "reactjs-popup/dist/types";

import { StyledPopup } from "./TooltipStyles";

interface Tooltip {
  children: ReactElement;
  position?: PopupPosition | PopupPosition[];
  on?: EventType | EventType[];
  label: string;
  disabled?: boolean;
}
export const Tooltip: React.FC<Tooltip> = ({
  children,
  position = ["bottom center", "right center", "top center"],
  on = ["hover", "focus"],
  label = "",
  disabled = false,
}) => {
  return (
    <StyledPopup
      trigger={children}
      position={position}
      on={on}
      disabled={disabled || label.length === 0}
    >
      {label}
    </StyledPopup>
  );
};
