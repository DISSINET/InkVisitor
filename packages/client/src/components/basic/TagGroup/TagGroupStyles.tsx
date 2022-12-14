import styled from "styled-components";

interface StyledTagGroup {
  noMargin?: boolean;
  marginRight?: boolean;
}
export const StyledTagGroup = styled.div<StyledTagGroup>`
  display: flex;
  > div:not(:last-child) {
    margin-right: ${({ theme, noMargin }) => (noMargin ? 0 : theme.space[1])};
  }
`;
