import styled from "styled-components";

interface StyledTypeBar {
  entity: string;
  noMargin: boolean;
}
export const StyledTypeBar = styled.div<StyledTypeBar>`
  position: absolute;
  background-color: ${({ theme, entity }) => theme.color[entity]};
  width: 3px;
  left: ${({ noMargin }) => (noMargin ? 0 : "1px")};
  top: ${({ noMargin }) => (noMargin ? 0 : "1px")};
  bottom: ${({ noMargin }) => (noMargin ? 0 : "1px")};
`;
