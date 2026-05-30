import styled from "styled-components";

export const FLOATING_SEARCH_COLLAPSED_SIZE = 48;
export const FLOATING_SEARCH_EXPANDED_WIDTH = 220;
export const FLOATING_SEARCH_PAGE_PADDING = 16;

export const StyledFloatingRoot = styled.div<{ $left: number; $top: number }>`
  position: fixed;
  left: ${({ $left }) => $left}px;
  top: ${({ $top }) => $top}px;
  z-index: 160;
`;

export const StyledCollapsedButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${FLOATING_SEARCH_COLLAPSED_SIZE}px;
  height: ${FLOATING_SEARCH_COLLAPSED_SIZE}px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: ${({ theme }) => theme.color.primary};
  background-color: ${({ theme }) => theme.color.blue[100]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  transition:
    background-color 0.2s,
    box-shadow 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.color.blue[150]};
    box-shadow: ${({ theme }) => theme.boxShadow.normal};
  }
`;

export const StyledExpandedPanel = styled.div`
  display: flex;
  flex-direction: column;
  width: ${FLOATING_SEARCH_EXPANDED_WIDTH}px;
  max-width: calc(100vw - ${FLOATING_SEARCH_PAGE_PADDING * 2}px);
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background-color: ${({ theme }) => theme.color.blue[100]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  overflow: hidden;
`;

export const StyledExpandedHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[2]};
  border-bottom: 1px solid ${({ theme }) => theme.color.blue[150]};
  color: ${({ theme }) => theme.color.primary};
`;

export const StyledDragHandle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  flex: 1;
  min-width: 0;
  cursor: grab;
  touch-action: none;
  user-select: none;
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.color.gray[600]};

  &:active {
    cursor: grabbing;
  }
`;

export const StyledExpandedContent = styled.div`
  padding: ${({ theme }) => theme.space[3]};
  min-height: 6rem;
  max-height: min(70vh, 28rem);
  overflow-y: auto;
`;

export const StyledCloseButtonWrap = styled.span`
  display: flex;
  flex-shrink: 0;
`;
