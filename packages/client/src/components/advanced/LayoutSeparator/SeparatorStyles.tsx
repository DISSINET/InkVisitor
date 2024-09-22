import { animated } from "@react-spring/web";
import styled from "styled-components";

interface StyledPanelSeparator {
  $show: boolean;
}
export const StyledPanelSeparator = styled(animated.div)<StyledPanelSeparator>`
  position: absolute;
  background-color: ${({ theme }) => theme.color["success"]};
  background-color: ${({ $show, theme }) =>
    $show ? theme.color["success"] : theme.color["gray"][500]};
  z-index: 30;

  opacity: ${({ $show }) => ($show ? 1 : 0.4)};
  transition: opacity 0.3s ease;
`;

export const StyledLayoutSeparatorVertical = styled(StyledPanelSeparator)`
  width: ${({ $show, theme }) =>
    $show ? theme.borderWidth[4] : theme.borderWidth[2]};
  height: ${({ theme }) => `calc(100% - ${theme.borderWidth[2]})`};
  cursor: col-resize;
`;
export const StyledLayoutSeparatorHorizontal = styled(StyledPanelSeparator)`
  height: ${({ $show, theme }) =>
    $show ? theme.borderWidth[4] : theme.borderWidth[2]};
  width: ${({ theme }) => `calc(100% - ${theme.borderWidth[2]})`};
  cursor: row-resize;
`;
