import styled from "styled-components";
import { space2 } from "Theme/constants";

interface ButtonGroup {
  noMarginRight?: boolean;
  column?: boolean;
  marginBottom?: boolean;
}
export const ButtonGroup = styled.div<ButtonGroup>`
  display: flex;
  flex-direction: ${({ column }) => (column ? "column" : "row")};
  margin-bottom: ${({ marginBottom, theme }) =>
    marginBottom ? theme.space[2] : ""};
  > button:not(:last-child),
  > span:not(:last-child) {
    margin-right: ${({ noMarginRight }) => (noMarginRight ? 0 : space2)};
  }
`;
