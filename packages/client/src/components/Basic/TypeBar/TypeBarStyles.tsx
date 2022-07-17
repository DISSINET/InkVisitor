import styled from "styled-components";

interface StyledTypeBar {
  entity: string;
  noMargin: boolean;
  isTemplate: boolean;
}
export const StyledTypeBar = styled.div<StyledTypeBar>`
  position: absolute;
  background-color: ${({ theme, entity }) => theme.color[entity]};
  width: 3px;
  left: ${({ noMargin }) => (noMargin ? 0 : "1px")};
  top: ${({ noMargin }) => (noMargin ? 0 : "1px")};
  bottom: ${({ noMargin, isTemplate }) =>
    isTemplate ? "50%" : noMargin ? 0 : "1px"};
`;
