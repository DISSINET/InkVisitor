import { animated } from "react-spring";
import styled from "styled-components";
import { space2 } from "Theme/constants";

interface StyledBox {
  color: string;
  height?: number;
}
export const StyledBox = styled(animated.div)<StyledBox>`
  position: relative;
  display: flex;
  width: 100%;
  flex-direction: column;
  height: ${({ height }) => (height ? `${height / 10}rem` : "100%")};
`;

interface StyledHead {
  color: string;
}
export const StyledHead = styled(animated.div)<StyledHead>`
  background-color: ${({ theme, color }) => theme.color[color]};
  color: ${({ theme }) => theme.color["white"]};
  padding: ${space2};
  font-size: ${({ theme }) => theme.fontSize["base"]};
  line-height: 2rem;
  font-family: Muni;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  font-style: normal;
  text-transform: uppercase;
  border-color: ${({ theme }) => theme.color["grey"]};
  border-style: dashed;
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-bottom: none;
`;
interface StyledContent {
  $noPadding: boolean;
  color: string;
  $isExpanded: boolean;
}
export const StyledContent = styled(animated.div)<StyledContent>`
  background-color: ${({ theme }) => theme.color["white"]};
  padding: ${({ theme, $noPadding }) => ($noPadding ? 0 : theme.space[2])};
  display: flex;
  flex-direction: column;
  overflow: auto;
  height: 100%;
  font-size: ${({ theme }) => theme.fontSize["base"]};

  border-color: ${({ theme, color, $isExpanded }) =>
    $isExpanded ? theme.color[color] : theme.color["grey"]};
  border-style: ${({ $isExpanded }) => ($isExpanded ? "solid" : "dotted")};
  border-width: ${({ theme, $isExpanded }) =>
    $isExpanded ? theme.borderWidth[2] : theme.borderWidth[1]};
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
`;
interface StyledVerticalText {
  $showContentLabel: boolean;
}
export const StyledVerticalText = styled(animated.p)<StyledVerticalText>`
  position: absolute;
  top: ${({ theme }) => theme.space[12]};
  display: ${({ $showContentLabel }) =>
    $showContentLabel ? "initial" : "none"};
  left: ${({ theme }) => theme.space[1]};
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: Muni;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  font-size: ${({ theme }) => theme.fontSize["base"]};
  color: ${({ theme }) => theme.color["white"]};
`;
export const StyledButtonWrap = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.space[2]};
  right: ${({ theme }) => theme.space[2]};
`;
