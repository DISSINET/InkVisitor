import { FaGripVertical } from "react-icons/fa";
import styled from "styled-components";
import theme from "Theme/theme";

interface StyledGrid {
  tempDisabled?: boolean;
}
export const StyledGrid = styled.div<StyledGrid>`
  display: grid;

  align-items: center;
  padding-left: ${({ theme }) => theme.space[0]};
  grid-template-columns: 1fr 1fr 10rem;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-bottom: ${({ theme }) => theme.space[1]};
  width: 100%;

  opacity: ${({ tempDisabled }) => (tempDisabled ? 0.2 : 1)};
`;

interface StyledListHeaderColumn {
  leftMargin?: boolean;
}
export const StyledListHeaderColumn = styled.div<StyledListHeaderColumn>`
  font-weight: ${({ theme }) => theme.fontWeight.light};
  margin-left: ${({ theme, leftMargin }) =>
    leftMargin ? theme.space[16] : theme.space[1]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  color: ${({ theme }) => theme.color["info"]};
  text-align: left;
  font-style: italic;
`;

const getIndentation = (level: 0 | 1 | 2 | 3) => {
  switch (level) {
    case 0:
      return 0;
    case 1:
      return theme.space[6];
    case 2:
      return theme.space[10];
    case 3:
      return theme.space[14];
  }
};
interface StyledPropLineColumn {
  level?: 0 | 1 | 2 | 3;
  isTag?: boolean;
}
export const StyledPropLineColumn = styled.div<StyledPropLineColumn>`
  display: inline-flex;
  margin: ${({ theme }) => theme.space[1]};
  align-items: center;
  margin-left: ${({ level = 0 }) => getIndentation(level)};
  padding-right: 3px;
  overflow: ${({ isTag }) => (isTag ? "hidden" : "visible")};
`;

interface StyledPropButtonGroup {
  border?: boolean;
  round?: boolean;
}
export const StyledPropButtonGroup = styled.div<StyledPropButtonGroup>`
  vertical-align: middle;
  display: inline-flex;
  border-radius: ${({ round }) => (round ? "8px" : "0")};
  border: ${({ border }) => (border ? "1px" : 0)} solid
    ${({ theme }) => theme.color["gray"][600]};
`;
export const StyledFaGripVertical = styled(FaGripVertical)`
  margin-right: ${({ theme }) => theme.space[2]};
  cursor: move;
`;
