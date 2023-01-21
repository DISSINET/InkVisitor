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

  grid-template-columns: 20px auto auto 1fr;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-bottom: ${({ theme }) => theme.space[1]};
  width: 100%;

  opacity: ${({ tempDisabled }) => (tempDisabled ? 0.2 : 1)};
`;

export const StyledNoEntity = styled.div`
  margin-left: ${({ theme }) => theme.space[4]};
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

const getIndentation = (level: 0 | 1 | 2 | 3, lowIdent?: boolean) => {
  switch (level) {
    case 0:
      return 0;
    case 1:
      return lowIdent ? theme.space[0] : theme.space[4];
    case 2:
      return lowIdent ? theme.space[4] : theme.space[8];
    case 3:
      return lowIdent ? theme.space[8] : theme.space[12];
  }
};
interface StyledPropLineColumn {
  level?: 0 | 1 | 2 | 3;
  isTag?: boolean;
  lowIdent?: boolean;
}
export const StyledPropLineColumn = styled.div<StyledPropLineColumn>`
  display: inline-flex;
  margin: ${({ theme }) => theme.space[1]};
  align-items: center;
  margin-left: ${({ level = 0, lowIdent = false }) =>
    getIndentation(level, lowIdent)};
  padding-right: 3px;
  overflow: ${({ isTag }) => (isTag ? "hidden" : "visible")};
`;

export const StyledFaGripVertical = styled(FaGripVertical)`
  margin-right: ${({ theme }) => theme.space[2]};
  cursor: move;
`;
