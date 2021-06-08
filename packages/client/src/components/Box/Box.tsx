import React, { ReactNode } from "react";
import { animated, AnimatedValue, config, useSpring } from "react-spring";
import { springConfig } from "Theme/constants";
import theme from "Theme/theme";

import { Colors } from "types";
import {
  StyledBox,
  StyledContent,
  StyledHead,
  StyledVerticalText,
} from "./BoxStyles";

interface BoxProps {
  label?: string;
  color?: typeof Colors[number];
  width?: number;
  animatedWidth?: any;
  height?: number;
  noPadding?: boolean;
  isExpanded?: boolean;
  button?: ReactNode;
  children?: ReactNode;
}

export const Box: React.FC<BoxProps> = ({
  label = "",
  color = "primary",
  width = 100,
  animatedWidth,
  height = 200,
  noPadding = false,
  isExpanded = true,
  button,
  children,
}) => {
  const animatedExpand = useSpring({
    opacity: isExpanded ? 1 : 0,
    contentBgColor: isExpanded ? "white" : theme.color["success"],
    config: springConfig.panelExpand,
  });
  const animatedCollapse = useSpring({
    backgroundColor: isExpanded ? "white" : theme.color["success"],
    config: springConfig.panelExpand,
  });

  return (
    <StyledBox
      color={color}
      width={width}
      style={{ width: animatedWidth }}
      height={height}
    >
      <StyledHead color={color}>
        <animated.div style={animatedExpand}>{label}</animated.div>
        {button && button}
      </StyledHead>
      <StyledContent
        color={color}
        noPadding={noPadding}
        style={animatedCollapse}
      >
        <animated.div style={animatedExpand}>{children}</animated.div>
        <StyledVerticalText>{label}</StyledVerticalText>
      </StyledContent>
    </StyledBox>
  );
};
