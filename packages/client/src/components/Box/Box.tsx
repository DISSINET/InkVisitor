import React, { ReactNode, useState } from "react";
import {
  animated,
  AnimatedValue,
  config,
  OpaqueInterpolation,
  useSpring,
} from "react-spring";
import { springConfig } from "Theme/constants";
import theme from "Theme/theme";

import { Colors } from "types";
import {
  StyledBox,
  StyledContent,
  StyledContentAnimationWrap,
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
  const [hideContent, setHideContent] = useState<boolean>(false);
  const [showContentLabel, setShowContentLabel] = useState<boolean>(false);

  const animatedExpand = useSpring({
    opacity: isExpanded ? 1 : 0,
    contentLabelOpacity: isExpanded ? 0 : 1,
    contentBackgroundColor: isExpanded ? "white" : theme.color["primary"],
    onRest: () =>
      isExpanded ? setShowContentLabel(false) : setHideContent(true),
    onStart: () =>
      isExpanded ? setHideContent(false) : setShowContentLabel(true),
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
        $noPadding={noPadding}
        $isExpanded={isExpanded}
        style={{
          backgroundColor: animatedExpand.contentBackgroundColor as any,
        }}
      >
        <StyledContentAnimationWrap
          $hideContent={hideContent}
          style={animatedExpand}
        >
          {children}
        </StyledContentAnimationWrap>
        <StyledVerticalText
          $showContentLabel={showContentLabel}
          style={{
            opacity: animatedExpand.contentLabelOpacity as any,
          }}
        >
          {label}
        </StyledVerticalText>
      </StyledContent>
    </StyledBox>
  );
};
