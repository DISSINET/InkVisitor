import React, { ReactElement } from "react";
import { PopupPosition, EventType } from "reactjs-popup/dist/types";

import { StyledPopup } from "./TooltipStyles";

interface Tooltip {
  children: ReactElement;
  position?: PopupPosition | PopupPosition[];
  on?: EventType | EventType[];
  label: string;
}
export const Tooltip: React.FC<Tooltip> = ({
  children,
  position = ["bottom center", "top center"],
  on = ["hover", "focus"],
  label,
}) => {
  return (
    <StyledPopup trigger={children} position={position} on={on}>
      {label}
    </StyledPopup>
  );
};
