import styled from "styled-components";

interface StyledDndWrapper {
  tempDisabled?: boolean;
}
export const StyledDndWrapper = styled.div<StyledDndWrapper>`
  background-color: ${({ tempDisabled }) =>
    tempDisabled ? "hotpink" : "transparent"};
`;
