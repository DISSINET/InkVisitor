import styled from "styled-components";

interface StyledTypeBar {
  entity: string;
}
export const StyledTypeBar = styled.div<StyledTypeBar>`
  position: absolute;
  background-color: ${({ theme, entity }) => theme.color[entity]};
  width: 3px;
  left: 1px;
  top: 1px;
  bottom: 1px;
`;
