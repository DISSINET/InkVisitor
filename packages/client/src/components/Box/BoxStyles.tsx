import styled from "styled-components";
import { space2 } from "Theme/constants";

interface IBoxStyle {
  color: string;
  width: number;
  height: number;
}
export const StyledBox = styled.div<IBoxStyle>`
  position: relative;
  display: flex;
  flex-direction: column;
  border-color: ${({ theme, color }) => theme.colors[color]};
  border-style: solid;
  border-width: ${({ theme }) => theme.borderWidths[2]};
  width: ${({ width }) => `${width / 10}rem`};
  height: ${({ height }) => (height ? `${height / 10}rem` : "100%")};
`;
interface StyledHead {
  color: string;
}
export const StyledHead = styled.div<StyledHead>`
  background-color: ${({ theme, color }) => theme.colors[color]};
  color: ${({ theme }) => theme.colors["white"]};
  font-weight: ${({ theme }) => theme.fontWeights["medium"]};
  padding: ${space2};
  font-size: ${({ theme }) => theme.fontSizes["base"]};
  line-height: 2rem;
  letter-spacing: 0.04rem;
  /* font-family: muni; */
`;
interface StyledContent {
  noPadding: boolean;
}
export const StyledContent = styled.div<StyledContent>`
  background-color: ${({ theme }) => theme.colors["white"]};
  padding: ${({ theme, noPadding }) => (noPadding ? 0 : theme.space[2])};
  display: flex;
  flex-direction: column;
  overflow: auto;
  height: 100%;
  font-size: ${({ theme }) => theme.fontSizes["base"]};
`;
