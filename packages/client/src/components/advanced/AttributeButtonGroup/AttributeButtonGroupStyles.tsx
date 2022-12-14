import styled from "styled-components";

interface StyledPropButtonGroup {
  leftMargin?: boolean;
  rightMargin?: boolean;
  border?: boolean;
  round?: boolean;
  width?: number;
}
export const StyledPropButtonGroup = styled.div<StyledPropButtonGroup>`
  margin-left: ${({ theme, leftMargin }) =>
    leftMargin ? theme.space[3] : theme.space[0]};
  margin-right: ${({ theme, rightMargin }) =>
    rightMargin ? theme.space[3] : theme.space[0]};
  vertical-align: middle;
  display: inline-flex;
  border-radius: ${({ round }) => (round ? "8px" : "0")};
  border: ${({ border }) => (border ? "1px" : 0)} solid
    ${({ theme }) => theme.color["gray"][600]};
`;
