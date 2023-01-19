import { CgPlayListRemove } from "react-icons/cg";
import { RiArrowDownCircleLine, RiArrowUpCircleLine } from "react-icons/ri";
import styled from "styled-components";
import { ElementTypeColor } from "Theme/theme";

export const StyledTable = styled.table`
  width: 100%;
  border-spacing: 0;
  border-collapse: collapse;
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][500]};
  box-shadow: ${({ theme }) => theme.boxShadow["subtle"]};
`;

interface StyledTr {
  opacity?: number;
  noOrder?: boolean;
  borderColor?: keyof ElementTypeColor;
}
export const StyledTr = styled.tr<StyledTr>`
  background-color: ${({ theme, noOrder }) =>
    noOrder ? theme.color["gray"][200] : theme.color["white"]};
  color: ${({ theme }) => theme.color["black"]};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-right: 4px solid
    ${({ theme, borderColor }) =>
      borderColor ? ` ${theme.color.elementType[borderColor]}` : ""};
  cursor: ${({ noOrder }) => (noOrder ? "default" : "move")};
  td:first-child {
    width: 1%;
  }
  :hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;
export const StyledTd = styled.td`
  padding: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

export const StyledButtonsWrap = styled.div`
  display: flex;
  align-items: center;
`;

export const StyledMainColumn = styled.div`
  white-space: nowrap;
  display: flex;
`;
export const StyledInfoColumn = styled.div`
  text-align: right;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
`;
export const StyledTableTextGridCell = styled.div`
  display: grid;
  overflow: hidden;
  font-size: inherit;
`;
export const StyledTagWrap = styled.div`
  display: inline-flex;
  overflow: hidden;
`;
export const StyledSeparator = styled.div`
  width: ${({ theme }) => theme.space[1]};
`;
export const StyledInfoText = styled.div`
  margin-bottom: 0.1rem;
`;

export const StyledNoOrderHeading = styled.div`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  margin-bottom: 0.5rem;
  margin-top: 1.5rem;
`;

interface StyledRiArrowUpCircleLine {
  $isFirst: boolean;
}
export const StyledRiArrowUpCircleLine = styled(
  RiArrowUpCircleLine
)<StyledRiArrowUpCircleLine>`
  cursor: ${({ $isFirst }) => ($isFirst ? "default" : "pointer")};
  color: ${({ theme, $isFirst }) =>
    $isFirst ? theme.color.gray[400] : theme.color.gray[700]};
`;
interface StyledRiArrowDownCircleLine {
  $isLast: boolean;
}
export const StyledRiArrowDownCircleLine = styled(
  RiArrowDownCircleLine
)<StyledRiArrowDownCircleLine>`
  cursor: ${({ $isLast }) => ($isLast ? "default" : "pointer")};
  color: ${({ theme, $isLast }) =>
    $isLast ? theme.color.gray[400] : theme.color.gray[700]};
`;
export const StyledCgPlayListRemove = styled(CgPlayListRemove)`
  cursor: pointer;
  color: ${({ theme }) => theme.color.gray[700]};
`;
