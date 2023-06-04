import styled from "styled-components";

interface StyledWrapper {
  border?: boolean;
}
export const StyledWrapper = styled.div<StyledWrapper>`
  display: inline-flex;
  height: ${({ theme, border }) => (border ? theme.space[8] : theme.space[8])};
  border: ${({ theme, border }) =>
    border ? `${theme.borderWidth[1]} solid ${theme.color["grey"]}` : ""};
  border-radius: ${({ theme }) => theme.borderRadius["xs"]};
  overflow: ${({ border }) => (border ? "hidden" : "")};
`;

export const StyledBold = styled.span`
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
`;
