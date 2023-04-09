import styled from "styled-components";

interface StyledElvlWrapper {
  border?: boolean;
}
export const StyledElvlWrapper = styled.div<StyledElvlWrapper>`
  display: flex;
  border: ${({ theme, border }) =>
    border ? `${theme.borderWidth[1]} solid ${theme.color["grey"]}` : ""};
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  overflow: hidden;
`;
