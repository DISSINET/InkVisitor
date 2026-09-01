import { CgClose } from "react-icons/cg";
import styled from "styled-components";

/** Width (px) the caret button occupies in the tab strip. */
export const OVERFLOW_TAB_WIDTH = 46;

interface StyledOverflowButton {
  $hasSelected?: boolean;
}
export const StyledOverflowButton = styled.button<StyledOverflowButton>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  flex-shrink: 0;
  width: ${OVERFLOW_TAB_WIDTH}px;
  cursor: pointer;
  background-color: ${({ theme, $hasSelected }) =>
    $hasSelected ? "transparent" : theme.color["gray"][100]};
  color: ${({ theme }) => theme.color["black"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-bottom: ${({ $hasSelected }) => ($hasSelected ? "none" : "")};
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  padding: 0;

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][300]};
  }
`;

export const StyledOverflowCount = styled.span`
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["gray"][700]};
`;

export const StyledOverflowList = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 14rem;
  max-width: 22rem;
  max-height: 40vh;
  overflow-y: auto;
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][500]};
  border-radius: 3px;
  box-shadow: ${({ theme }) => theme.boxShadow["normal"]};
`;

interface StyledOverflowRow {
  $isSelected?: boolean;
}
export const StyledOverflowRow = styled.div<StyledOverflowRow>`
  /* TypeBar positions itself absolutely against the nearest positioned box */
  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  padding: ${({ theme }) => theme.space[1]} ${({ theme }) => theme.space[2]};
  cursor: pointer;
  background-color: ${({ theme, $isSelected }) =>
    $isSelected ? theme.color["gray"][200] : "transparent"};

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][300]};
  }
`;

interface StyledOverflowLabel {
  $isItalic?: boolean;
}
export const StyledOverflowLabel = styled.span<StyledOverflowLabel>`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["black"]};
  font-style: ${({ $isItalic }) => ($isItalic ? "italic" : "")};
`;

export const StyledOverflowRowClose = styled(CgClose)`
  flex-shrink: 0;
  border-radius: 10px;
  padding: 1px;
  color: ${({ theme }) => theme.color["black"]};

  &:hover {
    background-color: ${({ theme }) => theme.color["gray"][400]};
  }
`;
