import styled from "styled-components";

interface StyledContentWrap {
  tagGroup: boolean;
}
export const StyledContentWrap = styled.div<StyledContentWrap>`
  margin: ${({ theme, tagGroup }) =>
    `${theme.space[2]} ${tagGroup ? theme.space[2] : theme.space[3]}`};
`;
