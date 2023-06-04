import { FaGripVertical } from "react-icons/fa";
import styled from "styled-components";
import theme from "Theme/theme";

interface StyledGrid {
  tempDisabled?: boolean;
}
export const StyledGrid = styled.div<StyledGrid>`
  display: grid;

  align-items: flex-start;
  padding-left: ${({ theme }) => theme.space[0]};

  grid-template-columns: 20px repeat(4, auto) 1fr;
  width: fit-content;
  grid-template-rows: auto;
  grid-auto-flow: row;
  padding-bottom: ${({ theme }) => theme.space[1]};
  width: 100%;

  opacity: ${({ tempDisabled }) => (tempDisabled ? 0.2 : 1)};
  margin-bottom: ${({ theme }) => theme.space[2]};
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
  lowIdent?: boolean;
}
export const StyledPropLineColumn = styled.div<StyledPropLineColumn>`
  display: inline-flex;
  margin: ${({ theme }) => theme.space[1]};
  align-items: center;
  margin-left: ${({ level = 0, lowIdent = false }) =>
    getIndentation(level, lowIdent)};
  padding-right: 3px;
`;

export const StyledFaGripVertical = styled(FaGripVertical)`
  margin-right: ${({ theme }) => theme.space[2]};
  cursor: move;
`;

export const StyledAttributesFlexColumn = styled.div`
  display: inline-flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 13rem;
`;

interface StyledAttributesFlexRow {
  isTag?: boolean;
}
export const StyledAttributesFlexRow = styled.div<StyledAttributesFlexRow>`
  display: inline-flex;
  overflow: ${({ isTag }) => (isTag ? "hidden" : "")};
  flex-direction: row;
  align-items: center;
  gap: ${({ isTag }) => (isTag ? "" : "0.5rem")};
  height: ${({ theme }) => theme.space[10]};
`;
export const StyledTagGrid = styled.div`
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  height: ${({ theme }) => theme.space[10]};
`;
export const StyledBorderLeft = styled.div`
  border-left: 3px solid ${({ theme }) => theme.color.elementType.prop};
  padding-left: 3px;
`;
