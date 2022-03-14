import styled from "styled-components";
import theme from "Theme/theme";

export const StyledTable = styled.table`
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][500]};
  box-shadow: ${({ theme }) => theme.boxShadow["subtle"]};
`;
export const StyledTHead = styled.thead`
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][500]};
  background: ${({ theme }) => theme.color["gray"][100]};
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledTh = styled.th`
  text-align: left;
  padding-right: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[2]};
  font-weight: normal;
`;

interface StyledTr {
  isOdd?: boolean;
  isSelected?: boolean;
  opacity?: number;
}
export const StyledTr = styled.tr<StyledTr>`
  background-color: ${({ theme, isSelected }) =>
    isSelected ? theme.color["invertedBg"]["info"] : theme.color["white"]};
  color: ${({ theme, isSelected }) =>
    isSelected ? theme.color["primary"] : theme.color["black"]};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-left: ${({ theme, isSelected }) =>
    isSelected ? "4px solid " + theme.color["success"] : ""};
  cursor: ${({ isSelected }) => (isSelected ? "default" : "pointer")};
  td:first-child {
    padding-left: ${({ theme }) => theme.space[1]};
  }
  :hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;
export const StyledTd = styled.td`
  padding: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[4]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledTdLastEdit = styled(StyledTd)`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
`;

// ROW EXPANDED
export const StyledSubRow = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.space[2]};
  background-color: ${({ theme }) => theme.color["gray"][200]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["black"]};
`;
export const StyledSubRowTd = styled.div`
  display: table-cell;
  padding-top: ${({ theme }) => `${theme.space[1]}`};
  padding-right: ${({ theme }) => `${theme.space[2]}`};
  padding-bottom: ${({ theme }) => `${theme.space[1]}`};
  padding-left: 0;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledActantGroup = styled.div`
  display: flex;
  flex-direction: column;
`;
interface StyledPropRow {
  level: 1 | 2 | 3;
}

const getIndentation = (level: 1 | 2 | 3) => {
  switch (level) {
    case 1:
      return theme.space[2];
    case 2:
      return theme.space[8];
    case 3:
      return theme.space[14];
  }
};

const getColor = (level: 1 | 2 | 3) => {
  switch (level) {
    case 1:
      return "hotpink";
    case 2:
      return "blue";
    case 3:
      return "green";
  }
};
export const StyledPropRow = styled.div<StyledPropRow>`
  margin-left: ${({ level }) => getIndentation(level)};
  margin-bottom: ${({ theme }) => theme.space[2]};
  display: flex;
  background-color: ${({ level }) => getColor(level)};
  height: 3rem;
  border: 1px dashed black;
  width: 100%;
`;
export const StyledPropGroup = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;
