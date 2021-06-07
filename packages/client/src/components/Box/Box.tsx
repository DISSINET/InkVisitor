import React, { ReactNode } from "react";
import { animated, AnimatedValue, config, useSpring } from "react-spring";
import theme from "Theme/theme";

import { Colors } from "types";
import { StyledBox, StyledContent, StyledHead } from "./BoxStyles";

interface BoxProps {
  label?: string;
  color?: typeof Colors[number];
  width?: number;
  animatedWidth?: any;
  height?: number;
  noPadding?: boolean;
  children?: ReactNode;
  isExpanded?: boolean;
}

export const Box: React.FC<BoxProps> = ({
  label = "",
  color = "primary",
  width = 100,
  animatedWidth,
  height = 200,
  noPadding = false,
  isExpanded = true,
  children,
}) => {
  const animatedHeading = useSpring({
    opacity: isExpanded ? 1 : 0,
    config: config.stiff,
  });

  return (
    <StyledBox
      color={color}
      width={width}
      style={{ width: animatedWidth }}
      height={height}
    >
      <StyledHead color={color}>
        <animated.div style={animatedHeading}>{label}</animated.div>
      </StyledHead>
      <StyledContent color={color} noPadding={noPadding}>
        {children}
      </StyledContent>
    </StyledBox>
  );
};
