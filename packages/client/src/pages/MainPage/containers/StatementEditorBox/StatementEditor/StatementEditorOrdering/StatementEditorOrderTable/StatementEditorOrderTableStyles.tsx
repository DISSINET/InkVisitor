import { CgPlayListRemove } from "react-icons/cg";
import { RiArrowDownCircleLine, RiArrowUpCircleLine } from "react-icons/ri";
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

interface StyledTr {
  opacity?: number;
}
export const StyledTr = styled.tr<StyledTr>`
  background-color: ${({ theme }) => theme.color["white"]};
  color: ${({ theme }) => theme.color["black"]};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][500]};
  cursor: move;
  td:first-child {
    padding-left: ${({ theme }) => theme.space[1]};
  }
  td:first-child {
    width: 1%;
  }
  :hover {
    background-color: ${({ theme }) => theme.color["gray"][100]};
  }
`;
export const StyledTd = styled.td`
  padding: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[4]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;
export const StyledTdLastEdit = styled(StyledTd)`
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
`;

export const StyledButtonsWrap = styled.div`
  display: flex;
  align-items: center;
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
