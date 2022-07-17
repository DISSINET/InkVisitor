import styled from "styled-components";

interface TagGroup {
  noMargin?: boolean;
  marginRight?: boolean;
}
export const TagGroup = styled.div<TagGroup>`
  display: flex;
  > div:not(:last-child) {
    margin-right: ${({ theme, noMargin }) => (noMargin ? 0 : theme.space[1])};
  }
`;
