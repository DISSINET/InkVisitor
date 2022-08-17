import styled from "styled-components";
import {
  heightFooter,
  heightHeader,
  layoutWidthBreakpoint,
} from "Theme/constants";

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

interface StyledPageContent {
  height?: number;
}
export const StyledPageContent = styled.div<StyledPageContent>`
  width: 100%;
  height: ${({ height }) => (height ? height : "")};
  overflow: hidden;
  display: flex;
  position: relative;
  background-color: ${({ theme }) => theme.color["gray"]["200"]};
`;
