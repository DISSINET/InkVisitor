import styled from "styled-components";

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
  isOpened?: boolean;
  isSelected?: boolean;
  opacity?: number;
}
export const StyledTr = styled.tr<StyledTr>`
  background-color: ${({ theme, isOpened, isSelected }) =>
    isOpened
      ? theme.color["invertedBg"]["info"]
      : isSelected
      ? theme.color["tableSelection"]
      : theme.color["white"]};
  color: ${({ theme, isOpened }) =>
    isOpened ? theme.color["primary"] : theme.color["black"]};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-left: ${({ theme, isOpened }) =>
    isOpened ? "4px solid " + theme.color["success"] : ""};
  cursor: ${({ isOpened }) => (isOpened ? "default" : "pointer")};
  td:first-child {
    padding-left: ${({ theme, isOpened }) => (isOpened ? "0.9rem" : "")};
    width: 1%;
  }
  :hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;
interface StyledTd {}
export const StyledTd = styled.td<StyledTd>`
  padding: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[4]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
`;
export const StyledTdMove = styled.td`
  cursor: move;
  width: 1%;
`;
export const StyledTdLastEdit = styled(StyledTd)`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
`;
