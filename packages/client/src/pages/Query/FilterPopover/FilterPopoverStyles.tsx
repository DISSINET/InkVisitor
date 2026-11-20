import styled from "styled-components";

// `$fluid`: a custom trigger may shrink to its container, so its text can be cut
export const StyledFilterPopoverTrigger = styled.span<{ $fluid?: boolean }>`
  display: inline-flex;
  flex-shrink: 0;
  gap: ${({ theme }) => theme.space[1]};
  ${({ $fluid }) =>
    $fluid &&
    `
    align-items: center;
    flex-shrink: 1;
    min-width: 0;
    max-width: 100%;
  `}
`;

// Portaled into #page; position comes from floating-ui. maxHeight is applied
// inline by the size middleware, so the content scrolls instead of the panel
// spilling past the window.
export const StyledFilterPopoverPanel = styled.div<{ $width: string }>`
  z-index: 164;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[2]};
  width: ${({ $width }) => $width};
  max-width: calc(100vw - 2rem);
  min-height: 0;
  // the right side splits its padding around the scrollbar track: a thin
  // gutter outside it here, the rest inside it on the header and the body
  padding: ${({ theme }) => theme.space[3]};
  padding-right: ${({ theme }) => theme.space[1]};
  background-color: ${({ theme }) => theme.color["white"]};
  border: 1px solid ${({ theme }) => theme.color["gray"][400]};
  border-radius: ${({ theme }) => theme.borderRadius["sm"]};
  box-shadow: ${({ theme }) => theme.boxShadow["high"]};
`;

export const StyledFilterPopoverHeader = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: ${({ theme }) => theme.space[2]};
  padding-right: ${({ theme }) => theme.space[2]};
`;

export const StyledFilterPopoverTitle = styled.span`
  flex: 1;
  font-size: ${({ theme }) => theme.fontSize["sm"]};
  font-weight: ${({ theme }) => theme.fontWeight["bold"]};
  color: ${({ theme }) => theme.color["primary"]};
`;

export const StyledFilterPopoverClear = styled.button`
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSize["xs"]};
  color: ${({ theme }) => theme.color["primary"]};
  text-decoration: underline;
  &:hover {
    color: ${({ theme }) => theme.color["danger"]};
  }
`;

export const StyledFilterPopoverContent = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
`;

export const StyledFilterPopoverBody = styled.div`
  padding-right: ${({ theme }) => theme.space[2]};
`;
