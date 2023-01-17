import { CgPlayListRemove } from "react-icons/cg";
import { RiArrowDownCircleLine, RiArrowUpCircleLine } from "react-icons/ri";
import styled from "styled-components";

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
