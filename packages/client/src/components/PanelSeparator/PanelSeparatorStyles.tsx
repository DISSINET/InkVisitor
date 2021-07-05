import { animated } from "react-spring";
import styled from "styled-components";

interface StyledPanelSeparator {
  $xPosition?: number;
}
export const StyledPanelSeparator = styled(animated.div)<StyledPanelSeparator>`
  position: absolute;
  width: 4px;
  cursor: col-resize;
  height: 100%;
  background-color: hotpink;
  z-index: 30;
`;
// left: ${({ $xPosition }) => `${($xPosition - 2) / 10}rem`};
