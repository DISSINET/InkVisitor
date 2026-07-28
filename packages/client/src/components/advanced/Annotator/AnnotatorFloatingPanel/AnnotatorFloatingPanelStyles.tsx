import styled from "styled-components";

/** Floating UI root — positioning only, no transform (drag lives on the inner layer). */
export const StyledFloatingPanelRoot = styled.div`
  width: 26rem;
  z-index: 100;
  pointer-events: none;
`;

/** Inner drag layer, styled like the annotator menu body. */
export const StyledFloatingPanelDraggable = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  background-color: ${({ theme }) => theme.color.blue[100]};
  padding: ${({ theme }) => theme.space[2]};
  box-shadow: ${({ theme }) => theme.boxShadow.high};
  border-radius: 1rem;
  opacity: 0.95;

  &:hover {
    opacity: 1;
  }
  transition:
    opacity 0.5s,
    box-shadow 0.3s;
`;

export const StyledFloatingPanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[2]};
  padding-bottom: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color.gray["600"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

/**
 * The drag handle. Only the title grabs — the handle's pointerdown
 * preventDefault()s, so any button inside it would stop receiving clicks.
 */
export const StyledFloatingPanelTitle = styled.div`
  display: flex;
  align-items: center;
  flex-grow: 1;
  gap: ${({ theme }) => theme.space[1]};
  cursor: grab;
  touch-action: none;
  user-select: none;
  padding: ${({ theme }) => theme.space[1]};
  border-radius: ${({ theme }) => theme.borderRadius.default};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["sm"]};

  &:active {
    cursor: grabbing;
  }

  &:hover {
    background: ${({ theme }) => theme.color.blue["150"]};
  }
`;

export const StyledFloatingPanelBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[1]};
`;
