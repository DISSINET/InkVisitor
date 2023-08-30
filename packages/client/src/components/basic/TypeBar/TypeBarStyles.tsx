import styled from "styled-components";

interface StyledTypeBar {
  entityColor: string;
  noMargin: boolean;
  isTemplate: boolean;
  dimColor: boolean;
}
export const StyledTypeBar = styled.div<StyledTypeBar>`
  position: absolute;
  background-color: ${({ theme, entityColor }) => theme.color[entityColor]};
  width: 3px;
  left: ${({ noMargin }) => (noMargin ? 0 : "1px")};
  top: ${({ noMargin }) => (noMargin ? 0 : "1px")};
  bottom: ${({ noMargin, isTemplate }) =>
    isTemplate ? "50%" : noMargin ? 0 : "1px"};
  opacity: ${({ dimColor }) => (dimColor ? 0.6 : 1)};
`;
