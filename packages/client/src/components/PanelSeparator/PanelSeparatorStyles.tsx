import styled from "styled-components";

interface StyledPanelSeparator {
  xPosition: number;
}
export const StyledPanelSeparator = styled.div<StyledPanelSeparator>`
  position: absolute;
  left: ${({ xPosition }) => `${(xPosition - 2) / 10}rem`};
  width: 4px;
  cursor: col-resize;
  height: 100%;
  background-color: hotpink;
  z-index: 100;
`;
