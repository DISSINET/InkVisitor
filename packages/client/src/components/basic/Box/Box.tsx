import { animated, useSpring } from "@react-spring/web";
import { springConfig } from "Theme/constants";
import { ThemeColor } from "Theme/theme";
import { ButtonGroup } from "components";
import React, { CSSProperties, ReactNode, useState } from "react";
import {
  StyledBox,
  StyledHeaderComponentWrap,
  StyledContent,
  StyledContentAnimationWrap,
  StyledHead,
  StyledLabel,
  StyledVerticalText,
} from "./BoxStyles";

// Id the box content is reachable by from outside the React tree, for
// scrolling into it and for measuring the width its content has to work with.
export const boxContentId = (label: string) => `box-content-${label.toLowerCase()}`;

interface Box {
  label?: string;
  color?: keyof ThemeColor;
  borderColor?: keyof ThemeColor;
  height?: number;
  // Key of the shared height variable a separator drag writes this box to.
  // Boxes without one are sized from the height prop alone.
  heightVarKey?: string;
  noFrame?: boolean;
  isExpanded?: boolean;
  headerComponent?: ReactNode;
  buttons?: ReactNode[];
  children?: ReactNode;
  onHeaderClick?: () => void;
  disableHeaderClick?: boolean;
  disableScroll?: boolean;
  /** DOM id for the content element. Defaults to one derived from the label,
      which only holds while the label is fixed. */
  contentId?: string;
}

export const Box: React.FC<Box> = ({
  label = "",
  color,
  borderColor,
  height = 0,
  heightVarKey,
  noFrame = false,
  isExpanded = true,
  headerComponent,
  buttons,
  children,
  onHeaderClick,
  disableHeaderClick = false,
  disableScroll = false,
  contentId,
}) => {
  const [hideContent, setHideContent] = useState<boolean>(false);
  const [showContentLabel, setShowContentLabel] = useState<boolean>(!isExpanded);

  const animatedExpand = useSpring({
    opacity: isExpanded ? 1 : 0,
    contentLabelOpacity: isExpanded ? 0 : 1,
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
      style={
        {
          "--box-height": height ? `${height / 10}rem` : "100%",
        } as CSSProperties
      }
      $heightVarKey={heightVarKey}
      onClick={() => !isExpanded && onHeaderClick && onHeaderClick()}
      $isClickable={!isExpanded && onHeaderClick !== undefined}
    >
      <StyledHead
        $borderColor={borderColor}
        $isExpanded={isExpanded}
        $color={color}
        $noFrame={noFrame}
        $hasHeaderClick={onHeaderClick !== undefined && !disableHeaderClick && isExpanded}
        onClick={() => !disableHeaderClick && onHeaderClick && onHeaderClick()}
      >
        {!hideContent && isExpanded && <StyledLabel style={animatedExpand}>{label}</StyledLabel>}
        {headerComponent && (
          <StyledHeaderComponentWrap $isExpanded={isExpanded} $flexGrow>
            {headerComponent}
          </StyledHeaderComponentWrap>
        )}
        {buttons && (
          <StyledHeaderComponentWrap $isExpanded={isExpanded}>
            <ButtonGroup>
              {buttons.map((b, key) => (
                <React.Fragment key={key}>{b}</React.Fragment>
              ))}
            </ButtonGroup>
          </StyledHeaderComponentWrap>
        )}
      </StyledHead>
      <StyledContent
        id={contentId ?? boxContentId(label)}
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
