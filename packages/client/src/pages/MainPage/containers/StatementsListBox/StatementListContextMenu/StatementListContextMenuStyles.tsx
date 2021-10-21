import styled from "styled-components";
import { animated } from "react-spring";
import { collapsedPanelWidth, heightHeader } from "Theme/constants";
import { CgMenuBoxed } from "react-icons/cg";

interface StyledCgMenuBoxed {
  $inverted?: boolean;
}
export const StyledCgMenuBoxed = styled(CgMenuBoxed)<StyledCgMenuBoxed>`
  color: ${({ theme, $inverted }) =>
    $inverted ? theme.color["white"] : theme.color["primary"]};
  margin: ${({ theme }) => `${theme.space[1]} ${theme.space[1]}`};
  cursor: default;
`;
export const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
`;
interface StyledContextButtonGroup {
  $clientX: number;
  $clientY: number;
  $firstPanelExpanded: boolean;
  $panelWidths: number[];
}
export const StyledContextButtonGroup = styled(
  animated.div
)<StyledContextButtonGroup>`
  display: flex;
  flex-direction: row;
  position: absolute;
  top: ${({ $clientY }) => `${($clientY - heightHeader) / 10}rem`};
  left: ${({ $clientX, $firstPanelExpanded, $panelWidths }) =>
    `${
      ($clientX -
        ($firstPanelExpanded
          ? $panelWidths[0] + 110
          : collapsedPanelWidth + 110)) /
      10
    }rem`};
  z-index: 100;
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
`;
