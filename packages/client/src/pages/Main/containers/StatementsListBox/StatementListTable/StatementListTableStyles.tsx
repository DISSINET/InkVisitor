import { COLLAPSED_TABLE_WIDTH } from "Theme/constants";
import styled from "styled-components";

interface StyledTable {
  $isListMode: boolean;
}
export const StyledTable = styled.table<StyledTable>`
  min-width: ${({}) => `${COLLAPSED_TABLE_WIDTH / 10 - 2.5}rem`};
  border-spacing: 0;
  border-collapse: collapse;
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][500]};
  box-shadow: ${({ theme }) => theme.boxShadow["subtle"]};
  overflow-x: ${({ $isListMode }) => ($isListMode ? "auto" : "hidden")};
  /* margin-top: ${({ theme, $isListMode }) =>
    $isListMode ? "0" : theme.space[24]}; */
  margin-left: ${({ theme }) => theme.space[1]};
  margin-right: ${({ theme }) => theme.space[1]};
  transition: width 0.3s ease;
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
`;

interface StyledTr {
  $isOpened?: boolean;
  $isSelected?: boolean;
  opacity?: number;
}
export const StyledTr = styled.tr<StyledTr>`
  height: ${({ theme }) => theme.space[16]};
  background-color: ${({ theme, $isOpened, $isSelected }) =>
    $isOpened
      ? theme.color["tableOpened"]
      : $isSelected
      ? theme.color["tableSelection"]
      : theme.color["white"]};
  color: ${({ theme, $isOpened }) =>
    $isOpened ? theme.color["primary"] : theme.color["black"]};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  border-top: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-left: ${({ theme, $isOpened }) =>
    $isOpened ? "4px solid " + theme.color["success"] : ""};
  cursor: ${({ $isOpened }) => ($isOpened ? "default" : "pointer")};
  td:first-child {
    padding-left: ${({ $isOpened }) => (!$isOpened ? "0.9rem" : "")};
    width: 1%;
  }
  td:last-child {
    padding-right: ${({ theme }) => theme.space[4]};
  }
  &:hover {
    background-color: ${({ theme, $isSelected }) =>
      $isSelected
        ? theme.color["tableSelectionHover"]
        : theme.color["gray"][100]};
  }
`;

interface StyledTd {}
export const StyledTd = styled.td<StyledTd>`
  padding: ${({ theme }) => theme.space[2]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  height: ${({ theme }) => theme.space[16]};
`;

export const StyledTdMove = styled.td`
  width: 1%;
  padding-right: 0.5rem;
`;

interface StyledFocusedCircle {
  checked: boolean;
}
export const StyledFocusedCircle = styled.span<StyledFocusedCircle>`
  position: absolute;
  background-color: ${({ theme }) => theme.color.focusedCheckbox};
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  border: 1px solid ${({ theme }) => theme.color.focusedCheckbox};
  transform: translate(-50%, -50%);
  top: 50%;
  left: 50%;
`;
export const StyledCheckboxWrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${({ theme }) => theme.color["black"]};
  cursor: pointer;
`;

export const StyledAbbreviatedLabel = styled.div`
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  min-width: 5rem;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

export const StyledAnchor = styled.div`
  background-color: ${({ theme }) => theme.color.blue[400]};
  color: ${({ theme }) => theme.color.white};
  margin-right: 5px;
  display: inline-flex;
  padding: 2px;
  border-radius: 50%;
`;

export const StyledOrderCorrection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  width: 2rem;
  color: ${({ theme }) => theme.color["gray"]["800"]};
`;
