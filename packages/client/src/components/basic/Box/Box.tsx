import { animated, useSpring } from "@react-spring/web";
import { springConfig } from "Theme/constants";
import { ThemeColor } from "Theme/theme";
import { ButtonGroup } from "components";
import React, { ReactNode, useState } from "react";
import {
  StyledBox,
  StyledHeaderComponentWrap,
  StyledContent,
  StyledContentAnimationWrap,
  StyledHead,
  StyledLabel,
  StyledVerticalText,
} from "./BoxStyles";

interface Box {
  label?: string;
  color?: keyof ThemeColor;
  borderColor?: keyof ThemeColor;
  height?: number;
  noFrame?: boolean;
  isExpanded?: boolean;
  headerComponent?: ReactNode;
  buttons?: ReactNode[];
  children?: ReactNode;
  onHeaderClick?: () => void;
  disableHeaderClick?: boolean;
  disableScroll?: boolean;
}

export const Box: React.FC<Box> = ({
  label = "",
  color,
  borderColor,
  height = 0,
  noFrame = false,
  isExpanded = true,
  headerComponent,
  buttons,
  children,
  onHeaderClick,
  disableHeaderClick = false,
  disableScroll = false,
}) => {
  const [hideContent, setHideContent] = useState<boolean>(false);
  const [showContentLabel, setShowContentLabel] = useState<boolean>(
    !isExpanded
  );

  const animatedExpand = useSpring({
    opacity: isExpanded ? 1 : 0,
    contentLabelOpacity: isExpanded ? 0 : 1,
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
      onClick={() => !isExpanded && onHeaderClick && onHeaderClick()}
      $isClickable={!isExpanded && onHeaderClick !== undefined}
    >
      <StyledHead
        $borderColor={borderColor}
        $isExpanded={isExpanded}
        $color={color}
        $noFrame={noFrame}
        $hasHeaderClick={
          onHeaderClick !== undefined && !disableHeaderClick && isExpanded
        }
        onClick={() => !disableHeaderClick && onHeaderClick && onHeaderClick()}
      >
        {!hideContent && (
          <StyledLabel style={animatedExpand}>{label}</StyledLabel>
        )}
        {headerComponent && (
          <StyledHeaderComponentWrap>
            {headerComponent}
          </StyledHeaderComponentWrap>
        )}
        {buttons && (
          <StyledHeaderComponentWrap>
            <ButtonGroup>
              {buttons.map((b, key) => (
                <React.Fragment key={key}>{b}</React.Fragment>
              ))}
            </ButtonGroup>
          </StyledHeaderComponentWrap>
        )}
      </StyledHead>
      <StyledContent
        id={`box-content-${label.toLowerCase()}`}
        $color={color}
        $borderColor={borderColor}
        $noFrame={noFrame}
        $isExpanded={isExpanded}
      >
        <StyledContentAnimationWrap
          $hideContent={hideContent}
          style={animatedExpand}
          $disableScroll={disableScroll}
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
