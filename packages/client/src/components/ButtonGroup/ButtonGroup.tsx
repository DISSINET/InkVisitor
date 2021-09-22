import styled from "styled-components";
import { space2 } from "Theme/constants";

interface ButtonGroup {
  noMargin?: boolean;
  column?: boolean;
}
export const ButtonGroup = styled.div<ButtonGroup>`
  display: flex;
  flex-direction: ${({ column }) => (column ? "column" : "row")};
  button:not(:last-child),
  span:not(:last-child) {
    margin-right: ${({ noMargin }) => (noMargin ? 0 : space2)};
  }
`;
