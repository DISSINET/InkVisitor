import React, { CSSProperties, ReactNode } from "react";
import { StyledPanel } from "./PanelStyles";

interface Panel {
  width: number;
  // Index of the shared width variable a separator drag writes this panel to.
  // Panels without one are sized from the width prop alone.
  widthVarIndex?: number;
  children: ReactNode;
}

export const Panel: React.FC<Panel> = ({ width, widthVarIndex, children }) => (
  <StyledPanel
    $widthVarIndex={widthVarIndex}
    style={{ "--panel-width": `${width / 10}rem` } as CSSProperties}
  >
    {children}
  </StyledPanel>
);
