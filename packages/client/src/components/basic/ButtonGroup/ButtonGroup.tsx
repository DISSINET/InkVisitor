import styled from "styled-components";
import { space2 } from "Theme/constants";

interface ButtonGroup {
  noMarginRight?: boolean;
  column?: boolean;
  marginBottom?: boolean;
  height?: number;
}
export const ButtonGroup = styled.div.attrs({
  className: "buttongroup",
})<ButtonGroup>`
  display: flex;
  height: ${({ height }) => (height ? `${height / 10}rem` : "")};
  flex-direction: ${({ column }) => (column ? "column" : "row")};
  margin-bottom: ${({ marginBottom, theme }) =>
    marginBottom ? theme.space[2] : ""};
  > button:not(:last-child),
  > span:not(:last-child) {
    margin-right: ${({ noMarginRight }) => (noMarginRight ? 0 : space2)};
  }
`;

export const ButtonGroups = styled.div`
  display: flex;
  .buttongroup {
    margin-left: ${({ theme }) => theme.space[1]};
  }
`;
