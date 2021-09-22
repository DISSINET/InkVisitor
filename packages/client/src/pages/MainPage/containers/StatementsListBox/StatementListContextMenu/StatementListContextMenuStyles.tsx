import styled from "styled-components";
import { animated } from "react-spring";
import {
  collapsedPanelWidth,
  heightHeader,
  panelWidths,
} from "Theme/constants";
import { TiDocumentText } from "react-icons/ti";

interface StyledTiDocumentText {
  $inverted?: boolean;
}
export const StyledTiDocumentText = styled(
  TiDocumentText
)<StyledTiDocumentText>`
  color: ${({ theme }) => theme.color["primary"]};
  color: ${({ theme, $inverted }) =>
    $inverted ? theme.color["white"] : theme.color["primary"]};
  margin: ${({ theme }) => `${theme.space[1]} ${theme.space[1]}`};
  cursor: pointer;
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
}
export const StyledContextButtonGroup = styled(
  animated.div
)<StyledContextButtonGroup>`
  display: flex;
  flex-direction: row;
  position: absolute;
  top: ${({ $clientY }) => `${($clientY - heightHeader - 2) / 10}rem`};
  left: ${({ $clientX, $firstPanelExpanded }) =>
    `${
      ($clientX -
        ($firstPanelExpanded ? panelWidths[0] + 6 : collapsedPanelWidth + 64)) /
      10
    }rem`};
  z-index: 100;
`;
