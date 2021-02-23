import styled from "styled-components";
import { space1, space2 } from "Theme/constants";

interface IBoxStyle {
  color: string;
}
export const StyledBox = styled.div<IBoxStyle>`
  position: relative;
  display: flex;
  flex-direction: column;
  border-color: ${({ theme, color }) => theme.colors[color]};
  border-style: solid;
  border-width: ${({ theme }) => theme.borderWidths[2]};
`;
export const Head = styled.div<IBoxStyle>`
  background-color: ${({ theme, color }) => theme.colors[color]};
  color: ${({ theme }) => theme.colors["white"]};
  font-weight: ${({ theme }) => theme.fontWeights["bold"]};
  padding: ${space2};
  font-size: ${({ theme }) => theme.fontSizes["lg"]};
  line-height: 1.75rem;
  /* font-family: muni; */
`;
export const Content = styled.div`
  background-color: ${({ theme }) => theme.colors["white"]};
  padding: ${space2};
  display: flex;
  flex-direction: column;
  overflow: auto;
  height: 100%;
`;
