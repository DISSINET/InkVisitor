import { COLLAPSED_TABLE_WIDTH } from "Theme/constants";
import styled from "styled-components";

interface StyledTable {
  $isListMode: boolean;
}
export const StyledTable = styled.table<StyledTable>`
  min-width: ${({}) => `${COLLAPSED_TABLE_WIDTH / 10 - 2.5}rem`};
  height: 100%;
  border-spacing: 0;
  border-collapse: separate;
  border-width: ${({ theme }) => theme.borderWidth[1]};
  border-style: solid;
  border-color: ${({ theme }) => theme.color["gray"][500]};
  border-radius: ${({ theme }) => theme.borderRadius["input"]};
  box-shadow: ${({ theme }) => theme.boxShadow["subtle"]};
  overflow: hidden;
  margin-left: ${({ theme }) => theme.space[1]};
  margin-right: ${({ theme }) => theme.space[1]};
  margin-bottom: ${({ theme }) => theme.space[4]};
  transition: width 0.3s ease;
`;
export const StyledTHead = styled.thead`
  background: ${({ theme }) => theme.color["gray"][100]};
  color: ${({ theme }) => theme.color["gray"][700]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};

  th:nth-last-child(2) {
    width: 1%;
    white-space: nowrap;
  }
`;
export const StyledTh = styled.th`
  text-align: left;
  padding-right: ${({ theme }) => theme.space[2]};
  padding-left: ${({ theme }) => theme.space[2]};
  border-bottom: ${({ theme }) => theme.borderWidth[1]} solid
    ${({ theme }) => theme.color["gray"][500]};
`;

interface StyledTr {
  $isOpened?: boolean;
  $isSelected?: boolean;
  $isAnnotatorHovered?: boolean;
  opacity?: number;
  $listMode?: boolean;
}
export const StyledTr = styled.tr<StyledTr>`
  height: ${({ theme }) => theme.space[16]};
  background-color: ${({ theme, $isOpened, $isSelected }) =>
    $isOpened
      ? theme.color["tableOpened"]
      : $isSelected
        ? theme.color["tableSelection"]
        : theme.color["white"]};

  &:nth-child(odd) {
    background-color: ${({ theme, $isOpened, $isSelected }) =>
      $isOpened
        ? theme.color["tableOpened"]
        : $isSelected
          ? theme.color["tableSelection"]
          : theme.color["tableOddRow"]};
  }

  color: ${({ theme, $isOpened }) => ($isOpened ? theme.color["primary"] : theme.color["black"])};
  opacity: ${({ opacity }) => (opacity ? opacity : 1)};
  transition:
    box-shadow 0.2s ease-in-out,
    background-color 0.15s ease-in-out;
  box-shadow: ${({ theme, $isAnnotatorHovered }) =>
    `inset 0 0 0 2px ${$isAnnotatorHovered ? theme.color.primaryRGBA : theme.color.primaryRGBA0}`};
  cursor: ${({ $isOpened, $listMode }) => ($isOpened && $listMode ? "default" : "pointer")};

  &:not(:first-child) td {
    border-top: 1px solid ${({ theme }) => theme.color["gray"][300]};
  }
  td:first-child {
    position: relative;
    padding-left: 0.9rem;
    width: 1%;
  }
  td:first-child::before {
    content: "";
    position: absolute;
    left: 0;
    top: 5%;
    bottom: 5%;
    width: 4px;
    border-radius: 0 10px 10px 0;
    background-color: ${({ theme }) => theme.color["success"]};
    transform: scaleX(${({ $isOpened }) => ($isOpened ? 1 : 0)});
    transform-origin: left;
    opacity: ${({ $isOpened }) => ($isOpened ? 1 : 0)};
    transition:
      transform 0.15s ease-in-out,
      opacity 0.15s ease-in-out;
  }
  td:last-child {
    padding-right: ${({ theme }) => theme.space[4]};
  }
  td:nth-last-child(2) {
    width: 1%;
    white-space: nowrap;
  }
  &:hover {
    background-color: ${({ theme, $isOpened, $isSelected }) =>
      $isSelected
        ? theme.color["tableSelectionHover"]
        : $isOpened
          ? theme.color["tableOpened"]
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
  padding-right: 0.2rem;
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
  margin-left: 0.3rem;
  margin-right: 0.1rem;
`;
// keeps the checkbox above the absolutely-positioned focus circle
export const StyledSelectionCheckbox = styled.div`
  position: relative;
  z-index: 2;
  display: flex;
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
  max-width: 2.6rem;
  width: 100%;
  color: ${({ theme }) => theme.color["gray"]["800"]};
`;

// wraps tag cells so clicking/double-clicking a tag (e.g. to open its detail)
// does not bubble up and activate the statement row; width: fit-content keeps
// the clickable box hugging the tags so clicks in the empty cell space still
// reach the row
export const StyledTagCellWrap = styled.div`
  display: flex;
  width: fit-content;
  max-width: 100%;
`;
