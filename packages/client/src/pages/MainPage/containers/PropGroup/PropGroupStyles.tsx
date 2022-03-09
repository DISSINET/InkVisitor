import { FaGripVertical } from "react-icons/fa";
import styled from "styled-components";

interface StyledGrid {
  tempDisabled?: boolean;
}
export const StyledGrid = styled.div<StyledGrid>`
  display: grid;

  align-items: center;
  padding-left: ${({ theme }) => theme.space[10]};
  grid-template-columns: 1fr 1fr 7rem;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-bottom: ${({ theme }) => theme.space[1]};
  width: 100%;

  opacity: ${({ tempDisabled }) => (tempDisabled ? 0.2 : 1)};
`;

export const StyledGridCell = styled.div`
  margin: ${({ theme }) => theme.space[1]};
  display: grid;
`;

interface StyledListHeaderColumn {
  leftMargin?: boolean;
}
export const StyledListHeaderColumn = styled.div<StyledListHeaderColumn>`
  font-weight: ${({ theme }) => theme.fontWeight.light};
  margin-left: ${({ theme, leftMargin }) =>
    leftMargin ? theme.space[8] : theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["info"]};
  text-align: left;
  font-style: italic;
`;

interface StyledPropLineColumn {
  level?: 1 | 2 | 3;
  isTag?: boolean;
}
export const StyledPropLineColumn = styled(
  StyledGridCell
)<StyledPropLineColumn>`
  display: inline-flex;
  align-items: center;
  margin-left: ${({ theme, level = 1 }) => {
    if (level === 1) {
      return theme.space[0];
    } else if (level === 2) {
      return theme.space[6];
    } else if (level === 3) {
      return theme.space[12];
    }
  }};
  padding-right: 5px;
  overflow: ${({ isTag }) => (isTag ? "hidden" : "visible")};
  // border: 1px dashed hotpink;
`;

interface StyledPropButtonGroup {
  leftMargin?: boolean;
  rightMargin?: boolean;
  border?: boolean;
  round?: boolean;
}
export const StyledPropButtonGroup = styled.div<StyledPropButtonGroup>`
  margin-left: ${({ theme, leftMargin = true }) =>
    leftMargin ? theme.space[3] : theme.space[0]};
  margin-right: ${({ theme, rightMargin = true }) =>
    rightMargin ? theme.space[3] : theme.space[0]};
  vertical-align: middle;
  display: inline-flex;
  border-radius: ${({ round }) => (round ? "8px" : "0")};
  border: ${({ border }) => (border ? "1px" : 0)} solid
    ${({ theme }) => theme.color["gray"][600]};

  button:disabled,
  button[disabled] {
    //background-color: ${({ theme }) => theme.color["gray"][1000]};
  }
`;
export const StyledFaGripVertical = styled(FaGripVertical)`
  margin-right: ${({ theme }) => theme.space[2]};
  cursor: move;
`;
