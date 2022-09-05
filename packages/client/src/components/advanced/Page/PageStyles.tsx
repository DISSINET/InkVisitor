import styled from "styled-components";
import { heightHeader, heightFooter } from "Theme/constants";

interface StyledPage {
  layoutWidth: number;
}
export const StyledPage = styled.div<StyledPage>`
  width: ${({ layoutWidth }) => (layoutWidth > 0 ? layoutWidth : "100%")};
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

interface StyledPageContent {
  height: number;
}
export const StyledPageContent = styled.div<StyledPageContent>`
  width: 100%;
  height: ${({ height }) =>
    height > 0
      ? height
      : `calc(100% - ${(heightHeader + heightFooter) / 10}rem)`};
  overflow: hidden;
  display: flex;
  position: relative;
  background-color: ${({ theme }) => theme.color["gray"]["200"]};
`;
