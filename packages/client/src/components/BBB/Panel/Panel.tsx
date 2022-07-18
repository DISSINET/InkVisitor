import React, { ReactNode } from "react";
import { useSpring } from "react-spring";
import { springConfig } from "Theme/constants";
import { StyledPanel } from "./PanelStyles";

interface Panel {
  width: number;
  children: ReactNode;
}
export const Panel: React.FC<Panel> = ({ width = 100, children }) => {
  const animatedWidth = useSpring({
    width: `${width / 10}rem`,
    config: springConfig.panelExpand,
  });
  return <StyledPanel style={animatedWidth}>{children}</StyledPanel>;
};
