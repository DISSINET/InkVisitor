import styled from "styled-components";
import { layoutWidthBreakpoint } from "Theme/constants";

interface StyledPage {
  layoutWidth: number;
}
export const StyledPage = styled.div<StyledPage>`
  width: ${({ layoutWidth }) => layoutWidth};
  min-width: ${layoutWidthBreakpoint};
  height: 100vh;
`;

interface StyledPanelWrap {}
export const StyledPanelWrap = styled.div`
  width: 100%;
  overflow: hidden;
  display: flex;
  position: relative;
`;
