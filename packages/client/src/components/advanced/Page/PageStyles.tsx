import styled from "styled-components";
import { heightHeader } from "Theme/constants";

interface StyledPage {}
export const StyledPage = styled.div<StyledPage>`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const StyledPageContent = styled.div<{ $fullHeight?: boolean }>`
  width: 100%;
  height: ${({ $fullHeight }) => ($fullHeight ? "100%" : `calc(100% - ${heightHeader / 10}rem)`)};
  overflow: hidden;
  display: flex;
  position: relative;
  background-color: ${({ theme }) => theme.color.pageBg};
`;
