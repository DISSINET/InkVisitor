import styled from "styled-components";

/** Floating UI root — positioning only, no transform (drag lives on the inner layer). */
export const StyledFindReplaceFloating = styled.div`
  width: 26rem;
  z-index: 100;
  pointer-events: none;
`;

/** Inner drag layer, styled like the annotator menu body. */
export const StyledFindReplaceDraggable = styled.div`
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

export const StyledFindReplaceHeader = styled.div`
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
export const StyledFindReplaceTitle = styled.div`
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

export const StyledFindReplaceBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  padding: ${({ theme }) => theme.space[1]};
`;

export const StyledFindReplaceRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
`;

/** Occurrence counter shown inside the find input, GDocs style. */
export const StyledFindReplaceResults = styled.div`
  display: flex;
  align-items: center;
  white-space: nowrap;
  padding-right: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color.gray["600"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

/** Search flags as a labelled column — words rather than icon-only toggles. */
export const StyledFindReplaceFlags = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[1]};
  padding-left: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.color["black"]};
  font-size: ${({ theme }) => theme.fontSize["xs"]};
`;

export const StyledFindReplaceFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[2]};
  padding-top: ${({ theme }) => theme.space[1]};
`;

/** Wraps a button so its Loader can be absolutely positioned over it. */
export const StyledFindReplaceButtonWrap = styled.div`
  position: relative;
`;
