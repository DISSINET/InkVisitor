import styled from "styled-components";

interface StyledWrapper {
  border?: boolean;
}
export const StyledWrapper = styled.div<StyledWrapper>`
  display: inline-flex;
  height: 2rem;
  border: ${({ theme, border }) =>
    border ? `${theme.borderWidth[1]} solid ${theme.color["grey"]}` : ""};
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  overflow: ${({ border }) => (border ? "hidden" : "")};
`;
