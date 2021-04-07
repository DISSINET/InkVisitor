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
  border-color: ${({ theme, color }) => theme.color[color]};
  border-style: solid;
  border-width: ${({ theme }) => theme.borderWidth[2]};
  width: ${({ width }) => `${width / 10}rem`};
  height: ${({ height }) => (height ? `${height / 10}rem` : "100%")};
`;
interface StyledHead {
  color: string;
}
export const StyledHead = styled.div<StyledHead>`
  background-color: ${({ theme, color }) => theme.color[color]};
  color: ${({ theme }) => theme.color["white"]};
  font-weight: ${({ theme }) => theme.fontWeight["medium"]};
  padding: ${space2};
  font-size: ${({ theme }) => theme.fontSize["base"]};
  line-height: 2rem;
  letter-spacing: 0.04rem;
  /* font-family: muni; */
`;
interface StyledContent {
  noPadding: boolean;
}
export const StyledContent = styled.div<StyledContent>`
  background-color: ${({ theme }) => theme.color["white"]};
  padding: ${({ theme, noPadding }) => (noPadding ? 0 : theme.space[2])};
  display: flex;
  flex-direction: column;
  overflow: auto;
  height: 100%;
  font-size: ${({ theme }) => theme.fontSize["base"]};
`;
