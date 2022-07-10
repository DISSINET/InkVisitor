import styled from "styled-components";
import { layoutWidthBreakpoint } from "Theme/constants";

interface StyledPage {
  layoutWidth: number;
}
export const StyledPage = styled.div<StyledPage>`
  width: ${({ layoutWidth }) => layoutWidth};
  min-width: ${layoutWidthBreakpoint};
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

interface StyledPanelWrap {}
export const StyledPanelWrap = styled.div`
  padding: 3rem;
  display: flex;
  flex-direction: column;
  flex: 1;
`;
