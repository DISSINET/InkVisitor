import { animated } from "@react-spring/web";
import { ThemeColor } from "Theme/theme";
import styled from "styled-components";
import { boxHeightVar } from "utils/layoutUtils";

interface StyledBox {
  $heightVarKey?: string;
  $isClickable?: boolean;
}
export const StyledBox = styled.div<StyledBox>`
  position: relative;
  display: flex;
  flex-direction: column;
  /* The shared variable carries every frame of both a drag and a spring, so
     nothing is eased here; --box-height is the height the box rendered with. */
  height: ${({ $heightVarKey }) =>
    $heightVarKey !== undefined
      ? `var(${boxHeightVar($heightVarKey)}, var(--box-height))`
      : "var(--box-height)"};
  cursor: ${({ $isClickable }) => ($isClickable ? "pointer" : "")};
`;

interface StyledHead {
  $color?: keyof ThemeColor;
  $borderColor?: keyof ThemeColor;
  $noFrame: boolean;
  $isExpanded: boolean;
  $hasHeaderClick: boolean;
}
export const StyledHead = styled.div<StyledHead>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]};
  height: 3.2rem;
  background-color: ${({ theme, $color }) => ($color ? theme.color[$color] : "")};
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
  border-width: ${({ theme, $noFrame, $isExpanded }) =>
    $noFrame || !$isExpanded ? theme.borderWidth[1] : theme.borderWidth[4]};
  cursor: ${({ $hasHeaderClick }) => ($hasHeaderClick ? "pointer" : "")};
`;
export const StyledLabel = styled(animated.div)`
  display: block;
  min-width: 0;
  flex-shrink: 1;
  white-space: nowrap;
  overflow: hidden !important;
  text-overflow: ellipsis;
`;
interface StyledHeaderComponentWrap {
  $isExpanded: boolean;
  $flexGrow?: boolean;
}
export const StyledHeaderComponentWrap = styled.div<StyledHeaderComponentWrap>`
  display: flex;
  justify-content: center;
  align-items: center;
  width: ${({ $isExpanded }) => ($isExpanded ? "auto" : "100%")};
  flex-grow: ${({ $flexGrow }) => ($flexGrow ? 1 : 0)};
`;
interface StyledContent {
  $noFrame: boolean;
  $color?: keyof ThemeColor;
  $borderColor?: keyof ThemeColor;
  $isExpanded: boolean;
}
export const StyledContent = styled.div<StyledContent>`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  height: 100%;
  font-size: ${({ theme }) => theme.fontSize["base"]};

  border-color: ${({ theme, $isExpanded, $borderColor }) =>
    $isExpanded ? ($borderColor ? theme.color[$borderColor] : theme.color["gray"]["200"]) : ""};
  border-style: ${({ $isExpanded }) => ($isExpanded ? "solid" : "")};
  border-width: ${({ theme, $noFrame, $isExpanded }) =>
    $noFrame || !$isExpanded ? theme.borderWidth[1] : theme.borderWidth[4]};
  border-top: none;
`;
interface StyledContentAnimationWrap {
  $hideContent: boolean;
  $disableScroll?: boolean;
}
export const StyledContentAnimationWrap = styled(animated.div)<StyledContentAnimationWrap>`
  display: ${({ $hideContent }) => ($hideContent ? "none" : "inherit")};
  flex-direction: column;
  height: 100%;
  overflow: ${({ $disableScroll }) => ($disableScroll ? "hidden" : "auto")};
`;
interface StyledVerticalText {
  $showContentLabel: boolean;
}
export const StyledVerticalText = styled(animated.p)<StyledVerticalText>`
  position: absolute;
  top: ${({ theme }) => theme.space[14]};
  left: 0.4rem;
  display: ${({ $showContentLabel }) => ($showContentLabel ? "initial" : "none")};
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-family: Muni;
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  font-size: ${({ theme }) => theme.fontSize["base"]};
  color: ${({ theme }) => theme.color["gray"]["600"]};
`;
