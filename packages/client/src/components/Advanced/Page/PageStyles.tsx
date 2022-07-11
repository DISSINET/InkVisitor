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
