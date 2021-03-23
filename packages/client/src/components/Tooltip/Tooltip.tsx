import React, { ReactElement } from "react";
import { PopupPosition, EventType } from "reactjs-popup/dist/types";

import { StyledPopup } from "./TooltipStyles";

interface Tooltip {
  trigger: ReactElement;
  position?: PopupPosition | PopupPosition[];
  on?: EventType | EventType[];
  tooltip: string;
}
export const Tooltip: React.FC<Tooltip> = ({
  trigger,
  position = ["bottom center", "top center"],
  on = ["hover", "focus"],
  tooltip,
}) => {
  return (
    <StyledPopup trigger={trigger} position={position} on={on}>
      {tooltip}
    </StyledPopup>
  );
};
