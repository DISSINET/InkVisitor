import { ImportMark } from "hooks/useEntityEditing";
import { importMarkCss } from "Theme/importMark";
import styled from "styled-components";

interface StyledRow {
  $isDragging: boolean;
  $importMark?: ImportMark;
}
export const StyledRow = styled.div<StyledRow>`
  position: relative;
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  opacity: ${({ $isDragging }) => ($isDragging ? 0.2 : 1)};
  ${importMarkCss}
`;

// action icons stack in the note's top-right corner, revealed on hover
export const StyledRowActions = styled.div`
  position: absolute;
  top: ${({ theme }) => theme.space[1]};
  right: ${({ theme }) => theme.space[1]};
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  transition: opacity 0.15s ease;

  ${StyledRow}:hover & {
    opacity: 1;
  }
`;

export const StyledDragHandle = styled.div`
  display: flex;
  align-items: center;
  cursor: move;
  font-size: ${({ theme }) => theme.fontSize["xxs"]};
  color: ${({ theme }) => theme.color["black"]};
`;
