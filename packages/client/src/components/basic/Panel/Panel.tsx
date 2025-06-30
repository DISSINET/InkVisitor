import React, { ReactNode, useEffect, useState } from "react";
import { useSpring } from "@react-spring/web";
import { springConfig } from "Theme/constants";
import { StyledPanel } from "./PanelStyles";

interface Panel {
  width: number;
  children: ReactNode;
}

export const Panel: React.FC<Panel> = ({ width, children }) => {
  const [initialWidth, setInitialWidth] = useState<number | null>(null);

  const animatedWidth = useSpring({
    width: `${width / 10}rem`,
    config: springConfig.panelExpand,
    immediate: initialWidth === null,
  });

  useEffect(() => {
    if (initialWidth === null && width > 0) {
      setInitialWidth(width);
    }
  }, [width, initialWidth]);

  return (
    <>
      <StyledPanel style={animatedWidth}>{children}</StyledPanel>
    </>
  );
};
