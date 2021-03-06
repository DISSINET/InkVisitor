import styled from "styled-components";
import { space2 } from "Theme/constants";

interface ButtonGroup {
  noMargin?: boolean;
}
export const ButtonGroup = styled.div<ButtonGroup>`
  display: flex;
  button:not(:last-child) {
    margin-right: ${({ noMargin }) => (noMargin ? 0 : space2)};
  }
`;
