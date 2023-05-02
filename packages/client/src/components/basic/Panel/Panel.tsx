import React, { ReactNode } from "react";
import { useSpring } from "@react-spring/web";
import { springConfig } from "Theme/constants";
import { StyledPanel } from "./PanelStyles";

interface Panel {
  width: number;
  children: ReactNode;
}
export const Panel: React.FC<Panel> = ({ width, children }) => {
  const animatedWidth = useSpring({
    width: `${width / 10}rem`,
    config: springConfig.panelExpand,
  });
  return (
    <>
      <StyledPanel style={animatedWidth}>{children}</StyledPanel>
    </>
  );
};
