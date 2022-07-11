import styled from "styled-components";
import { layoutWidthBreakpoint } from "Theme/constants";

interface StyledPage {
  layoutWidth: number;
}
export const StyledPage = styled.div<StyledPage>`
  width: ${({ layoutWidth }) => layoutWidth};
  /* TODO: check min width init settings */
  min-width: ${layoutWidthBreakpoint};
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

interface StyledContent {
  height?: number;
}
export const StyledContent = styled.div<StyledContent>`
  width: 100%;
  height: ${({ height }) => (height ? height : "")};
  overflow: hidden;
  display: flex;
  justify-content: center;
  position: relative;
  background-color: ${({ theme }) => theme.color["gray"]["200"]};
`;
