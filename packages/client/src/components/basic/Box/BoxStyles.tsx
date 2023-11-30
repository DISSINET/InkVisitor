import { animated } from "@react-spring/web";
import { ThemeColor } from "Theme/theme";
import styled from "styled-components";

interface StyledBox {
  height?: number;
  isClickable?: boolean;
}
export const StyledBox = styled(animated.div)<StyledBox>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: ${({ height }) => (height ? `${height / 10}rem` : "100%")};
  cursor: ${({ isClickable }) => (isClickable ? "pointer" : "")};
`;

interface StyledHead {
  $color?: keyof ThemeColor;
  $borderColor?: keyof ThemeColor;
  $noPadding: boolean;
  $isExpanded: boolean;
  hasHeaderClick: boolean;
}
export const StyledHead = styled(animated.div)<StyledHead>`
  height: 3.2rem;
  background-color: ${({ theme, $color }) =>
    $color ? theme.color[$color] : ""};
  color: ${({ theme }) => theme.color["gray"]["600"]};
  padding: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["base"]};
  line-height: 2rem;
  font-family: Muni;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  font-style: normal;
  text-transform: uppercase;
  border-left-color: ${({ theme, $borderColor }) =>
    $borderColor ? theme.color[$borderColor] : theme.color["gray"][200]};
  border-left-style: solid;
  border-right-color: ${({ theme, $borderColor }) =>
    $borderColor ? theme.color[$borderColor] : theme.color["gray"][200]};
  border-right-style: solid;
  border-width: ${({ theme, $noPadding, $isExpanded }) =>
    $noPadding || !$isExpanded ? theme.borderWidth[1] : theme.borderWidth[4]};
  cursor: ${({ hasHeaderClick }) => (hasHeaderClick ? "pointer" : "")};
`;
interface StyledButtonWrap {}
export const StyledButtonWrap = styled.div<StyledButtonWrap>`
  position: absolute;
  top: ${({ theme }) => theme.space[2]};
  right: ${({ theme }) => theme.space[2]};
`;
interface StyledContent {
  $noPadding: boolean;
  $color?: keyof ThemeColor;
  $borderColor?: keyof ThemeColor;
  $isExpanded: boolean;
}
export const StyledContent = styled(animated.div)<StyledContent>`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  font-size: ${({ theme }) => theme.fontSize["base"]};

  border-color: ${({ theme, $isExpanded, $borderColor }) =>
    $isExpanded
      ? $borderColor
        ? theme.color[$borderColor]
        : theme.color["gray"]["200"]
      : ""};
  border-style: ${({ $isExpanded }) => ($isExpanded ? "solid" : "")};
  border-width: ${({ theme, $noPadding, $isExpanded }) =>
    $noPadding || !$isExpanded ? theme.borderWidth[1] : theme.borderWidth[4]};
  border-top: none;
`;
interface StyledContentAnimationWrap {
  $hideContent: boolean;
}
export const StyledContentAnimationWrap = styled(
  animated.div
)<StyledContentAnimationWrap>`
  display: ${({ $hideContent }) => ($hideContent ? "none" : "inherit")};
  flex-direction: column;
  height: 100%;
`;
interface StyledVerticalText {
  $showContentLabel: boolean;
}
export const StyledVerticalText = styled(animated.p)<StyledVerticalText>`
  position: absolute;
  top: ${({ theme }) => theme.space[14]};
  left: 0.4rem;
  display: ${({ $showContentLabel }) =>
    $showContentLabel ? "initial" : "none"};
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: Muni;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  font-size: ${({ theme }) => theme.fontSize["base"]};
  color: ${({ theme }) => theme.color["gray"]["600"]};
`;
