import { animated, useSpring } from "@react-spring/web";
import { springConfig } from "Theme/constants";
import theme, { ThemeColor } from "Theme/theme";
import { ButtonGroup } from "components";
import React, { ReactNode, useState } from "react";
import {
  StyledBox,
  StyledButtonWrap,
  StyledContent,
  StyledContentAnimationWrap,
  StyledHead,
  StyledVerticalText,
} from "./BoxStyles";

interface Box {
  label?: string;
  color?: keyof ThemeColor;
  borderColor?: keyof ThemeColor;
  height?: number;
  noPadding?: boolean;
  isExpanded?: boolean;
  button?: ReactNode[];
  children?: ReactNode;
}

export const Box: React.FC<Box> = ({
  label = "",
  color,
  borderColor,
  height = 0,
  noPadding = false,
  isExpanded = true,
  button,
  children,
}) => {
  const [hideContent, setHideContent] = useState<boolean>(false);
  const [showContentLabel, setShowContentLabel] = useState<boolean>(
    !isExpanded
  );

  const animatedExpand = useSpring({
    opacity: isExpanded ? 1 : 0,
    contentLabelOpacity: isExpanded ? 0 : 1,
    contentBackgroundColor: isExpanded
      ? theme.color["gray"]["200"]
      : theme.color["gray"]["300"],
    boxHeight: `${height / 10}rem`,
    onRest: () => {
      isExpanded ? setShowContentLabel(false) : setHideContent(true);
    },
    onStart: () => {
      isExpanded ? setHideContent(false) : setShowContentLabel(true);
    },
    config: springConfig.panelExpand,
  });

  return (
    <StyledBox
      style={{ height: animatedExpand.boxHeight as any }}
      height={height}
    >
      <StyledHead
        $borderColor={borderColor}
        $isExpanded={isExpanded}
        $color={color}
        $noPadding={noPadding}
      >
        {!hideContent && (
          <animated.div style={animatedExpand}>{label}</animated.div>
        )}
        <StyledButtonWrap>
          {button && (
            <ButtonGroup>
              {button.map((b, key) => (
                <React.Fragment key={key}>{b}</React.Fragment>
              ))}
            </ButtonGroup>
          )}
        </StyledButtonWrap>
      </StyledHead>
      <StyledContent
        id={`box-content-${label.toLowerCase()}`}
        $color={color}
        $borderColor={borderColor}
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
